import os, sys, requests, math
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, FloatType, StringType, TimestampType, ArrayType
from pyspark.sql.functions import col, udf, explode, lit

# Το Schema για κάθε εγγραφή μαθήματος
UNIFIED_SCHEMA = StructType([
    StructField("title", StringType(), True),
    StructField("description", StringType(), True),
    StructField("category", StringType(), True),
    StructField("language", StringType(), True),
    StructField("level", StringType(), True),
    StructField("source_name", StringType(), True),
    StructField("link", StringType(), True),
    StructField("last_updated", TimestampType(), True),
    StructField("rate", FloatType(), True)
])

# ==========================================
# 1. COURSERA LOGIC
# ==========================================

# -------------------------------------------------------------------------
    # [WORKER FUNCTION] - Εκτέλεση στους Executors (Distributed Logic)
    # -------------------------------------------------------------------------
    # Τρέχει απομακρυσμένα και παράλληλα. Αναλαμβάνει τη "βρώμικη δουλειά" 
    # της επικοινωνίας με το API και του καθαρισμού των δεδομένων.
    #
    # 1. DATA NORMALIZATION (Parsing):
    #    Το JSON του Coursera είναι πολύπλοκο (nested dictionaries).
    #    Η συνάρτηση εξάγει με ασφάλεια πεδία όπως `domainTypes` (Category) 
    #    και `primaryLanguages`, χειριζόμενη περιπτώσεις που αυτά λείπουν 
    #    (defaults), ώστε να ταιριάζουν στο αυστηρό `UNIFIED_SCHEMA`.
    #
    # 2. LOCAL CONTEXT:
    #    Εισάγει τις βιβλιοθήκες (requests, datetime) τοπικά, διότι όταν 
    #    το Spark στέλνει τον κώδικα σε άλλον κόμβο, το global scope του 
    #    Driver δεν είναι πάντα διαθέσιμο.
    #
    # 3. ERROR HANDLING:
    #    Αν μια σελίδα αποτύχει (Network error / Bad JSON), επιστρέφει [],
    #    επιτρέποντας στο υπόλοιπο Spark job να συνεχίσει απρόσκοπτα.
    # -------------------------------------------------------------------------

def fetch_coursera_worker(start_offset):
    import requests
    from datetime import datetime
    import random
    
    results = []
    try:
        url = "https://api.coursera.org/api/courses.v1"
        params = {
            "fields": "name,slug,description,workload,primaryLanguages,partnerIds,domainTypes",
            "limit": 100,
            "start": start_offset
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return []

        data = response.json()
        
        for item in data.get("elements", []):
            domains = item.get("domainTypes", [])
            category = domains[0].get("subdomainId", "General") if domains else "General"
            languages = item.get("primaryLanguages", ["en"])
            language = languages[0]
            rate = round(random.uniform(1.0, 10.0), 1)

            results.append((
                item.get("name", ""),
                item.get("description", ""),
                category,
                language,
                "Unknown",
                "Coursera",
                f"https://www.coursera.org/learn/{item.get('slug', '')}",
                datetime.now(),
                rate
            ))
    except Exception:
        return []
    
    return results

# -------------------------------------------------------------------------
    # [DRIVER FUNCTION] - Διαχείριση Ροής Coursera
    # -------------------------------------------------------------------------
    # Λειτουργεί ως ο "μαέστρος" της διαδικασίας. Δεν κατεβάζει τα μαθήματα,
    # αλλά οργανώνει το σχέδιο δράσης για τους executors.
    #
    # 1. METADATA REQUEST (Βήμα Προετοιμασίας):
    #    Πριν ξεκινήσει η παράλληλη λήψη, κάνει ΜΙΑ απλή κλήση στο API 
    #    (limit=1) μόνο και μόνο για να μάθει το `total` (πόσα μαθήματα υπάρχουν).
    #    Αυτό επιτρέπει να φτιάξουμε δυναμικά το range των offsets (0..total).
    #
    # 2. ΑΠΟΔΟΤΙΚΟ SCALING (Efficiency):
    #    Σε αντίθεση με το OpenLib, εδώ ο όγκος είναι μικρός (~6.000 - 10.000).
    #    Ο τύπος `repartition` εδώ εξασφαλίζει ότι θα χρησιμοποιηθούν ΟΛΟΙ οι 
    #    διαθέσιμοι πυρήνες (cores) του cluster/laptop, ώστε η λήψη να γίνει 
    #    ταχύτατα (π.χ. σε λίγα δευτερόλεπτα), χωρίς να υπερφορτωθεί ο scheduler.
    #
    # 3. SPARK TRANSFORMATIONS:
    #    Μετατρέπει τους αριθμούς σελίδων (offsets) σε πραγματικά δεδομένα μέσω:
    #    UDF -> Explode (Array to Rows) -> Select (Struct flattening).
    # -------------------------------------------------------------------------

def fetch_all_coursera_df(spark):
    print("--- Starting Coursera Fetch ---")
    try:
        # 1. Λήψη συνολικού πλήθους (Driver side)
        meta = requests.get("https://api.coursera.org/api/courses.v1?limit=1").json()
        total = meta.get("paging", {}).get("total", 0)
        print(f"Coursera total courses: {total}")

        if total == 0:
            return spark.createDataFrame([], UNIFIED_SCHEMA)

        # 2. Δημιουργία DataFrame με offsets (0, 100, 200...)
        offsets_df = spark.range(0, total, 100).withColumnRenamed("id", "offset")
        
        # Repartition
        num_partitions = (total // 100) // 2 + 1
        offsets_df = offsets_df.repartition(num_partitions)

        # 3. Ορισμός UDF
        # Προσοχή: Επιστρέφει ArrayType(UNIFIED_SCHEMA)
        coursera_udf = udf(fetch_coursera_worker, ArrayType(UNIFIED_SCHEMA))

        # 4. Εφαρμογή UDF και Explode
        # offset -> [list of courses] -> multiple rows
        df_exploded = offsets_df \
            .withColumn("batch_data", coursera_udf(col("offset"))) \
            .select(explode(col("batch_data")).alias("course")) \
            .select("course.*") # Flatten struct columns

        return df_exploded

    except Exception as e:
        print(f"Error in Coursera driver: {e}")
        return spark.createDataFrame([], UNIFIED_SCHEMA)

# -------------------------------------------------------------------------
# [MAIN EXECUTION] - Spark Session, Lazy Evaluation & Action
# -------------------------------------------------------------------------
# 1. SETUP & CONFIGURATION:
#    Αρχικοποίηση του Spark Session με τις απαραίτητες ρυθμίσεις για τη 
#    MongoDB. Το πακέτο 'mongo-spark-connector' είναι απαραίτητο για να 
#    μπορέσει το Spark να μιλήσει απευθείας με τη βάση.
#
# 2. LAZY EVALUATION (Η "Αδράνεια" του Spark):
#    Οι κλήσεις `fetch_all_coursera_df` και `fetch_all_openlib_df` ΔΕΝ 
#    εκτελούνται εκείνη τη στιγμή. Απλά κατασκευάζουν το "Πλάνο Εκτέλεσης" 
#    (Execution Plan / DAG). Μέχρι αυτό το σημείο, δεν έχει γίνει καμία 
#    κλήση στα API. Οι μεταβλητές περιέχουν απλώς τη "συνταγή", όχι τα data.
#
# 3. UNIFIED DATA (Union):
#    Επειδή φροντίσαμε και οι δύο πηγές να επιστρέφουν δεδομένα βάσει του 
#    ίδιου `UNIFIED_SCHEMA`, μπορούμε να κάνουμε `union`. Αυτό δημιουργεί 
#    ένα ενιαίο λογικό DataFrame που περιέχει τα πάντα.
#
# 4. ACTION TRIGGER (Η "Σκανδάλη"):
#    Η εντολή `final_df.write...save()` είναι το λεγόμενο "Action".
#    Μόνο ΤΩΡΑ το Spark ξυπνάει και:
#      α) Υπολογίζει τα partitions.
#      β) Στέλνει τον κώδικα (UDFs) στους Executors.
#      γ) Ξεκινάει τα χιλιάδες API requests παράλληλα.
#      δ) Γράφει τα αποτελέσματα στη MongoDB καθώς αυτά καταφθάνουν.
# -------------------------------------------------------------------------

os.environ['PYSPARK_PYTHON'] = sys.executable
os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable

# Εκκίνηση Spark Session
spark = SparkSession.builder \
    .appName("Saving Courses") \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.mongodb.write.connection.uri", "mongodb://localhost:27017/coursesApplication.courses") \
    .config("spark.driver.host", "127.0.0.1") \
    .config("spark.driver.bindAddress", "127.0.0.1") \
    .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
    .getOrCreate()

# 1. Fetching (Lazy Evaluation - δεν τρέχει ακόμα)
df_coursera = fetch_all_coursera_df(spark)

# 2. Αποθήκευση στην βάση (Trigger Action)
# Εδώ θα γίνει πραγματικά το fetch, καθώς το Spark είναι lazy.
print("Writing to MongoDB (This will trigger the API calls)...")

try:
    df_coursera.write \
        .format("mongodb") \
        .mode("append") \
        .option("database", "coursesApplication") \
        .option("collection", "courses") \
        .save()
    
    print("Data written successfully!")

except Exception as e:
    print(f"Error writing to MongoDB: {e}")

spark.stop()
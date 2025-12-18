import requests
import math
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, TimestampType, ArrayType, IntegerType
from pyspark.sql.functions import col, udf, explode, lit
import sys
import os

os.environ['PYSPARK_PYTHON'] = sys.executable
os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable

# --- UNIFIED SCHEMA ---
UNIFIED_SCHEMA = StructType([
    StructField("title", StringType(), True),
    StructField("description", StringType(), True),
    StructField("category", StringType(), True),
    StructField("language", StringType(), True),
    StructField("level", StringType(), True),
    StructField("source_name", StringType(), True),
    StructField("link", StringType(), True),
    StructField("last_updated", TimestampType(), True)
])


# ==========================================
# 1. COURSERA LOGIC (Χωρίς Αλλαγές)
# ==========================================
def fetch_coursera_worker(start_offset):
    import requests
    from datetime import datetime
    results = []
    try:
        url = "https://api.coursera.org/api/courses.v1"
        params = {
            "fields": "name,slug,description,workload,primaryLanguages,partnerIds,domainTypes",
            "limit": 100,
            "start": start_offset
        }
        response = requests.get(url, params=params)
        if response.status_code != 200: return []
        data = response.json()
        for item in data.get("elements", []):
            domains = item.get("domainTypes", [])
            category = domains[0].get("subdomainId", "General") if domains else "General"
            languages = item.get("primaryLanguages", ["en"])
            results.append((
                item.get("name", ""),
                item.get("description", ""),
                category,
                languages[0],
                "Unknown",
                "Coursera",
                f"https://www.coursera.org/learn/{item.get('slug', '')}",
                datetime.now()
            ))
    except Exception:
        return []
    return results


def fetch_all_coursera_df(spark):
    print("--- Starting Coursera Fetch ---")
    try:
        meta = requests.get("https://api.coursera.org/api/courses.v1?limit=1").json()
        total = meta.get("paging", {}).get("total", 0)
        print(f"Coursera total courses: {total}")
        if total == 0: return spark.createDataFrame([], UNIFIED_SCHEMA)

        offsets_df = spark.range(0, total, 100).withColumnRenamed("id", "offset")
        offsets_df = offsets_df.repartition((total // 100) // 2 + 1)

        coursera_udf = udf(fetch_coursera_worker, ArrayType(UNIFIED_SCHEMA))

        return offsets_df \
            .withColumn("batch_data", coursera_udf(col("offset"))) \
            .select(explode(col("batch_data")).alias("course")) \
            .select("course.*")
    except Exception as e:
        print(f"Error in Coursera: {e}")
        return spark.createDataFrame([], UNIFIED_SCHEMA)


# ==========================================
# 2. OPEN LIBRARY LOGIC (MODIFIED)
# ==========================================

# Οι 20 κατηγορίες (Ανανεωμένες με ακαδημαϊκά θέματα)
CATEGORIES = [
    # Θετικές Επιστήμες
    "computer_science", "mathematics", "physics", "chemistry", "biology",

    # Εφαρμοσμένες Επιστήμες & Υγεία
    "medicine", "engineering", "architecture", "education", "management",

    # Ανθρωπιστικές & Κοινωνικές
    "history", "art", "music", "law", "economics",
    "psychology", "philosophy", "political_science", "anthropology", "sociology"
]


# -------------------------------------------------------------------------
# [WORKER] - Δέχεται ΚΑΙ την κατηγορία ΚΑΙ το offset
# -------------------------------------------------------------------------
def fetch_openlib_worker_multi(category, offset):
    import requests
    from datetime import datetime

    results = []
    try:
        # Δυναμικό URL βάσει κατηγορίας
        url = f"https://openlibrary.org/subjects/{category}.json"
        params = {"limit": 100, "offset": offset, "details": "true"}

        response = requests.get(url, params=params, timeout=30)
        if response.status_code != 200:
            return []

        data_json = response.json()

        # Καθαρισμός ονόματος κατηγορίας (π.χ. computer_science -> Computer Science)
        clean_category = category.replace("_", " ").title()

        for item in data_json.get("works", []):
            title = item.get("title", "Unknown Title")
            subjects = item.get("subject", [])
            description = f"Topics: {', '.join(subjects[:5])}" if subjects else "No description available"
            key = item.get("key", "")
            link = f"https://openlibrary.org{key}" if key else "https://openlibrary.org"

            results.append((
                title,
                description,
                clean_category,  # Χρησιμοποιούμε τη δυναμική κατηγορία
                "en",
                "N/A",
                "OpenLibrary",
                link,
                datetime.now()
            ))
    except Exception:
        return []

    return results


# -------------------------------------------------------------------------
# [DRIVER] - Δημιουργία Tasks (20 κατηγορίες * 10 σελίδες)
# -------------------------------------------------------------------------
def fetch_all_openlib_multi_df(spark):
    print("--- Starting Multi-Category Open Library Fetch ---")

    # 1. Φτιάχνουμε DataFrame με τις 20 κατηγορίες
    cats_df = spark.createDataFrame([(c,) for c in CATEGORIES], ["category_slug"])

    # 2. Φτιάχνουμε DataFrame με τα offsets (0, 100, ..., 900) για να πάρουμε 1000 εγγραφές
    # range(0, 1000, 100) -> 0, 100, 200 ... 900 (10 calls των 100 βιβλίων = 1000 βιβλία)
    offsets_df = spark.range(0, 1000, 100).withColumnRenamed("id", "offset_val")

    # 3. Cross Join: Κάθε κατηγορία συνδυάζεται με κάθε offset
    # Αποτέλεσμα: 20 κατηγορίες * 10 offsets = 200 tasks
    tasks_df = cats_df.crossJoin(offsets_df)

    # Repartition: 1 partition ανά 5 tasks περίπου για καλή κατανομή
    tasks_df = tasks_df.repartition(40)

    # 4. Ορισμός UDF που δέχεται ΔΥΟ ορίσματα (String, Int)
    openlib_udf = udf(fetch_openlib_worker_multi, ArrayType(UNIFIED_SCHEMA))

    # 5. Εκτέλεση
    df_exploded = tasks_df \
        .withColumn("batch_data", openlib_udf(col("category_slug"), col("offset_val"))) \
        .select(explode(col("batch_data")).alias("book")) \
        .select("book.*")

    return df_exploded


# ==========================================
# 3. MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    spark = SparkSession.builder \
        .appName("Saving Courses Multi-Category") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
        .config("spark.mongodb.write.connection.uri", "mongodb://localhost:27017/coursesApplication.courses") \
        .getOrCreate()

    # 1. Fetch Coursera
    df_coursera = fetch_all_coursera_df(spark)

    # 2. Fetch OpenLibrary (20 categories x 1000 books)
    df_openlib = fetch_all_openlib_multi_df(spark)

    # 3. Union
    print("Unioning DataFrames...")
    final_df = df_coursera.union(df_openlib)

    # 4. Save
    print("Writing to MongoDB...")
    try:
        final_df.write \
            .format("mongodb") \
            .mode("append") \
            .option("database", "coursesApplication") \
            .option("collection", "courses") \
            .save()
        print("Data written successfully!")
    except Exception as e:
        print(f"Error writing to MongoDB: {e}")

    spark.stop()
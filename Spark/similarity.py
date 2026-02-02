import sys
import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, concat_ws, struct, collect_list, rank, lower, regexp_replace
from pyspark.sql.window import Window
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF, Normalizer, BucketedRandomProjectionLSH
from pyspark.ml import Pipeline

# Ρυθμίσεις περιβάλλοντος
os.environ['PYSPARK_PYTHON'] = sys.executable
os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable


def update_courses_with_category_filter():
    # 1. Spark Init
    print("--- Initializing Spark Session (Category Filtered)... ---")
    spark = SparkSession.builder \
        .appName("Course Similarity with Category Filter") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
        .config("spark.mongodb.read.connection.uri", "mongodb://localhost:27017/coursesApplication.courses") \
        .config("spark.mongodb.write.connection.uri", "mongodb://localhost:27017/coursesApplication.courses") \
        .getOrCreate()

    # 2. Φόρτωση
    print("--- Reading Data... ---")
    df = spark.read.format("mongodb").load()

    # 3. Preprocessing & Selection
    df_clean = df.select(
        col("_id").alias("course_id"),
        col("title"),
        col("link"),
        col("category"),
        concat_ws(" ", col("title"), col("description")).alias("raw_text")
    ).dropna(subset=["raw_text"]).repartition(100)

    # === Η ΔΙΟΡΘΩΣΗ ΕΔΩ ===
    # Δημιουργούμε τη στήλη 'text_content' που περιμένει ο Tokenizer.
    # Χρησιμοποιούμε μόνο lower() για να κρατήσουμε τα Ελληνικά (χωρίς regex που τα σβήνει).
    df_clean = df_clean.withColumn("text_content", lower(col("raw_text")))

    # 4. Vectors (TF-IDF)
    print("--- Building Vectors... ---")
    # Τώρα το inputCol="text_content" θα βρει τη στήλη και θα δουλέψει
    tokenizer = Tokenizer(inputCol="text_content", outputCol="words")
    remover = StopWordsRemover(inputCol="words", outputCol="filtered_words")
    hashingTF = HashingTF(inputCol="filtered_words", outputCol="rawFeatures", numFeatures=1024)
    idf = IDF(inputCol="rawFeatures", outputCol="idfFeatures")
    normalizer = Normalizer(inputCol="idfFeatures", outputCol="features", p=2.0)

    pipeline = Pipeline(stages=[tokenizer, remover, hashingTF, idf, normalizer])
    model = pipeline.fit(df_clean)

    # Cache τα δεδομένα
    vectorized_df = model.transform(df_clean).select("course_id", "title", "link", "category", "features").cache()

    print(f"Vectors ready. Processing {vectorized_df.count()} courses.")

    # 5. LSH Matching
    print("--- Running LSH... ---")
    brp = BucketedRandomProjectionLSH(inputCol="features", outputCol="hashes", bucketLength=1.0, numHashTables=3)
    lsh_model = brp.fit(vectorized_df)

    print("--- Joining with Category Constraint... ---")

    # Join με φίλτρο κατηγορίας
    matches = lsh_model.approxSimilarityJoin(vectorized_df, vectorized_df, threshold=1.1 , distCol="EuclideanDistance") \
        .filter(col("datasetA.course_id") != col("datasetB.course_id")) \
        .filter(col("datasetA.category") == col("datasetB.category"))

    matches_with_score = matches.select(
        col("datasetA.course_id").alias("id"),
        col("datasetB.title").alias("similar_title"),
        col("datasetB.link").alias("similar_link"),
        (1.0 - (col("EuclideanDistance") ** 2) / 2.0).alias("similarity_score")
    )

    # 6. Top-5 Ranking
    print("--- Ranking Top 5 per Course... ---")
    w = Window.partitionBy("id").orderBy(col("similarity_score").desc())
    ranked_matches = matches_with_score.withColumn("rank", rank().over(w)).filter(col("rank") <= 5)

    # 7. Aggregation
    grouped_data = ranked_matches.groupBy("id").agg(
        collect_list(
            struct(
                col("similar_title").alias("title"),
                col("similar_link").alias("link"),
                col("similarity_score").alias("score")
            )
        ).alias("similar_courses")
    )

    final_update_df = grouped_data.select(
        col("id").alias("_id"),
        col("similar_courses")
    )

    # 8. Update DB
    print("--- Updating MongoDB... ---")
    final_update_df.write.format("mongodb") \
        .option("database", "coursesApplication") \
        .option("collection", "similarCourses") \
        .mode("overwrite") \
        .save()

    vectorized_df.unpersist()
    print("--- Update Complete with Category Filter! ---")
    spark.stop()


if __name__ == "__main__":
    update_courses_with_category_filter()
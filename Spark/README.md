# Spark: Data Processing & Machine Learning
>Τεχνολογίες: Apache Spark, PySpark, MLlib (TF-IDF & LSH) & ETL Pipelines.

Ο φάκελος αυτός περιέχει την core λειτουργικότητα του project, υλοποιημένη σε **PySpark**. Εδώ πραγματοποιείται η συλλογή δεδομένων (ETL/Harvesting) και η εκτέλεση των αλγορίθμων Μηχανικής Μάθησης για το σύστημα συστάσεων (Recommendations).

## 1. `saving_to_mongodb.py` (ETL & Aggregation)
Το αρχείο αυτό είναι υπεύθυνο για το **Harvesting** δεδομένων από εξωτερικά APIs (Coursera, OpenLibrary) και την αποθήκευσή τους στη MongoDB.

**Πώς λειτουργεί (Driver/Worker Model):**
Ο κώδικας ακολουθεί την κατανεμημένη λογική του Spark:
1. **Unified Schema:** Ορίζεται κοινή δομή δεδομένων για να ενοποιηθούν οι διαφορετικές πηγές.
2. **Driver Node:** Υπολογίζει τον συνολικό όγκο δεδομένων (pagination) και δημιουργεί tasks (offsets).
3. **Worker Nodes (UDFs):** Ο Driver αναθέτει στους Workers να καλέσουν τα APIs παράλληλα για κάθε σελίδα δεδομένων.
4. **Union & Write:** Τα δεδομένα ενοποιούνται σε ένα τελικό DataFrame και αποθηκεύονται στο collection `courses`.

## 2. `similarity.py` (Machine Learning Pipeline)
Υλοποιεί το σύστημα συστάσεων χρησιμοποιώντας **Content-Based Filtering**. Στόχος είναι να βρει τα 5 πιο παρόμοια μαθήματα για κάθε μάθημα στη βάση.

**Η διαδικασία (Pipeline):**
1. **Preprocessing:** Ανάγνωση τίτλων και περιγραφών από τη MongoDB.
2. **Vectorization (TF-IDF):**
   * **Tokenizer:** Σπάσιμο κειμένου σε λέξεις.
   * **StopWordsRemover:** Αφαίρεση κοινών λέξεων (the, and, etc.).
   * **HashingTF & IDF:** Μετατροπή των λέξεων σε αριθμητικά διανύσματα (vectors). Το Cosine Similarity απαιτεί αριθμητική είσοδο.
3. **LSH (Locality Sensitive Hashing):**
   * Χρησιμοποιείται `BucketedRandomProjectionLSH` για τη μείωση του υπολογιστικού κόστους.
   * Αντί να συγκρίνουμε κάθε μάθημα με όλα τα άλλα ($N^2$), το LSH τοποθετεί τα παρόμοια διανύσματα σε κοινούς "κουβάδες" (buckets).
4. **Matching:** Υπολογισμός Ευκλείδειας απόστασης (σε normalized vectors) μόνο για τα μαθήματα της ίδιας κατηγορίας.
5. **Output:** Τα αποτελέσματα αποθηκεύονται στο collection `similarCourses`.
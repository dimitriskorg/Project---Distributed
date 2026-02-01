# Οριζόντιο Repository/Aggregator Ανοικτών Μαθημάτων
> Large-Scale ML εφαρμογή με React, Node.js και Apache Spark.

## Δομή
* **Backend**: Node.js API server.
* **Frontend**: React-based web app (Vite).
* **Spark**: Κώδικες για τις βασικές λειτουργίες ML (Similarity & Recommendations).

## Quick Start

### 1. Απαραίτητα Προγράμματα
Για να τρέξεις το project χρειάζεται να έχεις εγκατεστημένα:

* [Node.js](https://nodejs.org/en/download)
* [React](https://www.geeksforgeeks.org/installation-guide/how-to-install-reactjs-on-windows/)
* [Spark](https://spark.apache.org/docs/latest/api/python/getting_started/install.html)
* [MongDB]()

### 2. Προετοιμασία Βάσης Δεδομένων (MongoDB)
Πριν ξεκινήσεις τους servers, δημιούργησε μια βάση δεδομένων:
* **Όνομα Βάσης:** `coursesApplication`
* **Collections:**
  1. `courses`
  2. `similarCourses`

### 3. Εκκίνηση Node.js server
Για να τρέξεις τον Node.js server ανοίγεις το Terminal, κατευθύνεσε στον φάκελο Backend που είναι το αρχείο server.js και τρέχεις την εντολή: `node server run`

### 4. Εκκίνηση React

Για να δουλέψει η React, πρέπει να τρέξεις τον Vite server. Για να γίνει αυτό, ανοίγεις Terminal, κατευθύνεσε στον φάκελο Frontend και τρέχεις την εντολή: `npm run dev` 

### 5. Εκτέλεση αρχείων Spark

Για να τρέξεις τα αρχεία κώδικα σε Spark, θα χρειαστείς:
*  **IDE** (VS Code, PyCharm) ή
* **Terminal** πηγαίνωντας στον φάκελο Spark και τρέχοντας της εντολές
    1. `spark-submit saving_to_mongodb.py`
    2. `spark-submit similarity.py`

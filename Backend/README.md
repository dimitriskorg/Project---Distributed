# Backend
> Τεχνολογίες: Node.js, Express, MongoDB & REST APIs

Το αρχείο `sever.js` είναι ο κεντρικός server της εφαρμογής και χρησιμοποιώντας.

## 1. Ρυθμίσεις και σύνδεση με τη βάση

Το URL της βάσης είναι:

``const MONGO_URI = 'mongodb://127.0.0.1:27017/coursesApplication' ``

Η σύνδεση γίνεται:
```
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));
```

## 2. API Endpoints

Ο server ακολουθεί την αρχιτεκτονική REST API. Επιστρέφει δεδομένα σε μορφή JSON.

### 2.1 Αναζήτηση & Φιλτράρισμα Μαθημάτων
Επιστρέφει λίστα μαθημάτων με σελιδοποίηση (pagination).

`Endpoint`: GET /api/courses

Παράμετρος | Τύπος | Περιγραφή
--- | --- | ---
page  | Query |Ο αριθμός σελίδας (Default: 1)
limit |Query  |Αποτελέσματα ανά σελίδα (Default: 20)
search  | Query |Αναζήτηση στον τίτλο (Keyword)
category|Query  |Φιλτράρισμα ανά κατηγορία
level |Query  |Φιλτράρισμα ανά επίπεδο (Beginner, etc.)"
language |Query |Φιλτράρισμα ανά γλώσσα

### 2.2 Λίστα Κατηγοριών
Επιστρέφει όλες τις μοναδικές κατηγορίες που υπάρχουν στη βάση (για να γεμίσουν τα φίλτρα στο Frontend).

`Endpoint`: GET /api/categories

### 2.3 Λεπτομέρειες Μαθήματος
Επιστρέφει αναλυτικά τα στοιχεία ενός συγκεκριμένου μαθήματος βάσει του ID του.

`Endpoint`: GET /api/courses/:id

Παράμετρος  |Τύπος  |Περιγραφή
--- | --- | ---
:id	|Path |Το μοναδικό _id του μαθήματος στη MongoDB

### 2.4 Παρόμοια Μαθήματα (ML Recommendation)
Επιστρέφει τα προτεινόμενα/παρόμοια μαθήματα, όπως έχουν υπολογιστεί από τον Spark αλγόριθμο και έχουν αποθηκευτεί στο collection `similarCourses`.

`Endpoint`: GET /api/courses/:id/similar

## 3. Πως λειτουργεί
1. O χρήστης κάνει μια ενέργεια στο React Frontend (π.χ. αναζήτηση).
2. Το Frontend στέλνει ένα HTTP Request στο αντίστοιχο Endpoint του Backend.
3. Ο Server (μέσω Mongoose) εκτελεί το Query στη βάση δεδομένων MongoDB.
4. Τα αποτελέσματα επιστρέφονται ως JSON στο Frontend για απεικόνιση.
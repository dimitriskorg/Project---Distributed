# Frontend
> Τεχνολογίες: React, React Router Dom, Vite

## 1. Ροή Εκτέλεσης (App Flow)
Η εφαρμογή ακολουθεί τα εξής βήματα:
1. Φόρτωσε το αρχείο `index.html`.
2. To `index.html` καλεί το `main.jsx`.
3. Με τη σειρά του, το `main.jsx` καλεί το `App.jsx`.
4. ο App.jsx περιέχει το Layout (`Header`, `Footer`) και ανάλογα με το Route φορτώνει την αντίστοιχη σελίδα (`FilterPage` ή `SearchPage`)

## 2. Βασικά Components & Σελίδες

### 2.1. App.jsx (Routing)
Είναι ο κεντρικός κόμβος της εφαρμογής. Χρησιμοποιεί το `react-router-dom` για να ορίσει τις διαδρομές:

* `/` : Φορτώνει την `FilterPage` (Αρχική σελίδα με φίλτρα).

* `/search` : Φορτώνει την `SearchPage` (Αποτελέσματα αναζήτησης).

* Το `Header` και το `Footer` παραμένουν σταθερά σε όλες τις σελίδες.

### 2.2. SearchPage.jsx (Αποτελέσματα Αναζήτησης)
Λειτουργεί ως η σελίδα αποτελεσμάτων και διαχειρίζεται τη δυναμική φόρτωση δεδομένων.

* Διαβάζει τον όρο αναζήτησης (`query`) από το URL μέσω του `useSearchParams`.

* Διατηρεί λίστα μαθημάτων (`courses`), σελιδοποίηση (`page`, `totalPages`) και το επιλεγμένο μάθημα για το Popup.

* Το `useEffect` παρακολουθεί αλλαγές στο query ή στο page και καλεί το API (`/api/courses`).

* Εμφανίζει τα αποτελέσματα σε πλέγμα καρτών και περιλαμβάνει buttons σελιδοποίησης (Next/Prev).

### 2.3. FilterPage.jsx (Φιλτράρισμα)
* Διαχειρίζεται την αναζήτηση μαθημάτων μέσω φίλτρων (Category, Level, Language).

* Χρησιμοποιεί το URL ως την κεντρική πηγή αλήθειας.

* Κατά την εκκίνηση, τραβάει δυναμικά τις διαθέσιμες κατηγορίες από τον server.

* Όταν πατηθεί το "Εμφάνιση" (`handleSearchClick`), ενημερώνονται οι παράμετροι του URL.

* Ανιχνεύει τις αλλαγές στα φίλτρα και εκτελεί το κύριο fetch αίτημα προς το backend.

### 2.4. Popup.jsx (Modal Λεπτομερειών & ML)
Ένα αναδυόμενο παράθυρο που προβάλλει τις λεπτομέρειες του μαθήματος και προσφέρει on-demand φόρτωση προτάσεων (ML).

* Δέχεται το αντικείμενο `course` και τη συνάρτηση `onClose`.

* Περιέχει το κουμπί "Σχετικά μαθήματα".

* Όταν πατηθεί το κουμπί, καλεί το endpoint `/api/courses/:id/similar`. Εμφανίζει τη λίστα με τα προτεινόμενα μαθήματα και το ποσοστό ομοιότητας (similarity score).

## 3. React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### 3.1. React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### 3.2. Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

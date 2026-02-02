const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors()); // Επιτρέπει την επικοινωνία με το React
app.use(express.json()); // Επιτρέπει την ανάγνωση JSON δεδομένων

// --- ΣΥΝΔΕΣΗ ΜΕ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ (MONGODB) ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/coursesApplication'
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// --- MONGOOSE MODELS ---
const CourseSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,      
    language: String,      
    level: String,         
    source_name: String,   
    link: String,          
    last_updated: Date,
    rate: Number           
});

// 2. Δημιουργούμε το Model
const Course = mongoose.model('Course', CourseSchema);

// --- Model για Similar Courses ---
const SimilarCourseSchema = new mongoose.Schema({
    // Λέμε στη Mongoose ότι το _id είναι String και όχι ObjectId
    _id: String, 
    similar_courses: [
        {
            title: String,
            link: String,
            score: Number
        }
    ]
});

// ΠΡΟΣΟΧΗ ΕΔΩ: 
// Το 3ο όρισμα 'similarCourses' είναι το ακριβές όνομα του collection στη βάση σου.
// Αυτό λέει στη Mongoose: "Μην μαντεύεις ονόματα, πήγαινε ακριβώς εδώ".
const SimilarCourse = mongoose.model('SimilarCourse', SimilarCourseSchema, 'similarCourses');

// --- ENDPOINTS ---

// 1. Endpoint: Αναζήτηση & Φιλτράρισμα με Pagination
app.get('/api/courses', async (req, res) => {
    try {
        const { search, category, level, language } = req.query;
        
        // --- PAGINATION SETUP ---
        // Αν δεν στείλει σελίδα ο χρήστης, πάμε στην 1η. Default όριο το 20.
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = {};

        // ... (Τα φίλτρα search, category, level, language παραμένουν ίδια) ...
        if (search) query.title = { $regex: search, $options: 'i' };
        if (category && category !== 'All') query.category = category;
        if (level && level !== 'All') query.level = level;
        if (language && language !== 'All') query.language = language;

        console.log(`Page: ${page}, Query:`, query);

        // 1. Βρίσκουμε το ΣΥΝΟΛΟ των αποτελεσμάτων (χωρίς το όριο)
        // Αυτό χρειάζεται για να ξέρει το frontend πόσες σελίδες υπάρχουν συνολικά
        const totalCourses = await Course.countDocuments(query);

        // 2. Φέρνουμε ΤΑ ΣΥΓΚΕΚΡΙΜΕΝΑ 20 αποτελέσματα
        const courses = await Course.find(query)
            .skip(skip)   // Προσπέρασε τα προηγούμενα
            .limit(limit); // Φέρε μόνο 20

        // 3. Επιστρέφουμε δεδομένα ΚΑΙ πληροφορίες σελιδοποίησης
        res.json({
            courses, // Τα μαθήματα της τρέχουσας σελίδας
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// 6. Για να φορτώνονται δυναμικά οι κατηγορίες για το frontend
app.get('/api/categories', async (req, res) => {
    try {
        // Το distinct επιστρέφει πίνακα με strings
        const categories = await Course.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/levels', async (req, res) => {
    try {
        // Το distinct επιστρέφει πίνακα με strings
        const levels = await Course.distinct('level');
        res.json(levels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/languages', async (req, res) => {
    try {
        // Το distinct επιστρέφει πίνακα με strings
        const languages = await Course.distinct('language');
        res.json(languages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/source_names', async (req, res) => {
    try {
        // Το distinct επιστρέφει πίνακα με strings
        const source_names = await Course.distinct('source_name');
        res.json(source_names);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Endpoint: Λεπτομέρειες Ενός Μαθήματος
// URL: /api/courses/:id
app.get('/api/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Το μάθημα δεν βρέθηκε" });
        }
        res.json(course);

    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: "Μη έγκυρο ID" });
        }
        res.status(500).json({ message: "Server Error" });
    }
});

// 3. Endpoint: Προτάσεις / Παρόμοια Μαθήματα
// URL: /api/courses/:id/similar
app.get('/api/courses/:id/similar', async (req, res) => {
    try {
        const courseId = req.params.id;

        // Ψάχνουμε στο collection 'similarCourses' για εγγραφή με το ΙΔΙΟ _id
        const similarData = await SimilarCourse.findById(courseId);

        // Αν δεν βρεθεί εγγραφή, επιστρέφουμε άδειο πίνακα (όχι error)
        if (!similarData) {
            return res.json({ similar_courses: [] });
        }

        // Επιστρέφουμε το αντικείμενο όπως είναι στη βάση
        // Το frontend περιμένει: data.similar_courses
        res.json(similarData);

    } catch (error) {
        console.error("Error fetching similar courses:", error);
        res.status(500).json({ message: "Server Error fetching similar courses" });
    }
});

// --- ΕΚΚΙΝΗΣΗ SERVER ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 

const MONGO_URI = 'mongodb://127.0.0.1:27017/coursesApplication'
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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

const Course = mongoose.model('Course', CourseSchema);

const SimilarCourseSchema = new mongoose.Schema({
    _id: String, 
    similar_courses: [
        {
            title: String,
            link: String,
            score: Number
        }
    ]
});

const SimilarCourse = mongoose.model('SimilarCourse', SimilarCourseSchema, 'similarCourses');

app.get('/api/courses', async (req, res) => {
    try {
        const { search, category, level, language } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = {};

        if (search) query.title = { $regex: search, $options: 'i' };
        if (category && category !== 'All') query.category = category;
        if (level && level !== 'All') query.level = level;
        if (language && language !== 'All') query.language = language;

        console.log(`Page: ${page}, Query:`, query);

        const totalCourses = await Course.countDocuments(query);

        const courses = await Course.find(query)
            .skip(skip)   
            .limit(limit); 

        res.json({
            courses, 
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Course.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

app.get('/api/courses/:id/similar', async (req, res) => {
    try {
        const courseId = req.params.id;
        const similarData = await SimilarCourse.findById(courseId);
        
        if (!similarData) {
            return res.json({ similar_courses: [] });
        }

        res.json(similarData);

    } catch (error) {
        console.error("Error fetching similar courses:", error);
        res.status(500).json({ message: "Server Error fetching similar courses" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

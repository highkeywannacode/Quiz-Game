const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve current directory files

// MongoDB connection - SECURE VERSION
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizDB';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Could not connect to MongoDB', err);
});

// User schema for quiz results
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    quizDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// API Endpoint to save user quiz results
app.post('/api/quiz-results', async (req, res) => {
    try {
        const { name, department, email, score, totalQuestions } = req.body;
        
        if (!name || !department || !email || typeof score === 'undefined' || !totalQuestions) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        const newUser = new User({ name, department, email, score, totalQuestions });
        await newUser.save();
        res.status(201).json({ message: 'Quiz results saved successfully', data: newUser });
    } catch (error) {
        console.error('Error saving quiz results:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API endpoint to get all scores for leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await User.find().sort({ score: -1, quizDate: 1 }).limit(10);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
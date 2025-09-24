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

// Serve static files from current directory
app.use(express.static(__dirname));

// MongoDB connection - SIMPLIFIED
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI exists:', !!MONGODB_URI);

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
})
.catch(err => {
    console.error('❌ MongoDB connection failed:', err);
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

// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

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
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve spaceinvaders page
app.get('/spaceinvaders', (req, res) => {
    res.sendFile(path.join(__dirname, 'spaceinvaders.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
    console.log(`✅ Health check: http://localhost:${port}/api/health`);
});

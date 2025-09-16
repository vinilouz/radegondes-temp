require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const mainApiRouter = require('./api');

const app = express();
const port = process.env.PORT || 5000;

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas!');
  })
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// Core Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean)
    : true,
  credentials: true
}));

// Serve static files from the 'uploads' directory
// This allows the frontend to access uploaded files like avatars
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));


// --- API Routes ---
// All API routes are now handled by the main API router
app.use('/api', mainApiRouter);


// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the Radegondes Project Backend!');
});

// Start Server
app.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});

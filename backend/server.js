const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const pollRoutes = require('./routes/polls');
const voteRoutes = require('./routes/votes');

const app = express();

// Connect to database and sync models
(async () => {
  try {
    await testConnection();
    await syncDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
})();

// Security middleware
app.use(helmet());

// Rate limiting - more lenient for development
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// More lenient rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // Allow more auth attempts in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// Apply rate limiting
app.use(generalLimiter);

// CORS configuration - Allow all origins for deployment
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Poll App API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app; 

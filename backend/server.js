const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');

// Database connection
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// ✅ Clean CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : [
        'http://localhost:3000',    // Main e-commerce frontend
        'http://localhost:3001',    // Admin panel
        'http://localhost:5173',    // Vite default port
        'http://127.0.0.1:3000',    // Alternative localhost format
        'http://127.0.0.1:3001'     // Alternative localhost format
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Serve static files with CORS headers for images
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  next();
}, express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nayher API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ✅ Image test endpoint
app.get('/uploads/test', (req, res) => {
  res.json({
    success: true,
    message: 'Image serving is working',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    sampleImageUrl: `${req.protocol}://${req.get('host')}/uploads/products/sample.jpg`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global Error:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

// ✅ Handle 404 routes - FIXED
app.use('/{*catchAll}', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Nayher Backend Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📁 Static files served from: http://localhost:${PORT}/uploads`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🖼️ Image test: http://localhost:${PORT}/uploads/test`);
});

module.exports = app;

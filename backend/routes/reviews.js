const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  approveReview
} = require('../controllers/reviewController');

const router = express.Router();

// ✅ ADD: Test route to verify everything is working
router.get('/test', (req, res) => {
  console.log('🧪 Review test route accessed');
  res.json({ 
    success: true, 
    message: 'Reviews API is working!',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/reviews/test',
      'GET /api/reviews/product/:productId',
      'POST /api/reviews/product/:productId'
    ]
  });
});

// ✅ ADD: Debug route to test Review model
router.get('/debug', async (req, res) => {
  try {
    const Review = require('../models/Review');
    console.log('🔍 Testing Review model...');
    
    const count = await Review.countDocuments();
    console.log('📊 Total reviews in database:', count);
    
    res.json({
      success: true,
      message: 'Review model is working',
      totalReviews: count,
      modelName: Review.modelName
    });
  } catch (error) {
    console.error('❌ Review model error:', error);
    res.status(500).json({
      success: false,
      message: 'Review model error: ' + error.message
    });
  }
});

// Public routes
router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', createReview);

// Review management routes
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

// Admin routes
router.get('/', getAllReviews);
router.put('/:reviewId/approve', approveReview);

module.exports = router;

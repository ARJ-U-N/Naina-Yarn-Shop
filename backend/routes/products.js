const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), validateProduct, createProduct);
router.put('/:id', protect, authorize('admin'), validateProduct, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;

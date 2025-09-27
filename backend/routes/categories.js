const express = require('express');
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:slug', getCategory);

// Admin routes
router.post('/', protect, authorize('admin'), validateCategory, createCategory);
router.put('/:id', protect, authorize('admin'), validateCategory, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;

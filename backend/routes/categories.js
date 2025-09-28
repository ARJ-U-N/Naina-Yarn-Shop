const express = require('express');
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  handleImageUpload
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategory); // Changed from :slug to :id to handle both ID and slug

// Image upload route (must be before other POST routes)
router.post('/upload-image', protect, authorize('admin'), uploadCategoryImage, handleImageUpload);

// Admin routes
router.post('/', protect, authorize('admin'), validateCategory, createCategory);
router.put('/:id', protect, authorize('admin'), validateCategory, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;

const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { validateOrder, validateOrderStatus } = require('../middleware/validation');

const router = express.Router();

// All order routes require authentication
router.use(protect);

// User routes
router.post('/', validateOrder, createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllOrders);
router.put('/:id/status', authorize('admin'), validateOrderStatus, updateOrderStatus);

module.exports = router;

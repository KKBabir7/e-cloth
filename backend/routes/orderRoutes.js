const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAdminOrders,
  updateOrderStatus,
  getAdminStats
} = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Customer endpoints
router.post('/', protect, createOrder);
router.get('/user', protect, getUserOrders);

// Admin & Staff tracking endpoints
router.get('/admin', protect, authorizeRoles('superAdmin', 'admin', 'manager', 'support'), getAdminOrders);
router.patch('/status', protect, authorizeRoles('superAdmin', 'admin', 'manager', 'support'), updateOrderStatus);
router.get('/dashboard-stats', protect, authorizeRoles('superAdmin', 'admin'), getAdminStats);

module.exports = router;

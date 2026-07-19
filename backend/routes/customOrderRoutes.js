const express = require('express');
const router = express.Router();
const customOrderController = require('../controllers/customOrderController');
const { protect, authorizeRoles } = require('../middleware/auth');

// User / Guest Routes (Cart)
router.post('/cart', customOrderController.addToCartCustomOrder);
router.delete('/cart/:id', customOrderController.removeFromCartCustomOrder);

// User Profile Routes
router.get('/my-designs', protect, customOrderController.getUserCustomDesigns);

// Admin Routes
router.get('/admin', protect, authorizeRoles('superAdmin', 'admin', 'manager', 'support'), customOrderController.getAllCustomOrders);
router.get('/admin/:id', protect, authorizeRoles('superAdmin', 'admin', 'manager', 'support'), customOrderController.getCustomOrderById);
router.put('/admin/:id/status', protect, authorizeRoles('superAdmin', 'admin', 'manager', 'support'), customOrderController.updateCustomOrderStatus);

module.exports = router;

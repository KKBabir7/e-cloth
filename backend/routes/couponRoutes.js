const express = require('express');
const router = express.Router();
const { createCoupon, getCoupons, validateCoupon } = require('../controllers/couponController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), createCoupon);
router.get('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), getCoupons);
router.post('/validate', protect, validateCoupon);

module.exports = router;

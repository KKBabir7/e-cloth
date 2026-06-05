const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cartSession = require('../middleware/cartSession');
const {
  getCart,
  addToCart,
  updateCartQty,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  updateDeliveryCharge,
  clearCart
} = require('../controllers/cartController');

/**
 * Optional protect middleware - checks if a token is present, and if so,
 * populates req.user. If not, it silently passes through (so guest session takes over).
 */
const optionalProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.cookie) {
      const tokenCookie = req.headers.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='));
      
      if (tokenCookie) {
        token = tokenCookie.split('=')[1].trim();
      }
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcustomwearbdkey2026');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    // Fail silently on invalid tokens, treat as guest
  }
  next();
};

// All cart endpoints require cartSession middleware + optional authentication check
router.use(optionalProtect);
router.use(cartSession);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .put(updateCartQty)
  .delete(removeFromCart);

router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);
router.post('/delivery', updateDeliveryCharge);
router.post('/clear', clearCart);

module.exports = router;

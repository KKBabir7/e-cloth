const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cartSession = require('../middleware/cartSession');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');

/**
 * Optional protect middleware - populates req.user if a token is present,
 * otherwise treats as guest session.
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

// Apply middlewares to all wishlist endpoints
router.use(optionalProtect);
router.use(cartSession);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.route('/:productId')
  .delete(removeFromWishlist);

module.exports = router;

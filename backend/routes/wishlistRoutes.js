const express = require('express');
const router = express.Router();
const cartSession = require('../middleware/cartSession');
const { optionalProtect } = require('../middleware/auth');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');

// Apply middlewares to all wishlist endpoints
router.use(optionalProtect);
router.use(cartSession);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.route('/:productId')
  .delete(removeFromWishlist);

module.exports = router;

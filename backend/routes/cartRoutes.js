const express = require('express');
const router = express.Router();
const cartSession = require('../middleware/cartSession');
const { optionalProtect } = require('../middleware/auth');
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

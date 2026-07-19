const express = require('express');
const router = express.Router();
const cartSession = require('../middleware/cartSession');
const { optionalProtect, protect, authorizeRoles } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartQty,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  updateDeliveryCharge,
  clearCart,
  getCartsAdmin,
  deleteCartAdmin,
  deleteCartItemAdmin
} = require('../controllers/cartController');

// Admin cart management routes (Access: Admin/SuperAdmin)
router.get('/admin', protect, authorizeRoles('admin', 'superAdmin'), getCartsAdmin);
router.delete('/admin/:cartId', protect, authorizeRoles('admin', 'superAdmin'), deleteCartAdmin);
router.delete('/admin/:cartId/item/:itemId', protect, authorizeRoles('admin', 'superAdmin'), deleteCartItemAdmin);

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

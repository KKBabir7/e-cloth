const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  deleteProductReview,
  updateProductReview
} = require('../controllers/productController');
// End of product routes configuration.
const { protect, optionalProtect, authorizeRoles } = require('../middleware/auth');
const { productCache } = require('../middleware/cache');

// Public catalog and detailed view
router.get('/', productCache, getProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', optionalProtect, addProductReview);

// Admin controls (RBAC restricted)
router.post('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), createProduct);
router.put('/:id', protect, authorizeRoles('superAdmin', 'admin', 'manager'), updateProduct);
router.delete('/:id', protect, authorizeRoles('superAdmin', 'admin'), deleteProduct);
router.delete('/:id/reviews/:reviewId', protect, authorizeRoles('superAdmin', 'admin', 'manager'), deleteProductReview);
router.put('/:id/reviews/:reviewId', protect, authorizeRoles('superAdmin', 'admin', 'manager'), updateProductReview);

module.exports = router;

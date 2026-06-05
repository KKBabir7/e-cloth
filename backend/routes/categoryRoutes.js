const express = require('express');
const router = express.Router();
const {
  getCategories,
  adminGetCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public storefront route
router.get('/', getCategories);

// Administrative category routes
router.get('/admin', protect, authorizeRoles('superAdmin', 'admin', 'manager'), adminGetCategories);
router.post('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), createCategory);
router.put('/:id', protect, authorizeRoles('superAdmin', 'admin', 'manager'), updateCategory);
router.delete('/:id', protect, authorizeRoles('superAdmin', 'admin'), deleteCategory);

module.exports = router;

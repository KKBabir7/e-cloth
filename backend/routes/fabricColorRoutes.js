const express = require('express');
const router = express.Router();
const {
  getFabricColors,
  adminGetFabricColors,
  createFabricColor,
  updateFabricColor,
  deleteFabricColor
} = require('../controllers/fabricColorController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public storefront route
router.get('/', getFabricColors);

// Administrative fabric colors routes
router.get('/admin', protect, authorizeRoles('superAdmin', 'admin', 'manager'), adminGetFabricColors);
router.post('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), createFabricColor);
router.put('/:id', protect, authorizeRoles('superAdmin', 'admin', 'manager'), updateFabricColor);
router.delete('/:id', protect, authorizeRoles('superAdmin', 'admin'), deleteFabricColor);

module.exports = router;

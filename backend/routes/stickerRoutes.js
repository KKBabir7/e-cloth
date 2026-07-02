const express = require('express');
const router = express.Router();
const {
  getStickers,
  adminGetStickers,
  createSticker,
  updateSticker,
  deleteSticker
} = require('../controllers/stickerController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public storefront route
router.get('/', getStickers);

// Administrative sticker routes
router.get('/admin', protect, authorizeRoles('superAdmin', 'admin', 'manager'), adminGetStickers);
router.post('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), createSticker);
router.put('/:id', protect, authorizeRoles('superAdmin', 'admin', 'manager'), updateSticker);
router.delete('/:id', protect, authorizeRoles('superAdmin', 'admin'), deleteSticker);

module.exports = router;

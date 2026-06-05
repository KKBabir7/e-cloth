const express = require('express');
const router = express.Router();
const {
  getSlides,
  adminGetSlides,
  createSlide,
  updateSlide,
  deleteSlide
} = require('../controllers/heroSlideController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public: get active slides
router.get('/', getSlides);

// Administrative slide management
router.get('/admin', protect, authorizeRoles('admin', 'superAdmin'), adminGetSlides);
router.post('/', protect, authorizeRoles('admin', 'superAdmin'), createSlide);
router.put('/:id', protect, authorizeRoles('admin', 'superAdmin'), updateSlide);
router.delete('/:id', protect, authorizeRoles('admin', 'superAdmin'), deleteSlide);

module.exports = router;

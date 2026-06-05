const express = require('express');
const router = express.Router();
const { uploadMedia, getMedia, deleteMedia } = require('../controllers/mediaController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All media library routes are protected and restricted to administrators
router.post('/upload', protect, authorizeRoles('admin'), upload.single('image'), uploadMedia);
router.get('/', protect, authorizeRoles('admin'), getMedia);
router.delete('/:id', protect, authorizeRoles('admin'), deleteMedia);

module.exports = router;

const express = require('express');
const router = express.Router();
const { saveDesign, getUserDesigns, deleteDesign, getDesignById } = require('../controllers/designController');
const { protect } = require('../middleware/auth');

router.post('/save', protect, saveDesign);
router.get('/user', protect, getUserDesigns);
router.get('/:id', protect, getDesignById);
router.delete('/:id', protect, deleteDesign);

module.exports = router;

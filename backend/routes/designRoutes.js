const express = require('express');
const router = express.Router();
const { saveDesign, getUserDesigns } = require('../controllers/designController');
const { protect } = require('../middleware/auth');

router.post('/save', protect, saveDesign);
router.get('/user', protect, getUserDesigns);

module.exports = router;

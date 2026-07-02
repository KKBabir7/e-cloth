const express = require('express');
const router = express.Router();
const { getDesignSettings, updateDesignSettings } = require('../controllers/designSettingController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public route to fetch pricing configurations
router.get('/', getDesignSettings);

// Administrative route to update customizer fees
router.put('/', protect, authorizeRoles('superAdmin', 'admin', 'manager'), updateDesignSettings);

module.exports = router;

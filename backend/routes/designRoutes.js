const express = require('express');
const router = express.Router();
const { saveDesign, getUserDesigns, deleteDesign, getDesignById, getDesignsAdmin, deleteDesignAdmin } = require('../controllers/designController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Admin custom saved designs routes (Access: Admin/SuperAdmin)
router.get('/admin', protect, authorizeRoles('admin', 'superAdmin'), getDesignsAdmin);
router.delete('/admin/:id', protect, authorizeRoles('admin', 'superAdmin'), deleteDesignAdmin);

router.post('/save', protect, saveDesign);
router.get('/user', protect, getUserDesigns);
router.get('/:id', protect, getDesignById);
router.delete('/:id', protect, deleteDesign);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getUsers,
  updateUserRole,
  changePassword,
  updateUserProfile,
  addUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser
} = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/logout', protect, logoutUser);

// Profile and Address routes (Customer/User level)
router.put('/profile', protect, updateUserProfile);
router.post('/addresses', protect, addUserAddress);
router.delete('/addresses/:addressId', protect, deleteUserAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// Admin user management routes
router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.post('/users', protect, authorizeRoles('admin'), adminCreateUser);
router.put('/users/:id', protect, authorizeRoles('admin'), adminUpdateUser);
router.delete('/users/:id', protect, authorizeRoles('admin'), adminDeleteUser);

// Change password route
router.put('/change-password', protect, changePassword);

module.exports = router;

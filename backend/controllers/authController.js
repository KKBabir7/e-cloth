const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validateBdPhone, normalizePhone } = require('../../shared/utils');
const Cart = require('../models/Cart');
const { mergeGuestWishlist } = require('./wishlistController');

// Server-side helper to recalculate totals
const recalculateTotals = (cart) => {
  cart.subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  if (cart.coupon) {
    if (cart.coupon.discountType === 'percentage') {
      cart.discount = (cart.subtotal * cart.coupon.discountValue) / 100;
      if (cart.coupon.maxDiscount > 0 && cart.discount > cart.coupon.maxDiscount) {
        cart.discount = cart.coupon.maxDiscount;
      }
    } else {
      cart.discount = cart.coupon.discountValue;
    }
    if (cart.discount > cart.subtotal) {
      cart.discount = cart.subtotal;
    }
  } else {
    cart.discount = 0;
  }
  cart.total = Math.max(0, (cart.subtotal + cart.deliveryCharge) - cart.discount);
};

// Helper to merge guest cart into user cart
const mergeGuestCart = async (userId, sessionId) => {
  if (!sessionId) return;
  try {
    const guestCart = await Cart.findOne({ sessionId, userId: null });
    if (!guestCart || guestCart.items.length === 0) return;

    let userCart = await Cart.findOne({ userId });
    if (!userCart) {
      guestCart.userId = userId;
      await guestCart.save();
      return;
    }

    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        (item) =>
          item.productId.toString() === guestItem.productId.toString() &&
          item.size === guestItem.size &&
          item.color === guestItem.color &&
          item.isCustom === guestItem.isCustom &&
          (guestItem.customDesignId ? item.customDesignId?.toString() === guestItem.customDesignId.toString() : !item.customDesignId)
      );

      if (existingIndex > -1) {
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    recalculateTotals(userCart);
    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id });
  } catch (error) {
    console.error('Error merging guest cart:', error);
  }
};

// Helper to extract session ID from cookie
const getCartSessionId = (req) => {
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('cartSessionId='));
    if (sessionCookie) {
      return sessionCookie.split('=')[1].trim();
    }
  }
  return null;
};

/**
 * Helper to generate JWT token and send HTTP-Only cookie response
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecretcustomwearbdkey2026',
    { expiresIn: '30d' }
  );

  // Secure HttpOnly cookie settings
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, phone, and password' });
    }

    // Validate phone number using shared validator
    if (!validateBdPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Bangladesh phone number (+8801... or 01...)' });
    }

    const normalized = normalizePhone(phone);

    // Check if user already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    const phoneExists = await User.findOne({ phone: normalized });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Phone number is already registered' });
    }

    // Create user. Limit roles in public registrations to customer.
    const userRole = role && ['customer', 'support'].includes(role) ? role : 'customer';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: normalized,
      password,
      role: userRole
    });

    const sessionId = getCartSessionId(req);
    if (sessionId) {
      await mergeGuestCart(user._id, sessionId);
      await mergeGuestWishlist(user._id, sessionId);
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, message: 'Server registration error: ' + error.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body; // Can be email or phone

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or phone and password' });
    }

    // Try finding user by email or phone
    const normalizedPhone = validateBdPhone(loginIdentifier) ? normalizePhone(loginIdentifier) : null;
    
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { phone: normalizedPhone || loginIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const sessionId = getCartSessionId(req);
    if (sessionId) {
      await mergeGuestCart(user._id, sessionId);
      await mergeGuestWishlist(user._id, sessionId);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server login error: ' + error.message });
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000), // expires in 5 seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
};

/**
 * @desc    Get all users list (Admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving users list' });
  }
};

/**
 * @desc    Update user role status (Admin only)
 * @route   PUT /api/auth/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Please provide user role status' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role-based lockout rules
    if (targetUser.role === 'admin' || targetUser.role === 'superAdmin') {
      return res.status(400).json({ success: false, message: 'Administrative roles cannot be modified' });
    }

    if (role === 'admin' || role === 'superAdmin') {
      return res.status(400).json({ success: false, message: 'Roles cannot be elevated to administrative status from the panel' });
    }

    if (!['manager', 'support', 'customer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role category' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({ success: true, message: 'User role status updated successfully', user: targetUser });
  } catch (error) {
    console.error('Update role error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating user role status' });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Must fetch including password to compare
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ user: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating password' });
  }
};

/**
 * @desc    Update user profile (name, phone)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide name and phone number' });
    }

    // Validate phone number using shared validator
    if (!validateBdPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Bangladesh phone number (+8801... or 01...)' });
    }

    const normalized = normalizePhone(phone);

    // Check if phone is already in use by another user
    const phoneExists = await User.findOne({ phone: normalized, _id: { $ne: req.user.id } });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Phone number is already registered to another account' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name;
    user.phone = normalized;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

/**
 * @desc    Add address to user profile
 * @route   POST /api/auth/addresses
 * @access  Private
 */
const addUserAddress = async (req, res) => {
  try {
    const { district, area, addressLine } = req.body;

    if (!district || !area || !addressLine) {
      return res.status(400).json({ success: false, message: 'Please provide district, area, and address line' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If it's the first address, set as default
    const isDefault = user.addresses.length === 0;

    user.addresses.push({
      district,
      area,
      addressLine,
      isDefault
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error.message);
    res.status(500).json({ success: false, message: 'Server error adding address' });
  }
};

/**
 * @desc    Delete address from user profile
 * @route   DELETE /api/auth/addresses/:addressId
 * @access  Private
 */
const deleteUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address, and we have remaining addresses, set the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting address' });
  }
};

/**
 * @desc    Set default address
 * @route   PUT /api/auth/addresses/:addressId/default
 * @access  Private
 */
const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressExists = user.addresses.some(addr => addr._id.toString() === req.params.addressId);
    if (!addressExists) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.addressId;
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Set default address error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating default address' });
  }
};

/**
 * @desc    Create new user account (Admin only)
 * @route   POST /api/auth/users
 * @access  Private/Admin
 */
const adminCreateUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Validate phone number using shared validator
    if (!validateBdPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Bangladesh phone number (+8801... or 01...)' });
    }

    const normalized = normalizePhone(phone);

    // Check if user already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    const phoneExists = await User.findOne({ phone: normalized });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Phone number is already registered' });
    }

    // Restrict administrative role creation from the panel for safety
    if (role === 'admin' || role === 'superAdmin') {
      return res.status(400).json({ success: false, message: 'Administrative roles cannot be created from the panel interface' });
    }

    if (!['manager', 'support', 'customer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role category' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: normalized,
      password,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Admin create user error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating user account' });
  }
};

/**
 * @desc    Update user account details (Admin only)
 * @route   PUT /api/auth/users/:id
 * @access  Private/Admin
 */
const adminUpdateUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Validate phone number
    if (!validateBdPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Bangladesh phone number' });
    }

    const normalized = normalizePhone(phone);

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Prevent changing admin/superAdmin accounts
    if (targetUser.role === 'admin' || targetUser.role === 'superAdmin') {
      return res.status(400).json({ success: false, message: 'Administrative accounts cannot be modified from the panel' });
    }

    // Assert new role is not admin
    if (role === 'admin' || role === 'superAdmin') {
      return res.status(400).json({ success: false, message: 'Escalation to administrative roles is locked' });
    }

    if (!['manager', 'support', 'customer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role category' });
    }

    // Check unique email
    const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address is already in use by another user' });
    }

    // Check unique phone
    const phoneExists = await User.findOne({ phone: normalized, _id: { $ne: req.params.id } });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Phone number is already in use by another user' });
    }

    targetUser.name = name;
    targetUser.email = email.toLowerCase();
    targetUser.phone = normalized;
    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User account details updated successfully',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role
      }
    });
  } catch (error) {
    console.error('Admin update user error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating user account' });
  }
};

/**
 * @desc    Delete user account (Admin only)
 * @route   DELETE /api/auth/users/:id
 * @access  Private/Admin
 */
const adminDeleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Prevent deleting self
    if (req.user.id === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own administrative account' });
    }

    // Prevent deleting administrators
    if (targetUser.role === 'admin' || targetUser.role === 'superAdmin') {
      return res.status(400).json({ success: false, message: 'Administrative accounts cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting user account' });
  }
};

module.exports = {
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
};

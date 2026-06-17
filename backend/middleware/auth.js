const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractTokenFromCookie = (req) => {
  if (!req.headers.cookie) return null;
  const tokenCookie = req.headers.cookie
    .split(';')
    .find((c) => c.trim().startsWith('token='));
  if (!tokenCookie) return null;
  return decodeURIComponent(tokenCookie.split('=')[1].trim());
};

/**
 * Protect route middleware (requires authentication)
 */
const protect = async (req, res, next) => {
  try {
    const token = extractTokenFromCookie(req);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, please login first' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcustomwearbdkey2026');

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Auth protect error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token session' });
  }
};

/**
 * Optional protect middleware - populates req.user from cookie if valid.
 * Invalid/missing cookies are treated as guest sessions.
 */
const optionalProtect = async (req, res, next) => {
  try {
    const token = extractTokenFromCookie(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcustomwearbdkey2026');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    // Silently continue as guest for optional auth routes
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) authorization middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not allowed to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, optionalProtect, authorizeRoles };

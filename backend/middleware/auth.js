const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect route middleware (requires authentication)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Retrieve token from HttpOnly cookie
    if (req.headers.cookie) {
      const tokenCookie = req.headers.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='));
      
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    // Fallback: Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

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

module.exports = { protect, authorizeRoles };

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization token required',
        code: 'AUTH_TOKEN_REQUIRED',
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid or inactive user',
        code: 'USER_NOT_FOUND',
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    console.error('User auth middleware error:', error);
    res.status(500).json({
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

module.exports = userAuth;

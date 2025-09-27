const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const config = require('../config/env');

module.exports = async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);

    if (payload.id) {
      const admin = await Admin.findById(payload.id).lean();
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: 'Account inactive' });
      }
      req.admin = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName || admin.email,
      };
    } else {
      req.admin = {
        email: payload.email,
        role: payload.role || 'superadmin',
        displayName: payload.displayName || payload.email,
      };
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

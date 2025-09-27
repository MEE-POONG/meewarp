module.exports = function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    const { admin } = req;
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(admin.role)) {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    return next();
  };
};

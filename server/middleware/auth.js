
// Middleware: Only allow super_admin
exports.superAdminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.type !== 'super_admin')) {
    return res.status(403).json({ error: 'Forbidden: Super admin only' });
  }
  next();
};

const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = header.split(' ')[1];
  
  // Allow hardcoded super admin token
  if (token === 'superadmintoken') {
    req.user = { 
      id: 6, 
      role: 'super_admin', 
      email: 'renthiveadmin@gmail.com',
      name: 'Super Admin'
    };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

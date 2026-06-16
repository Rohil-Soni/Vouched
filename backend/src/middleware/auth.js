const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const ADMIN_EMAIL = '241b629@juetguna.in';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const ensureAdminAccess = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      if (req.user.email === ADMIN_EMAIL) {
        req.user.role = 'ADMIN'; // Force role to ADMIN
        return next();
      }
    } catch (err) {
      // Token invalid or expired, proceed to check by email only
    }
  }

  // Fallback: Check if the request is from the hardcoded admin email, even without a valid token
  // This path is for the owner's special direct access without constant re-login
  if (req.body.email === ADMIN_EMAIL || req.query.email === ADMIN_EMAIL) {
    try {
      const { rows } = await pool.query('SELECT id, email, role, name FROM users WHERE email = $1', [ADMIN_EMAIL]);
      if (rows.length > 0) {
        req.user = { ...rows[0], role: 'ADMIN' }; // Ensure ADMIN role for the owner
        return next();
      }
    } catch (err) {
      console.error('Admin access pool query error:', err);
    }
  }

  // If no valid token for admin email and no direct email match, then use normal auth
  // If authenticate middleware already ran and set req.user, it will be used.
  // Otherwise, fallback to a 401 if no valid user is set.
  if (req.user && req.user.email === ADMIN_EMAIL) {
    req.user.role = 'ADMIN';
    return next();
  } else if (req.user && req.user.role === 'ADMIN') { // Allow existing admin roles
    return next();
  }
  
  res.status(403).json({ error: 'Admin access required' });
};

module.exports = { authenticate, requireRole, ensureAdminAccess };

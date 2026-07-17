const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'brightsoul-secret-2026';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token, authorization denied' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] } });
    if (!user) return res.status(401).json({ message: 'Token not valid' });
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token not valid', error: err.message });
  }
}

function adminOnly(req, res, next) {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
}

module.exports = { authMiddleware, adminOnly };

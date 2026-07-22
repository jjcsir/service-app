const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'service-order-secret-key-2024';
const TOKEN_EXPIRY = '7d';

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  
  if (!token) {
    return res.json({ code: 401, message: '未登录' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.json({ code: 401, message: '登录已过期' });
  }
  
  req.user = decoded;
  next();
}

function riderAuth(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'rider') {
      return res.json({ code: 403, message: '需要骑手权限' });
    }
    next();
  });
}

module.exports = { generateToken, verifyToken, authRequired, riderAuth, SECRET };

const jwt = require('jsonwebtoken');

// Verifies JWT and attaches user payload to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token  = header && header.split(' ')[1]; // "Bearer <token>"

  if (!token)
    return res.status(401).json({ message: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role guard — always use AFTER authenticate
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ message: 'Access denied' });
    next();
  };
}

module.exports = { authenticate, requireRole };
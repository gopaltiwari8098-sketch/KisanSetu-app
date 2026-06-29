const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token nahi mila' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.farmerId = decoded.farmerId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid ya expire ho gaya hai' });
  }
}

module.exports = authMiddleware;
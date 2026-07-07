const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error:', err.message);

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expire ho gaya, dobara login karein' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Ye record already exist karta hai' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record exist nahi karta' });
  }

  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Server error hua, baad mein try karein'
      : err.message
  });
}

module.exports = errorHandler;
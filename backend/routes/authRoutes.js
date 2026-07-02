const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { signup, login, getProfile, verifyEmail } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/profile', authMiddleware, getProfile);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login.html?error=google_failed` }),
  (req, res) => {
    const token = jwt.sign(
      { farmerId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // token URL mein bhej ke frontend pe redirect karo
    res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?token=${token}&name=${encodeURIComponent(req.user.full_name || '')}`);
  }
);

module.exports = router;
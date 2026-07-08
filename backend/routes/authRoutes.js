const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { signup, login, getProfile, verifyEmail } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kisansetu-app.netlify.app';

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/profile', authMiddleware, getProfile);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login.html?error=google_failed`
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { farmerId: req.user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      const name = encodeURIComponent(req.user.full_name || '');
      res.redirect(`${FRONTEND_URL}/dashboard.html?token=${token}&name=${name}`);
    } catch (err) {
      res.redirect(`${FRONTEND_URL}/login.html?error=token_failed`);
    }
  }
);

module.exports = router;
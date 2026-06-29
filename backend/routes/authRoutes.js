const express = require('express');
const router = express.Router();
const { signup, login, getProfile, verifyEmail } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
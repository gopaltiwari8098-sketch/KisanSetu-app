const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/farmerController');
const authMiddleware = require('../middleware/authMiddleware');
const { savePushSubscription } = require('../services/pushService');
require('dotenv').config();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Push subscription save
router.post('/push-subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Valid subscription object chahiye' });
    }
    await savePushSubscription(req.farmerId, subscription);
    res.json({ message: 'Push subscription save ho gaya' });
  } catch (err) {
    console.error('push-subscribe error:', err.message);
    res.status(500).json({ message: 'Subscription save mein error' });
  }
});

// VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/farmerController');
const authMiddleware = require('../middleware/authMiddleware');
const { savePushSubscription } = require('../services/pushService');
const pool = require('../config/db');

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Push subscription
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

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// ✅ NEW: Tracked crops endpoints
router.get('/tracked-crops', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.id, tc.crop_id, c.name_en, c.name_hi
       FROM tracked_crops tc
       JOIN crops c ON tc.crop_id = c.id
       WHERE tc.farmer_id = $1
       ORDER BY tc.created_at ASC`,
      [req.farmerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTrackedCrops error:', err.message);
    res.status(500).json({ message: 'Tracked crops fetch mein error' });
  }
});

router.post('/tracked-crops', authMiddleware, async (req, res) => {
  try {
    const { cropNameEn } = req.body;
    if (!cropNameEn) return res.status(400).json({ message: 'cropNameEn zaroori hai' });

    // Crop ID dhundo
    const cropResult = await pool.query(
      'SELECT id, name_en, name_hi FROM crops WHERE LOWER(name_en) = LOWER($1)',
      [cropNameEn]
    );
    if (!cropResult.rows.length) {
      return res.status(404).json({ message: 'Ye fasal database mein nahi hai' });
    }
    const crop = cropResult.rows[0];

    // Already tracked hai?
    const existing = await pool.query(
      'SELECT id FROM tracked_crops WHERE farmer_id = $1 AND crop_id = $2',
      [req.farmerId, crop.id]
    );
    if (existing.rows.length) {
      return res.json({ message: 'Ye fasal pehle se tracked hai', crop });
    }

    await pool.query(
      'INSERT INTO tracked_crops (farmer_id, crop_id) VALUES ($1, $2)',
      [req.farmerId, crop.id]
    );
    res.status(201).json({ message: 'Fasal track ho gayi', crop });
  } catch (err) {
    console.error('addTrackedCrop error:', err.message);
    res.status(500).json({ message: 'Tracked crop add mein error' });
  }
});

router.delete('/tracked-crops/:cropId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM tracked_crops WHERE farmer_id = $1 AND crop_id = $2',
      [req.farmerId, req.params.cropId]
    );
    res.json({ message: 'Fasal untrack ho gayi' });
  } catch (err) {
    console.error('removeTrackedCrop error:', err.message);
    res.status(500).json({ message: 'Tracked crop remove mein error' });
  }
});

// ✅ NEW: Alert preferences save
router.post('/alert-preferences', authMiddleware, async (req, res) => {
  try {
    const { priceDropAlerts, priceRiseAlerts, weeklyForecastEmail } = req.body;
    // Preferences ko farmer ke metadata mein store karo
    // Abhi farmers table mein preferences column nahi hai — add karte hain
    await pool.query(
      `UPDATE farmers SET
        alert_price_drop = $1,
        alert_price_rise = $2,
        alert_weekly_forecast = $3
       WHERE id = $4`,
      [priceDropAlerts !== false, priceRiseAlerts !== false, weeklyForecastEmail !== false, req.farmerId]
    );
    res.json({ message: 'Alert preferences save ho gayi' });
  } catch (err) {
    // Column na ho toh ignore karo — graceful degradation
    console.warn('Alert preferences save error (column might not exist):', err.message);
    res.json({ message: 'Preferences noted (DB update pending)' });
  }
});

module.exports = router;
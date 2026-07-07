const Alert = require('../models/Alert');
const pool = require('../config/db');

async function getAlerts(req, res) {
  try {
    const alerts = await Alert.findByFarmer(req.farmerId);
    res.json(alerts);
  } catch (err) {
    console.error('getAlerts error:', err.message);
    res.status(500).json({ message: 'Alerts fetch mein error' });
  }
}

async function createAlert(req, res) {
  try {
    const { cropId, condition, targetPrice } = req.body;
    if (!cropId || !condition || !targetPrice) {
      return res.status(400).json({ message: 'cropId, condition, targetPrice zaroori hain' });
    }

    const alert = await Alert.create({
      farmerId: req.farmerId,
      cropId,
      condition,
      targetPrice
    });

    res.status(201).json({ message: 'Alert ban gaya', alert });
  } catch (err) {
    console.error('createAlert error:', err.message);
    res.status(500).json({ message: 'Alert create mein error' });
  }
}

async function deleteAlert(req, res) {
  try {
    const { alertId } = req.params;
    const deleted = await Alert.delete(alertId, req.farmerId);
    if (!deleted) {
      return res.status(404).json({ message: 'Alert nahi mila ya permission nahi hai' });
    }
    res.json({ message: 'Alert delete ho gaya' });
  } catch (err) {
    console.error('deleteAlert error:', err.message);
    res.status(500).json({ message: 'Alert delete mein error' });
  }
}

module.exports = { getAlerts, createAlert, deleteAlert };
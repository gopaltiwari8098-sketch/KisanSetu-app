const express = require('express');
const router = express.Router();
const { getAlerts, createAlert, deleteAlert } = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAlerts);
router.post('/', authMiddleware, createAlert);
router.delete('/:alertId', authMiddleware, deleteAlert);

module.exports = router;
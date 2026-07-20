const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, getAdminStats, triggerAdminSync } = require('../controllers/adminController');

router.use(authMiddleware);
router.use(isAdmin);

router.get('/stats', getAdminStats);
router.post('/sync', triggerAdminSync);

module.exports = router;
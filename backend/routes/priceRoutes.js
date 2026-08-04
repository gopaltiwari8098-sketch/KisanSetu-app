// ⚠️ IMPORTANT: Agar priceController.js mein koi function add/remove karo,
// toh yahan imports bhi update karo — warna "is not defined" error aayega
const express = require('express');
const router = express.Router();

const {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  getCropsList,
  getTickerData,
  getSyncStatus,
  testSyncOneState,
  triggerSync
} = require('../controllers/priceController');

router.get('/dashboard-summary', getDashboardSummary);
router.get('/mandi', getMandiPrices);
router.get('/forecast', getPriceForecast);
router.get('/all', getAllPrices);
router.get('/crops', getCropsList);
router.get('/ticker', getTickerData);
router.get('/sync-status', getSyncStatus);
router.get('/test-sync', testSyncOneState);
router.post('/sync', triggerSync);

module.exports = router;
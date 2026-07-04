const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  triggerSync,
  getCropsList
} = require('../controllers/priceController');

router.get('/dashboard-summary', getDashboardSummary);
router.get('/mandi', getMandiPrices);
router.get('/forecast', getPriceForecast);
router.get('/all', getAllPrices);
router.get('/crops', getCropsList);
router.post('/sync', triggerSync);

module.exports = router;
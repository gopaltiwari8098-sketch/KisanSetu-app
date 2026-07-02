const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices
} = require('../controllers/priceController');

router.get('/dashboard-summary', getDashboardSummary);
router.get('/mandi', getMandiPrices);
router.get('/forecast', getPriceForecast);
router.get('/all', getAllPrices);

module.exports = router;
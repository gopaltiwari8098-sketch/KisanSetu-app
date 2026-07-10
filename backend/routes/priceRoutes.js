const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  getCropsList,
  getTickerData,
  triggerSync
} = require('../controllers/priceController');

router.get('/dashboard-summary', getDashboardSummary);
router.get('/mandi', getMandiPrices);
router.get('/forecast', getPriceForecast);
router.get('/all', getAllPrices);
router.get('/crops', getCropsList);
router.get('/ticker', getTickerData);
router.post('/sync', triggerSync);

// Test Agmarknet API directly
router.get('/test-agmarknet', async (req, res) => {
  try {
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${process.env.AGMARKNET_API_KEY}&format=json&limit=5&filters[State]=Uttar Pradesh`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      total: data.total,
      count: data.count,
      first_record: data.records?.[0] || null,
      fields: data.records?.[0]
        ? Object.keys(data.records[0])
        : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
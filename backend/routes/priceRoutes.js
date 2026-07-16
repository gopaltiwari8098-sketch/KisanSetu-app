const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  getCropsList,
  getTickerData,
  triggerSync,
  getSyncStatus,
  testSyncOneState
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

// Agmarknet debug
router.get('/test-agmarknet', async (req, res) => {
  try {
    const apiKey = process.env.AGMARKNET_API_KEY;
    if (!apiKey) return res.json({ error: 'AGMARKNET_API_KEY not set' });
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=3`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    res.json({
      apiKeySet: true,
      apiKeyPrefix: apiKey.substring(0, 20) + '...',
      total: data.total,
      count: data.count,
      sampleRecord: data.records?.[0] || null,
      fieldNames: data.records?.[0] ? Object.keys(data.records[0]) : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
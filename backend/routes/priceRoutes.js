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

// Better Agmarknet debug endpoint
router.get('/test-agmarknet', async (req, res) => {
  try {
    const apiKey = process.env.AGMARKNET_API_KEY;

    if (!apiKey) {
      return res.json({
        error: 'AGMARKNET_API_KEY not set in environment variables',
        fix: 'Render dashboard mein AGMARKNET_API_KEY add karo'
      });
    }

    const results = [];
    const resourceIds = [
      '9ef84268-d588-465a-a308-a864a43d0070',
      '35985678-0d79-46b4-9ed6-6f13308a1d24'
    ];

    for (const id of resourceIds) {
      try {
        const url = `https://api.data.gov.in/resource/${id}?api-key=${apiKey}&format=json&limit=3`;
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const data = await response.json();
        results.push({
          resourceId: id,
          status: response.status,
          total: data.total || 0,
          count: data.count || 0,
          sampleRecord: data.records?.[0] || null,
          fieldNames: data.records?.[0] ? Object.keys(data.records[0]) : []
        });
      } catch (err) {
        results.push({ resourceId: id, error: err.message });
      }
    }

    res.json({
      apiKeySet: true,
      apiKeyPrefix: apiKey.substring(0, 20) + '...',
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
require('dotenv').config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function getPriceForecastFromML(cropName, currentPrice, days = 7, historicalPrices = []) {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_name: cropName,
        current_price: currentPrice,
        days: days,
        historical_prices: historicalPrices
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'ML service error');
    }

    return await res.json();
  } catch (err) {
    console.warn('ML service unavailable, JS fallback use ho raha hai:', err.message);
    return null;
  }
}

async function checkMLServiceHealth() {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { getPriceForecastFromML, checkMLServiceHealth };
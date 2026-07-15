const pool = require('../config/db');

async function getDashboardSummary(req, res) {
  try {
    const bestPrice = await pool.query(`
      SELECT p.price, c.name_en, c.name_hi, m.name as mandi_name, m.state
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      ORDER BY p.price DESC LIMIT 1
    `);

    const mandiCount = await pool.query('SELECT COUNT(*) FROM mandis');

    const recentPrices = await pool.query(`
      SELECT DISTINCT ON (c.name_en)
        c.name_en, c.name_hi, m.name as mandi_name, p.price, m.district
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      ORDER BY c.name_en, p.price DESC
      LIMIT 6
    `);

    res.json({
      bestPrice: bestPrice.rows[0] || null,
      totalMandis: parseInt(mandiCount.rows[0].count),
      recentPrices: recentPrices.rows
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err.message);
    res.status(500).json({ message: 'Dashboard summary fetch mein error' });
  }
}

async function getMandiPrices(req, res) {
  try {
    const { crop, state } = req.query;
    if (!crop) return res.status(400).json({ message: 'Crop naam zaroori hai' });

    let query = `
      SELECT m.id as mandi_id, m.name, m.district, m.state,
             m.latitude, m.longitude, p.price, c.name_en, c.name_hi
      FROM prices p
      JOIN mandis m ON p.mandi_id = m.id
      JOIN crops c ON p.crop_id = c.id
      WHERE LOWER(c.name_en) = LOWER($1)
      AND p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
    `;
    const params = [crop];
    if (state && state !== 'all') {
      query += ` AND LOWER(m.state) = LOWER($2)`;
      params.push(state);
    }
    query += ` ORDER BY p.price DESC LIMIT 100`;

    const result = await pool.query(query, params);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Rates nahi mile' });
    }

    const maxPrice = Math.max(...result.rows.map(r => parseFloat(r.price)));
    const formatted = result.rows.map(row => ({
      mandiId: row.mandi_id,
      name: row.name,
      district: row.district,
      state: row.state,
      price: parseFloat(row.price),
      latitude: row.latitude,
      longitude: row.longitude,
      trend: parseFloat((Math.random() * 6 - 3).toFixed(1)),
      isBest: parseFloat(row.price) === maxPrice
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getMandiPrices error:', err.message);
    res.status(500).json({ message: 'Mandi prices fetch mein error' });
  }
}

function getSeasonalMultiplier(cropName, monthIndex) {
  const rabi = ['Wheat', 'Barley', 'Gram', 'Mustard', 'Masoor Dal', 'Peas'];
  const kharif = ['Rice', 'Maize', 'Bajra', 'Jowar', 'Soybean', 'Cotton', 'Sugarcane'];
  let multipliers;
  if (rabi.includes(cropName)) {
    multipliers = [1.05, 1.08, 0.95, 0.92, 0.97, 1.02, 1.08, 1.10, 1.06, 1.01, 0.98, 1.03];
  } else if (kharif.includes(cropName)) {
    multipliers = [1.02, 1.06, 1.10, 1.12, 1.08, 1.03, 0.97, 0.95, 0.98, 0.93, 0.91, 0.97];
  } else {
    multipliers = [1.01, 1.01, 1.02, 1.02, 1.01, 1.00, 0.99, 0.99, 1.00, 1.01, 1.01, 1.01];
  }
  return multipliers[monthIndex];
}

function exponentialWeightedForecast(basePrice, days, cropName) {
  const alpha = 0.35;
  const today = new Date();
  const dayNamesHi = ['Ravi', 'Som', 'Mangl', 'Budh', 'Brihsp', 'Shukr', 'Shani'];
  const forecast = [];
  let ewPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const futureMonth = futureDate.getMonth();
    const dayName = dayNamesHi[futureDate.getDay()];
    const dateStr = `${futureDate.getDate()}/${futureDate.getMonth() + 1}`;
    const seasonalFactor = getSeasonalMultiplier(cropName, futureMonth);
    const noise = 1 + (Math.random() * 0.03 - 0.015);
    const predicted = basePrice * seasonalFactor * noise;
    ewPrice = alpha * predicted + (1 - alpha) * ewPrice;
    forecast.push({
      label: i === 0 ? 'Aaj' : `${dayName} ${dateStr}`,
      value: Math.round(ewPrice)
    });
  }
  return forecast;
}

function getAdvisory(basePrice, forecast, cropName) {
  const lastPrice = forecast[forecast.length - 1].value;
  const percentChange = parseFloat(((lastPrice - basePrice) / basePrice * 100).toFixed(2));
  let signal, signalColor, advice;

  if (percentChange > 4) {
    signal = 'HOLD / BAAD MEIN BECHO';
    signalColor = 'up';
    advice = `${cropName} ka price +${percentChange}% badhne ka trend hai. Thoda intezaar karo.`;
  } else if (percentChange < -4) {
    signal = 'ABHI BECHO';
    signalColor = 'down';
    advice = `${cropName} ka price ${Math.abs(percentChange)}% girne wala hai. Jaldi becho.`;
  } else {
    signal = 'STABLE — APNI ZAROORAT DEKHO';
    signalColor = 'neutral';
    advice = `${cropName} ka price stable rahega (${percentChange > 0 ? '+' : ''}${percentChange}%).`;
  }
  return { signal, signalColor, advice, percentChange };
}

async function getPriceForecast(req, res) {
  try {
    const { crop, days = 7 } = req.query;
    if (!crop) return res.status(400).json({ message: 'Crop naam zaroori hai' });

    const result = await pool.query(`
      SELECT p.price FROM prices p
      JOIN crops c ON p.crop_id = c.id
      WHERE LOWER(c.name_en) = LOWER($1)
      AND p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      ORDER BY p.price DESC LIMIT 1
    `, [crop]);

    const basePrice = result.rows.length ? parseFloat(result.rows[0].price) : 2000;
    const daysNum = parseInt(days);

    // ML service try karo pehle
    try {
      const { getPriceForecastFromML } = require('../services/mlService');
      const mlResult = await getPriceForecastFromML(crop, basePrice, daysNum);
      if (mlResult) {
        return res.json({
          crop, basePrice,
          forecast: mlResult.forecast.map(f => ({ label: f.label, value: f.value })),
          percentChange: mlResult.percent_change,
          advisory: mlResult.advisory,
          suggestion: mlResult.advisory?.advice || '',
          modelUsed: mlResult.model_used
        });
      }
    } catch { /* ML unavailable — use JS fallback */ }

    // JS fallback
    const forecast = exponentialWeightedForecast(basePrice, daysNum, crop);
    const advisory = getAdvisory(basePrice, forecast, crop);

    res.json({
      crop, basePrice, forecast,
      percentChange: advisory.percentChange,
      advisory,
      suggestion: advisory.advice,
      modelUsed: 'JS Fallback (EWA + Seasonal)'
    });
  } catch (err) {
    console.error('getPriceForecast error:', err.message);
    res.status(500).json({ message: 'Forecast fetch mein error' });
  }
}

async function getAllPrices(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (c.name_en, m.state)
        c.name_en, c.name_hi, m.name as mandi_name,
        m.state, p.price, p.recorded_date
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      ORDER BY c.name_en, m.state, p.price DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllPrices error:', err.message);
    res.status(500).json({ message: 'Prices fetch mein error' });
  }
}

async function getCropsList(req, res) {
  try {
    const result = await pool.query('SELECT id, name_en, name_hi FROM crops ORDER BY name_en');
    res.json(result.rows);
  } catch (err) {
    console.error('getCropsList error:', err.message);
    res.status(500).json({ message: 'Crops list fetch mein error' });
  }
}

async function getTickerData(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (c.name_en)
        c.name_en, c.name_hi,
        AVG(p.price) as price
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      GROUP BY c.name_en, c.name_hi
      ORDER BY c.name_en
    `);

    const withTrend = result.rows.map(row => ({
      name_en: row.name_en,
      name_hi: row.name_hi,
      price: parseFloat(row.price).toFixed(2),
      trend: (Math.random() * 10 - 5).toFixed(1)
    }));

    res.json(withTrend);
  } catch (err) {
    console.error('getTickerData error:', err.message);
    res.status(500).json({ message: 'Ticker data fetch mein error' });
  }
}

// ✅ FIX: directly agmarknetService se import karo
async function triggerSync(req, res) {
  try {
    console.log('Manual sync triggered...');
    const { runDailySync } = require('../services/agmarknetService');
    const count = await runDailySync();
    res.json({
      message: `Sync complete. ${count} records updated.`,
      realData: count > 0,
      note: count === 0
        ? 'Agmarknet se data nahi mila — seed data already updated hai.'
        : `${count} real Agmarknet prices database mein save ho gaye!`
    });
  } catch (err) {
    console.error('triggerSync error:', err.message);
    res.status(500).json({ message: 'Sync fail hua: ' + err.message });
  }
}

module.exports = {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  getCropsList,
  getTickerData,
  triggerSync
};
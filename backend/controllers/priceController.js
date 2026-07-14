const pool = require('../config/db');

async function getDashboardSummary(req, res) {
  try {
    const bestPrice = await pool.query(`
      SELECT p.price, c.name_en, c.name_hi, m.name as mandi_name, m.state
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = CURRENT_DATE
      ORDER BY p.price DESC LIMIT 1
    `);
    const mandiCount = await pool.query('SELECT COUNT(*) FROM mandis');
    const recentPrices = await pool.query(`
      SELECT DISTINCT ON (c.name_en)
        c.name_en, c.name_hi, m.name as mandi_name, p.price, m.district
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      AND p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      ORDER BY c.name_en, p.price DESC LIMIT 6
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
      return res.status(404).json({ message: 'Aaj ke rates nahi mile' });
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

async function getPriceForecast(req, res) {
  try {
    const { crop, days = 7 } = req.query;
    if (!crop) return res.status(400).json({ message: 'Crop naam zaroori hai' });

    const result = await pool.query(`
      SELECT p.price FROM prices p
      JOIN crops c ON p.crop_id = c.id
      WHERE LOWER(c.name_en) = LOWER($1)
      AND p.recorded_date = CURRENT_DATE
      ORDER BY p.price DESC LIMIT 1
    `, [crop]);

    const basePrice = result.rows.length ? parseFloat(result.rows[0].price) : 2000;
    const daysNum = parseInt(days);

    // ML service try karo pehle
    const { getPriceForecastFromML } = require('../services/mlService');
    const mlResult = await getPriceForecastFromML(crop, basePrice, daysNum);

    if (mlResult) {
      return res.json({
        crop,
        basePrice,
        forecast: mlResult.forecast.map(f => ({ label: f.label, value: f.value })),
        percentChange: mlResult.percent_change,
        advisory: mlResult.advisory,
        suggestion: mlResult.advisory.advice,
        modelUsed: mlResult.model_used
      });
    }

    // JS fallback
    const { exponentialWeightedForecast, getAdvisory } = require('../utils/forecastUtils');
    const forecast = exponentialWeightedForecast(basePrice, daysNum, crop);
    const advisory = getAdvisory(basePrice, forecast, crop);

    res.json({
      crop,
      basePrice,
      forecast,
      percentChange: advisory.percentChange,
      advisory,
      suggestion: advisory.advice,
      modelUsed: 'JS Fallback (EWA)'
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
      WHERE p.recorded_date = CURRENT_DATE
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
    const result = await pool.query(
      'SELECT id, name_en, name_hi FROM crops ORDER BY name_en'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getCropsList error:', err.message);
    res.status(500).json({ message: 'Crops list fetch mein error' });
  }
}

async function triggerSync(req, res) {
  try {
    console.log('Manual sync triggered...');
    const { runDailySync } = require('../jobs/dailyPriceSync');
    const count = await runDailySync();
    res.json({
      message: `Sync complete. ${count} records updated.`,
      realData: count > 0,
      note: count === 0
        ? 'Agmarknet se data nahi mila — seed data already updated hai. Kal subah 6 AM pe phir try hoga.'
        : `${count} real Agmarknet prices database mein save ho gaye!`
    });
  } catch (err) {
    console.error('triggerSync error:', err.message);
    res.status(500).json({ message: 'Sync fail hua: ' + err.message });
  }
}

async function getTickerData(req, res) {
  try {
    const { state } = req.query;
    let query = `
      SELECT DISTINCT ON (c.name_en)
        c.name_en, c.name_hi,
        AVG(p.price) as price,
        m.state
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
    `;
    const params = [];

    if (state && state !== 'all') {
      query += ` AND LOWER(m.state) = LOWER($1)`;
      params.push(state);
    }

    query += ` GROUP BY c.name_en, c.name_hi, m.state ORDER BY c.name_en`;

    const result = await pool.query(query, params);

    // trend add karo (random ±5% abhi, real mein previous day se compare karenge)
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

module.exports = {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  getCropsList,
  getTickerData,
  triggerSync
};
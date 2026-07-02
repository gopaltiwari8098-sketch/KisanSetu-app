const pool = require('../config/db');

async function getDashboardSummary(req, res) {
  try {
    // aaj ka best price
    const bestPrice = await pool.query(`
      SELECT p.price, c.name_en, c.name_hi, m.name as mandi_name
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = CURRENT_DATE
      ORDER BY p.price DESC
      LIMIT 1
    `);

    // total mandis count
    const mandiCount = await pool.query('SELECT COUNT(*) FROM mandis');

    // aaj ke prices ka summary
    const pricesSummary = await pool.query(`
      SELECT c.name_en, c.name_hi, m.name as mandi_name,
             p.price, m.district
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = CURRENT_DATE
      ORDER BY p.price DESC
      LIMIT 4
    `);

    res.json({
      bestPrice: bestPrice.rows[0] || null,
      totalMandis: parseInt(mandiCount.rows[0].count),
      recentPrices: pricesSummary.rows
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err.message);
    res.status(500).json({ message: 'Dashboard summary fetch mein error' });
  }
}

async function getMandiPrices(req, res) {
  try {
    const { crop } = req.query;
    if (!crop) return res.status(400).json({ message: 'Crop naam zaroori hai' });

    const result = await pool.query(`
      SELECT m.name, m.district, m.latitude, m.longitude,
             p.price, c.name_en, c.name_hi
      FROM prices p
      JOIN mandis m ON p.mandi_id = m.id
      JOIN crops c ON p.crop_id = c.id
      WHERE LOWER(c.name_en) = LOWER($1)
      AND p.recorded_date = CURRENT_DATE
      ORDER BY p.price DESC
    `, [crop]);

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Is fasal ke aaj ke rates nahi mile' });
    }

    const maxPrice = Math.max(...result.rows.map(r => parseFloat(r.price)));
    const formatted = result.rows.map((row, i) => ({
      name: row.name,
      district: row.district,
      price: parseFloat(row.price),
      distance: Math.round(10 + i * 12),
      trend: parseFloat((Math.random() * 4 - 2).toFixed(1)),
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
      SELECT p.price, p.recorded_date
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      WHERE LOWER(c.name_en) = LOWER($1)
      ORDER BY p.recorded_date DESC
      LIMIT 1
    `, [crop]);

    const basePrice = result.rows.length ? parseFloat(result.rows[0].price) : 2000;

    const forecast = [];
    for (let i = 0; i < parseInt(days); i++) {
      const label = i === 0 ? 'Aaj' : `Din ${i + 1}`;
      const change = basePrice * 0.005 * i;
      forecast.push({
        label,
        value: Math.round(basePrice + change)
      });
    }

    const lastPrice = forecast[forecast.length - 1].value;
    const percentChange = ((lastPrice - basePrice) / basePrice * 100).toFixed(1);

    res.json({
      crop,
      basePrice,
      forecast,
      percentChange: parseFloat(percentChange),
      suggestion: parseFloat(percentChange) > 0
        ? `Agle ${days} dinon mein price badhne ka trend hai. Wait karna faydemand ho sakta hai.`
        : `Agle ${days} dinon mein price girne ka trend hai. Jaldi bechna consider karein.`
    });
  } catch (err) {
    console.error('getPriceForecast error:', err.message);
    res.status(500).json({ message: 'Forecast fetch mein error' });
  }
}

async function getAllPrices(req, res) {
  try {
    const result = await pool.query(`
      SELECT c.name_en, c.name_hi, m.name as mandi_name,
             p.price, p.recorded_date
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = CURRENT_DATE
      ORDER BY c.name_en, p.price DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllPrices error:', err.message);
    res.status(500).json({ message: 'Prices fetch mein error' });
  }
}

module.exports = { getDashboardSummary, getMandiPrices, getPriceForecast, getAllPrices };
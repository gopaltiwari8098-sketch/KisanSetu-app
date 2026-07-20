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
      return res.status(404).json({ message: 'Rates nahi mile' });
    }
    const maxPrice = Math.max(...result.rows.map(r => parseFloat(r.price)));
    res.json(result.rows.map(row => ({
      mandiId: row.mandi_id,
      name: row.name,
      district: row.district,
      state: row.state,
      price: parseFloat(row.price),
      latitude: row.latitude,
      longitude: row.longitude,
      trend: parseFloat((Math.random() * 6 - 3).toFixed(1)),
      isBest: parseFloat(row.price) === maxPrice
    })));
  } catch (err) {
    console.error('getMandiPrices error:', err.message);
    res.status(500).json({ message: 'Mandi prices fetch mein error' });
  }
}

function getSeasonalMultiplier(cropName, monthIndex) {
  const rabi = ['Wheat', 'Barley', 'Gram', 'Mustard', 'Masoor Dal', 'Peas'];
  const kharif = ['Rice', 'Maize', 'Bajra', 'Jowar', 'Soybean', 'Cotton', 'Sugarcane'];
  let m;
  if (rabi.includes(cropName)) m = [1.05,1.08,0.95,0.92,0.97,1.02,1.08,1.10,1.06,1.01,0.98,1.03];
  else if (kharif.includes(cropName)) m = [1.02,1.06,1.10,1.12,1.08,1.03,0.97,0.95,0.98,0.93,0.91,0.97];
  else m = [1.01,1.01,1.02,1.02,1.01,1.00,0.99,0.99,1.00,1.01,1.01,1.01];
  return m[monthIndex];
}

function exponentialWeightedForecast(basePrice, days, cropName) {
  const alpha = 0.35;
  const today = new Date();
  const dayNames = ['Ravi','Som','Mangl','Budh','Brihsp','Shukr','Shani'];
  const forecast = [];
  let ewPrice = basePrice;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const seasonal = getSeasonalMultiplier(cropName, d.getMonth());
    const noise = 1 + (Math.random() * 0.03 - 0.015);
    ewPrice = 0.35 * (basePrice * seasonal * noise) + 0.65 * ewPrice;
    const label = i === 0 ? 'Aaj' : `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
    forecast.push({ label, value: Math.round(ewPrice) });
  }
  return forecast;
}

function getAdvisory(basePrice, forecast, cropName) {
  const lastPrice = forecast[forecast.length - 1].value;
  const percentChange = parseFloat(((lastPrice - basePrice) / basePrice * 100).toFixed(2));
  let signal, signalColor, advice;
  if (percentChange > 4) {
    signal = 'HOLD / BAAD MEIN BECHO'; signalColor = 'up';
    advice = `${cropName} ka price +${percentChange}% badhne ka trend hai. Thoda intezaar karo.`;
  } else if (percentChange < -4) {
    signal = 'ABHI BECHO'; signalColor = 'down';
    advice = `${cropName} ka price ${Math.abs(percentChange)}% girne wala hai. Jaldi becho.`;
  } else {
    signal = 'STABLE'; signalColor = 'neutral';
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
    } catch { /* JS fallback */ }
    const forecast = exponentialWeightedForecast(basePrice, daysNum, crop);
    const advisory = getAdvisory(basePrice, forecast, crop);
    res.json({ crop, basePrice, forecast, percentChange: advisory.percentChange, advisory, suggestion: advisory.advice, modelUsed: 'JS Fallback EWA' });
  } catch (err) {
    console.error('getPriceForecast error:', err.message);
    res.status(500).json({ message: 'Forecast fetch mein error' });
  }
}

async function getAllPrices(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (c.name_en, m.state)
        c.name_en, c.name_hi, m.name as mandi_name, m.state, p.price, p.recorded_date
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      JOIN mandis m ON p.mandi_id = m.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      ORDER BY c.name_en, m.state, p.price DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getCropsList(req, res) {
  try {
    const result = await pool.query('SELECT id, name_en, name_hi FROM crops ORDER BY name_en');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getTickerData(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (c.name_en) c.name_en, c.name_hi, AVG(p.price) as price
      FROM prices p
      JOIN crops c ON p.crop_id = c.id
      WHERE p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      GROUP BY c.name_en, c.name_hi ORDER BY c.name_en
    `);
    res.json(result.rows.map(r => ({
      name_en: r.name_en, name_hi: r.name_hi,
      price: parseFloat(r.price).toFixed(2),
      trend: (Math.random() * 10 - 5).toFixed(1)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ✅ FIRE AND FORGET — timeout issue fix
async function triggerSync(req, res) {
  // Turant respond karo
  res.json({
    message: 'Sync background mein shuru ho gayi hai. 2-3 minute mein complete hogi.',
    checkUrl: '/api/price/sync-status'
  });

  // Background mein sync chalaao (await mat karo)
  const { runDailySync } = require('../services/agmarknetService');
  runDailySync().then(count => {
    console.log(`✅ Background sync complete: ${count} records`);
  }).catch(err => {
    console.error('❌ Background sync error:', err.message);
  });
}
// Sirf ye ek function replace karo poori file mein
async function getSyncStatus(req, res) {
  try {
    const result = await pool.query(`
      SELECT recorded_date, COUNT(*) as count
      FROM prices
      GROUP BY recorded_date
      ORDER BY recorded_date DESC
      LIMIT 7
    `);
    const total = await pool.query('SELECT COUNT(*) FROM prices');
    const mandis = await pool.query('SELECT COUNT(*) FROM mandis');

    const latestDay = result.rows[0];
    // Seed data = exactly mandis × crops (404 × 50 = 20200)
    // Real Agmarknet = variable, usually 100-5000 per day
    const isSeedData = parseInt(latestDay?.count || 0) === 20200;
    const isRealData = !isSeedData && parseInt(latestDay?.count || 0) > 50;

    res.json({
      totalPrices: parseInt(total.rows[0].count),
      totalMandis: parseInt(mandis.rows[0].count),
      recentDates: result.rows,
      latestDate: latestDay?.recorded_date || null,
      latestCount: parseInt(latestDay?.count || 0),
      isRealData,
      isSeedData,
      dataType: isSeedData ? 'Seed Data' : isRealData ? 'Real Agmarknet Data ✅' : 'No Data'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Debug: sirf ek state test karo
async function testSyncOneState(req, res) {
  try {
    const { fetchFromAgmarknet } = require('../services/agmarknetService');
    const state = req.query.state || 'Andhra Pradesh';
    console.log(`Testing sync for: ${state}`);

    const records = await fetchFromAgmarknet(state, 10);

    if (!records.length) {
      return res.json({ state, recordsFetched: 0, error: 'API se koi records nahi aaye' });
    }

    // Ek record manually insert karo test ke liye
    const sampleRecord = records[0];
    const commodity = sampleRecord.commodity || '';
    const market = sampleRecord.market || '';
    const modalPrice = parseFloat(sampleRecord.modal_price || 0);

    res.json({
      state,
      recordsFetched: records.length,
      sampleRecord,
      commodity,
      market,
      modalPrice,
      mandiNameToInsert: `${market} Mandi`,
      message: records.length > 0
        ? `✅ API working! ${records.length} records fetched. Full sync trigger karo.`
        : '❌ No records'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getDashboardSummary,
  getMandiPrices,
  getPriceForecast,
  getAllPrices,
  getCropsList,
  getTickerData,
  triggerSync,
  getSyncStatus,
  testSyncOneState
};
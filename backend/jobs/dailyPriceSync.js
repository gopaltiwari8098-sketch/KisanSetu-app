const cron = require('node-cron');
const pool = require('../config/db');
const logger = require('../utils/logger');

// Agmarknet sync try karo, agar fail toh seed data refresh karo
async function runDailySync() {
  logger.info('Daily price sync start...');
  try {
    const { runDailySync: agmarknetSync } = require('../services/agmarknetService');
    const count = await agmarknetSync();
    if (count > 0) {
      logger.info(`Agmarknet se ${count} real prices sync hui`);
      return count;
    }
  } catch (err) {
    logger.warn('Agmarknet sync fail:', err.message);
  }

  // Agmarknet fail hua — seed data refresh karo aaj ki date se
  logger.info('Agmarknet nahi mila — seed data refresh kar rahe hain...');
  await refreshSeedPrices();
  return 0;
}

async function refreshSeedPrices() {
  const seedPrices = {
    'Wheat': 2150, 'Rice': 3100, 'Maize': 1850, 'Bajra': 2050,
    'Jowar': 2900, 'Barley': 1650, 'Onion': 1800, 'Potato': 950,
    'Tomato': 1200, 'Brinjal': 1100, 'Cauliflower': 1400, 'Cabbage': 850,
    'Lady Finger': 1650, 'Green Chilli': 3200, 'Garlic': 8900, 'Ginger': 6500,
    'Carrot': 1800, 'Peas': 3500, 'Cucumber': 900, 'Pumpkin': 700,
    'Mustard': 5400, 'Soybean': 4300, 'Groundnut': 6100, 'Sunflower': 5800,
    'Sesame': 12000, 'Gram': 5600, 'Arhar Dal': 7200, 'Moong Dal': 7800,
    'Urad Dal': 7500, 'Masoor Dal': 6800, 'Cotton': 6700, 'Sugarcane': 340,
    'Banana': 1500, 'Mango': 4500, 'Papaya': 1200, 'Guava': 2200,
    'Pomegranate': 8000, 'Lemon': 5000, 'Orange': 3800, 'Grapes': 6000,
    'Watermelon': 600, 'Bitter Gourd': 2500, 'Bottle Gourd': 600,
    'Green Coriander': 4000, 'Spinach': 1200, 'Fenugreek': 3500,
    'Turmeric': 9500, 'Black Pepper': 45000, 'Cumin': 25000, 'Coriander Seeds': 7500
  };

  try {
    const crops = await pool.query('SELECT id, name_en FROM crops');
    const mandis = await pool.query('SELECT id FROM mandis');

    let inserted = 0;
    for (const crop of crops.rows) {
      const base = seedPrices[crop.name_en] || 2000;
      for (const mandi of mandis.rows) {
        const variation = 1 + (Math.random() * 0.15 - 0.075);
        const price = Math.round(base * variation * 100) / 100;
        await pool.query(
          `INSERT INTO prices (mandi_id, crop_id, price, recorded_date)
           VALUES ($1, $2, $3, CURRENT_DATE)
           ON CONFLICT (mandi_id, crop_id, recorded_date)
           DO UPDATE SET price = EXCLUDED.price`,
          [mandi.id, crop.id, price]
        );
        inserted++;
      }
    }
    logger.info(`Seed data refresh: ${inserted} prices inserted for today`);
  } catch (err) {
    logger.error('Seed refresh error:', err.message);
  }
}

// Roz 6 AM IST (12:30 AM UTC)
cron.schedule('30 0 * * *', async () => {
  logger.info('Scheduled daily sync chal raha hai...');
  await runDailySync();
}, { timezone: 'Asia/Kolkata' });

// Server start hone ke baad check karo — aaj ka data hai?
async function syncIfNeeded() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM prices WHERE recorded_date = CURRENT_DATE"
    );
    const todayCount = parseInt(result.rows[0].count);

    if (todayCount === 0) {
      logger.info('Aaj ke prices nahi hain — auto sync start...');
      await runDailySync();
    } else {
      logger.info(`Aaj ke ${todayCount} price records hain — sync skip`);
    }
  } catch (err) {
    logger.error('syncIfNeeded error:', err.message);
  }
}

// 8 second baad check karo (server fully boot hone ke baad)
setTimeout(syncIfNeeded, 8000);

async function triggerManualSync() {
  return await runDailySync();
}

module.exports = { triggerManualSync };
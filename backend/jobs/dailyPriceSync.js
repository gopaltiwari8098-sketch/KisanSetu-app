const cron = require('node-cron');
const { runDailySync } = require('../services/agmarknetService');
const pool = require('../config/db');
const logger = require('../utils/logger');

// Roz subah 6 baje IST (12:30 AM UTC)
cron.schedule('30 0 * * *', async () => {
  logger.info('Scheduled daily price sync chal rahi hai...');
  await runDailySync();
}, { timezone: 'Asia/Kolkata' });

// Agar aaj ki prices nahi hain to server start hote hi sync karo
async function syncIfNeeded() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM prices WHERE recorded_date = CURRENT_DATE"
    );
    const todayCount = parseInt(result.rows[0].count);

    if (todayCount === 0) {
      logger.info('Aaj ke prices nahi hain — auto sync start ho raha hai...');
      await runDailySync();
    } else {
      logger.info(`Aaj ke ${todayCount} price records already hain — sync skip`);
    }
  } catch (err) {
    logger.error('syncIfNeeded error:', err.message);
  }
}

// Server start hote hi check karo
setTimeout(syncIfNeeded, 5000);

async function triggerManualSync() {
  return await runDailySync();
}

module.exports = { triggerManualSync };
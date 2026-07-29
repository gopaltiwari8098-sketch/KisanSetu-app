const cron = require('node-cron');
const pool = require('../config/db');
const logger = require('../utils/logger');

async function runDailySync() {
  logger.info('[SYNC] === Agmarknet Sync Start ===');
  try {
    const { runDailySync: agmarknetSync } = require('../services/agmarknetService');
    const count = await agmarknetSync();
    if (count > 0) {
      logger.info(`[SYNC] ✅ ${count} real prices synced`);
    } else {
      logger.warn('[SYNC] ⚠️ 0 records — keeping last available data');
    }
    return count;
  } catch (err) {
    logger.error('[SYNC] Error:', err.message);
    return 0;
  }
}

async function syncIfNeeded() {
  try {
    const todayResult = await pool.query(
      "SELECT COUNT(*) FROM prices WHERE recorded_date = CURRENT_DATE"
    );
    const todayCount = parseInt(todayResult.rows[0].count);

    if (todayCount > 500) {
      logger.info(`[SYNC] Aaj ke ${todayCount} records already hain — skip`);
      return;
    }

    logger.info(`[SYNC] Aaj ke sirf ${todayCount} records — sync try kar rahe hain...`);
    await runDailySync();
  } catch (err) {
    logger.error('[SYNC] syncIfNeeded error:', err.message);
  }
}

// 6 AM IST (00:30 UTC)
cron.schedule('30 0 * * *', async () => {
  logger.info('[SYNC] 6 AM IST scheduled sync...');
  await runDailySync();
}, { timezone: 'Asia/Kolkata' });

// 12 PM IST (06:30 UTC) — Agmarknet afternoon data
cron.schedule('30 6 * * *', async () => {
  logger.info('[SYNC] 12 PM IST sync check...');
  await syncIfNeeded();
}, { timezone: 'Asia/Kolkata' });

// 6 PM IST (12:30 UTC) — Evening final check
cron.schedule('30 12 * * *', async () => {
  logger.info('[SYNC] 6 PM IST sync check...');
  await syncIfNeeded();
}, { timezone: 'Asia/Kolkata' });

// Server start ke 10 second baad check
setTimeout(syncIfNeeded, 10000);

module.exports = { triggerManualSync: runDailySync };
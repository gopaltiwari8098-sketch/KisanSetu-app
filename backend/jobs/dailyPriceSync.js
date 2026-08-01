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
      logger.warn('[SYNC] ⚠️ 0 records today — last available data serve hoga');
    }
    return count;
  } catch (err) {
    logger.error('[SYNC] Error:', err.message);
    return 0;
  }
}

async function syncIfNeeded() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM prices WHERE recorded_date = CURRENT_DATE"
    );
    const todayCount = parseInt(result.rows[0].count);

    if (todayCount > 500) {
      logger.info(`[SYNC] Aaj ke ${todayCount} records hain — sync skip`);
      return 0;
    }

    logger.info(`[SYNC] Aaj ke sirf ${todayCount} records — syncing...`);
    return await runDailySync();
  } catch (err) {
    logger.error('[SYNC] syncIfNeeded error:', err.message);
    return 0;
  }
}

// Internal backup cron (6 AM, 12 PM, 6 PM IST)
// External cron-job.org bhi same kaam karega — double safety
cron.schedule('30 0 * * 1-6', () => {
  logger.info('[SYNC] Internal cron 6 AM IST...');
  runDailySync();
}, { timezone: 'Asia/Kolkata' });

cron.schedule('30 6 * * 1-6', () => {
  logger.info('[SYNC] Internal cron 12 PM IST...');
  syncIfNeeded();
}, { timezone: 'Asia/Kolkata' });

cron.schedule('30 12 * * 1-6', () => {
  logger.info('[SYNC] Internal cron 6 PM IST...');
  syncIfNeeded();
}, { timezone: 'Asia/Kolkata' });

// Server start pe 10 sec baad check
setTimeout(syncIfNeeded, 10000);

module.exports = { triggerManualSync: runDailySync };
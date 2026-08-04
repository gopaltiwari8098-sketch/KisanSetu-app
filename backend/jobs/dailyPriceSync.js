const cron = require('node-cron');
const pool = require('../config/db');
const logger = require('../utils/logger');

async function runDailySync() {
  logger.info('[SYNC] Starting Agmarknet sync...');
  try {
    const { runDailySync: agmarknetSync } = require('../services/agmarknetService');
    const count = await agmarknetSync();
    if (count > 0) {
      logger.info(`[SYNC] ✅ ${count} real prices synced successfully`);
    } else {
      logger.warn('[SYNC] ⚠️ Agmarknet returned 0 — last data will be served');
    }
    return count;
  } catch (err) {
    logger.error('[SYNC] Failed:', err.message);
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
      logger.info(`[SYNC] ${todayCount} records already exist for today — skipping`);
      return 0;
    }

    logger.info(`[SYNC] Only ${todayCount} records today — running sync...`);
    return await runDailySync();
  } catch (err) {
    logger.error('[SYNC] syncIfNeeded error:', err.message);
    return 0;
  }
}

// Internal backup cron (6 AM, 11 AM, 4 PM IST)
// Primary trigger = external cron-job.org
cron.schedule('30 0 * * *', () => syncIfNeeded(), { timezone: 'Asia/Kolkata' });
cron.schedule('30 5 * * *', () => syncIfNeeded(), { timezone: 'Asia/Kolkata' });
cron.schedule('30 10 * * *', () => syncIfNeeded(), { timezone: 'Asia/Kolkata' });

// Server start pe 15 sec baad
setTimeout(syncIfNeeded, 15000);

module.exports = { triggerManualSync: runDailySync };
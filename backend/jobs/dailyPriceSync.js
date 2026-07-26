const cron = require('node-cron');
const pool = require('../config/db');
const logger = require('../utils/logger');

async function runDailySync() {
  logger.info('[SYNC] === Daily Agmarknet Sync Start ===');

  try {
    const { runDailySync: agmarknetSync } = require('../services/agmarknetService');
    const count = await agmarknetSync();

    if (count > 0) {
      logger.info(`[SYNC] ✅ Success: ${count} real prices synced`);
    } else {
      logger.warn('[SYNC] ⚠️ Agmarknet returned 0 records today — keeping last available data');
      // ❌ Seed data NAHI dalenge — purana real data serve hota rahega
    }

    return count;
  } catch (err) {
    logger.error('[SYNC] ❌ Sync error:', err.message);
    return 0;
  }
}

async function syncIfNeeded() {
  try {
    // Check karo kya aaj ka data already hai
    const todayResult = await pool.query(
      "SELECT COUNT(*) FROM prices WHERE recorded_date = CURRENT_DATE"
    );
    const todayCount = parseInt(todayResult.rows[0].count);

    if (todayCount > 0) {
      logger.info(`[SYNC] Aaj ke ${todayCount} records already hain — skip`);
      return;
    }

    // Check karo kya DB mein koi bhi data hai
    const totalResult = await pool.query("SELECT COUNT(*) FROM prices");
    const totalCount = parseInt(totalResult.rows[0].count);

    if (totalCount === 0) {
      logger.warn('[SYNC] DB empty hai — koi data nahi');
      // Pehli baar setup ke liye manually seed karo
      return;
    }

    // Aaj ka data nahi hai lekin purana data hai
    // Agmarknet se try karo
    logger.info('[SYNC] Aaj ka data nahi — Agmarknet sync try kar rahe hain...');
    await runDailySync();

  } catch (err) {
    logger.error('[SYNC] syncIfNeeded error:', err.message);
  }
}

// Roz 6 AM IST (12:30 AM UTC)
cron.schedule('30 0 * * *', async () => {
  logger.info('[SYNC] Scheduled sync starting...');
  await runDailySync();
}, { timezone: 'Asia/Kolkata' });

// Server start ke 10 second baad check
setTimeout(syncIfNeeded, 10000);

module.exports = { triggerManualSync: runDailySync };
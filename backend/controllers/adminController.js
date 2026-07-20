const pool = require('../config/db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'gopaltiwari08@gmail.com';

// Admin check middleware
async function isAdmin(req, res, next) {
  try {
    const farmer = await pool.query(
      'SELECT email FROM farmers WHERE id = $1',
      [req.farmerId]
    );
    if (!farmer.rows.length || farmer.rows[0].email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getAdminStats(req, res) {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalMandis,
      totalCrops,
      priceDates,
      totalAlerts,
      totalPushSubs,
      recentUsers
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM farmers'),
      pool.query('SELECT COUNT(*) FROM farmers WHERE is_verified = TRUE'),
      pool.query('SELECT COUNT(*) FROM mandis'),
      pool.query('SELECT COUNT(*) FROM crops'),
      pool.query(`
        SELECT recorded_date, COUNT(*) as price_count
        FROM prices
        GROUP BY recorded_date
        ORDER BY recorded_date DESC
        LIMIT 7
      `),
      pool.query('SELECT COUNT(*) FROM alerts'),
      pool.query('SELECT COUNT(*) FROM push_subscriptions').catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`
        SELECT full_name, email, state, created_at, is_verified
        FROM farmers
        ORDER BY created_at DESC
        LIMIT 10
      `)
    ]);

    const latestSync = priceDates.rows[0];
    const todayPrices = priceDates.rows.find(r => {
      const d = new Date(r.recorded_date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });

    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        verified: parseInt(verifiedUsers.rows[0].count),
        unverified: parseInt(totalUsers.rows[0].count) - parseInt(verifiedUsers.rows[0].count),
        recent: recentUsers.rows
      },
      data: {
        totalMandis: parseInt(totalMandis.rows[0].count),
        totalCrops: parseInt(totalCrops.rows[0].count),
        totalAlerts: parseInt(totalAlerts.rows[0].count),
        pushSubscribers: parseInt(totalPushSubs.rows[0].count)
      },
      sync: {
        latestDate: latestSync?.recorded_date || null,
        latestCount: parseInt(latestSync?.price_count || 0),
        todayCount: parseInt(todayPrices?.price_count || 0),
        isRealData: parseInt(latestSync?.price_count || 0) > 1000,
        last7Days: priceDates.rows.map(r => ({
          date: r.recorded_date,
          count: parseInt(r.price_count)
        }))
      },
      server: {
        uptime: Math.round(process.uptime()),
        uptimeFormatted: formatUptime(process.uptime()),
        nodeVersion: process.version,
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('getAdminStats error:', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function triggerAdminSync(req, res) {
  res.json({ message: 'Sync background mein shuru ho gayi' });
  try {
    const { runDailySync } = require('../services/agmarknetService');
    const count = await runDailySync();
    console.log(`[ADMIN] Manual sync: ${count} records`);
  } catch (err) {
    console.error('[ADMIN] Sync error:', err.message);
  }
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports = { isAdmin, getAdminStats, triggerAdminSync };
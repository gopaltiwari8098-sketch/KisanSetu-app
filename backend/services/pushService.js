const webpush = require('web-push');
const pool = require('../config/db');
const logger = require('../utils/logger');
require('dotenv').config();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@kisansetu.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

async function savePushSubscription(farmerId, subscription) {
  await pool.query(
    `INSERT INTO push_subscriptions (farmer_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
     SET farmer_id = $1, p256dh = $3, auth = $4, updated_at = NOW()`,
    [farmerId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );
}

async function sendPushToFarmer(farmerId, title, body, data = {}) {
  try {
    const subs = await pool.query(
      'SELECT * FROM push_subscriptions WHERE farmer_id = $1',
      [farmerId]
    );

    const payload = JSON.stringify({
      title,
      body,
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/badge-72.png',
      data: { url: data.url || '/dashboard.html', ...data }
    });

    for (const sub of subs.rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
          logger.info('Expired subscription deleted');
        }
      }
    }
  } catch (err) {
    logger.error('sendPushToFarmer error:', err.message);
  }
}

async function sendPushToAll(title, body, data = {}) {
  try {
    const subs = await pool.query('SELECT * FROM push_subscriptions');
    const payload = JSON.stringify({ title, body, data: { url: '/dashboard.html', ...data } });

    for (const sub of subs.rows) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        if (err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        }
      }
    }
    logger.info(`Push sent to ${subs.rows.length} subscribers`);
  } catch (err) {
    logger.error('sendPushToAll error:', err.message);
  }
}

module.exports = { savePushSubscription, sendPushToFarmer, sendPushToAll };
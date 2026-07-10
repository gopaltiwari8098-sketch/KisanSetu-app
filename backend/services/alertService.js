const pool = require('../config/db');
const { sendPushToFarmer } = require('./pushService');
const logger = require('../utils/logger');

async function checkAndDispatchAlerts() {
  try {
    const alerts = await pool.query(`
      SELECT a.id, a.farmer_id, a.crop_id, a.condition, a.target_price,
             c.name_en, c.name_hi, f.email, f.full_name,
             AVG(p.price) as current_price
      FROM alerts a
      JOIN crops c ON a.crop_id = c.id
      JOIN farmers f ON a.farmer_id = f.id
      JOIN prices p ON p.crop_id = a.crop_id
      WHERE a.status = 'active'
      AND p.recorded_date = (SELECT MAX(recorded_date) FROM prices)
      GROUP BY a.id, a.farmer_id, a.crop_id, a.condition, a.target_price,
               c.name_en, c.name_hi, f.email, f.full_name
    `);

    let triggered = 0;
    for (const alert of alerts.rows) {
      const current = parseFloat(alert.current_price);
      const target = parseFloat(alert.target_price);
      let shouldTrigger = false;

      if (alert.condition === 'above' && current >= target) shouldTrigger = true;
      if (alert.condition === 'below' && current <= target) shouldTrigger = true;

      if (shouldTrigger) {
        await pool.query(
          "UPDATE alerts SET status = 'triggered' WHERE id = $1",
          [alert.id]
        );

        const conditionText = alert.condition === 'above' ? 'upar' : 'neeche';
        const title = `🔔 KisanSetu Price Alert`;
        const body = `${alert.name_en} / ${alert.name_hi} ka price ₹${Math.round(current).toLocaleString('en-IN')}/q ho gaya — aapke target se ${conditionText}!`;

        // Push notification bhejo
        await sendPushToFarmer(alert.farmer_id, title, body, {
          url: '/mandi-comparison.html',
          crop: alert.name_en
        });

        logger.info(`Alert triggered: ${alert.email} — ${alert.name_en} at ₹${current}`);
        triggered++;
      }
    }

    logger.info(`Alert check complete. ${triggered} alerts triggered.`);
    return triggered;
  } catch (err) {
    logger.error('checkAndDispatchAlerts error:', err.message);
    return 0;
  }
}

// Weather-based farming notifications
async function sendWeatherAlerts() {
  try {
    // Saare farmers ko daily morning tip bhejo (5 AM IST)
    const farmers = await pool.query(
      "SELECT id, full_name FROM farmers WHERE is_verified = TRUE LIMIT 1000"
    );

    for (const farmer of farmers.rows) {
      await sendPushToFarmer(
        farmer.id,
        '🌅 KisanSetu — Subah ki Salaam',
        'Aaj ke mandi rates check karein aur apni fasal ka sahi daam jaanein!',
        { url: '/dashboard.html' }
      );
    }
    logger.info(`Morning notifications sent to ${farmers.rows.length} farmers`);
  } catch (err) {
    logger.error('sendWeatherAlerts error:', err.message);
  }
}

module.exports = { checkAndDispatchAlerts, sendWeatherAlerts };
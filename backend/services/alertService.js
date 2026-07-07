const pool = require('../config/db');
const { sendVerificationEmail } = require('./emailService');
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

        // Email bhejo (optional — agar email service available ho)
        try {
          const conditionText = alert.condition === 'above' ? 'upar' : 'neeche';
          const subject = `KisanSetu Alert: ${alert.name_en} price ₹${Math.round(current).toLocaleString('en-IN')}/q ho gaya`;
          logger.info(`Alert triggered for ${alert.email}: ${alert.name_en} at ₹${current}`);
        } catch (emailErr) {
          logger.warn('Alert email fail:', emailErr.message);
        }
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

module.exports = { checkAndDispatchAlerts };
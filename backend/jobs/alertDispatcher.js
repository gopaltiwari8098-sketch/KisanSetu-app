const cron = require('node-cron');
const { checkAndDispatchAlerts } = require('../services/alertService');
const logger = require('../utils/logger');

// Har 6 ghante mein alerts check karo
cron.schedule('0 */6 * * *', async () => {
  logger.info('Alert dispatcher chal raha hai...');
  const count = await checkAndDispatchAlerts();
  logger.info(`Alert dispatch complete: ${count} triggered`);
}, { timezone: 'Asia/Kolkata' });

module.exports = { checkAndDispatchAlerts };
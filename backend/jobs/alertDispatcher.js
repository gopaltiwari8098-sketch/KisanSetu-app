const cron = require('node-cron');
const { checkAndDispatchAlerts, sendWeatherAlerts } = require('../services/alertService');
const logger = require('../utils/logger');

// Har 4 ghante alerts check karo
cron.schedule('0 */4 * * *', async () => {
  logger.info('Alert check chal raha hai...');
  const count = await checkAndDispatchAlerts();
  logger.info(`${count} alerts triggered`);
}, { timezone: 'Asia/Kolkata' });

// Roz 5 AM morning notification
cron.schedule('0 5 * * *', async () => {
  logger.info('Morning notifications bhej rahe hain...');
  await sendWeatherAlerts();
}, { timezone: 'Asia/Kolkata' });

module.exports = { checkAndDispatchAlerts };
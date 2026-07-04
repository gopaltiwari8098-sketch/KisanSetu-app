const cron = require('node-cron');
const { runDailySync } = require('../services/agmarknetService');

// Roz subah 6 baje sync hoga
cron.schedule('0 6 * * *', async () => {
  console.log('Scheduled daily price sync chal rahi hai...');
  await runDailySync();
}, {
  timezone: 'Asia/Kolkata'
});

// Manually bhi trigger kar sakte ho
async function triggerManualSync() {
  console.log('Manual sync trigger kiya...');
  return await runDailySync();
}

module.exports = { triggerManualSync };
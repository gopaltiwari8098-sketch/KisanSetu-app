// Redis optional hai — agar available nahi to in-memory cache use hoga
let redisClient = null;

try {
  if (process.env.REDIS_URL) {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().then(() => {
      console.log('Redis se connect ho gaya');
    }).catch(() => {
      console.warn('Redis connect fail, in-memory cache use hoga');
      redisClient = null;
    });
  }
} catch {
  console.warn('Redis package nahi mila, in-memory cache use hoga');
}

module.exports = redisClient;
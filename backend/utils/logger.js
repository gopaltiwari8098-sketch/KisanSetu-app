const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  info: (msg, data = '') => {
    if (isDev) console.log(`[INFO] ${new Date().toISOString()} — ${msg}`, data || '');
  },
  warn: (msg, data = '') => {
    console.warn(`[WARN] ${new Date().toISOString()} — ${msg}`, data || '');
  },
  error: (msg, data = '') => {
    console.error(`[ERROR] ${new Date().toISOString()} — ${msg}`, data || '');
  }
};

module.exports = logger;
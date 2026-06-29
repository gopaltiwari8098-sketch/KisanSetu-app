const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('PostgreSQL se connect ho gaya');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

module.exports = pool;
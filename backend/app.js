const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KisanSetu backend chal raha hai' });
});

app.get('/api/db-check', async (req, res) => {
  const pool = require('./config/db');
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

module.exports = app;
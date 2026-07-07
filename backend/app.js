const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    process.env.FRONTEND_URL || 'http://127.0.0.1:5500'
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'kisansetu_session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KisanSetu backend chal raha hai', version: '1.0.0' });
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

// Swagger docs
app.get('/api/docs', (req, res) => {
  res.json(require('./docs/swagger'));
});

// All routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/farmer', require('./routes/farmerRoutes'));
app.use('/api/price', require('./routes/priceRoutes'));
app.use('/api/mandi', require('./routes/mandiRoutes'));
app.use('/api/scheme', require('./routes/schemeRoutes'));
app.use('/api/alert', require('./routes/alertRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));

// Cron jobs start
require('./jobs/dailyPriceSync');
require('./jobs/alertDispatcher');
console.log('Cron jobs scheduled (Price sync: 6 AM, Alert check: every 6h IST)');

// Global error handler
app.use(errorHandler);

module.exports = app;
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');
require('dotenv').config();

const CALLBACK_URL = process.env.NODE_ENV === 'production'
  ? ' https://kisansetu-app.onrender.com/api/auth/google/callback'
  : 'http://localhost:5000/api/auth/google/callback';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const fullName = profile.displayName;

    // Pehle Google ID se dhundo
    let result = await pool.query(
      'SELECT * FROM farmers WHERE google_id = $1',
      [googleId]
    );
    if (result.rows.length > 0) return done(null, result.rows[0]);

    // Phir email se dhundo
    result = await pool.query(
      'SELECT * FROM farmers WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      await pool.query(
        'UPDATE farmers SET google_id = $1, is_verified = TRUE WHERE email = $2',
        [googleId, email]
      );
      return done(null, result.rows[0]);
    }

    // Naya Google user banao
    result = await pool.query(
      `INSERT INTO farmers (full_name, email, google_id, is_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING *`,
      [fullName, email, googleId]
    );
    return done(null, result.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM farmers WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
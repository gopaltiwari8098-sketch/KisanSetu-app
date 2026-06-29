const pool = require('../config/db');

const Farmer = {
  async create({ fullName, email, phone, passwordHash, state }) {
    const result = await pool.query(
      `INSERT INTO farmers (full_name, email, phone, password_hash, state)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, state, created_at`,
      [fullName, email, phone, passwordHash, state]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM farmers WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, state, created_at FROM farmers WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async updateProfile(id, { fullName, phone, state }) {
    const result = await pool.query(
      `UPDATE farmers SET full_name = $1, phone = $2, state = $3
       WHERE id = $4
       RETURNING id, full_name, email, phone, state, created_at`,
      [fullName, phone, state, id]
    );
    return result.rows[0];
  }
};
async setVerificationToken(email, token) {
    await pool.query(
      'UPDATE farmers SET verification_token = $1 WHERE email = $2',
      [token, email]
    );
  },

  async verifyByToken(token) {
    const result = await pool.query(
      `UPDATE farmers SET is_verified = TRUE, verification_token = NULL
       WHERE verification_token = $1
       RETURNING id, email`,
      [token]
    );
    return result.rows[0];
  }
  
module.exports = Farmer;
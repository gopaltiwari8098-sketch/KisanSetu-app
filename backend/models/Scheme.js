const pool = require('../config/db');

const Scheme = {
  async findAll() {
    const result = await pool.query('SELECT * FROM schemes ORDER BY title');
    return result.rows;
  }
};

module.exports = Scheme;
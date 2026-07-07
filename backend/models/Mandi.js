const pool = require('../config/db');

const Mandi = {
  async findAll() {
    const result = await pool.query('SELECT * FROM mandis ORDER BY state, name');
    return result.rows;
  },

  async findByState(state) {
    const result = await pool.query(
      'SELECT * FROM mandis WHERE LOWER(state) = LOWER($1) ORDER BY name',
      [state]
    );
    return result.rows;
  },

  async search(query) {
    const result = await pool.query(
      `SELECT * FROM mandis
       WHERE LOWER(name) LIKE LOWER($1)
       OR LOWER(district) LIKE LOWER($1)
       OR LOWER(state) LIKE LOWER($1)
       LIMIT 20`,
      [`%${query}%`]
    );
    return result.rows;
  }
};

module.exports = Mandi;
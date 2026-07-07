const pool = require('../config/db');

const Price = {
  async getLatestByMandiAndCrop(mandiId, cropId) {
    const result = await pool.query(
      `SELECT * FROM prices WHERE mandi_id = $1 AND crop_id = $2
       ORDER BY recorded_date DESC LIMIT 1`,
      [mandiId, cropId]
    );
    return result.rows[0];
  },

  async getHistorical(cropId, days = 30) {
    const result = await pool.query(
      `SELECT AVG(price) as avg_price, recorded_date
       FROM prices WHERE crop_id = $1
       GROUP BY recorded_date
       ORDER BY recorded_date DESC LIMIT $2`,
      [cropId, days]
    );
    return result.rows;
  }
};

module.exports = Price;
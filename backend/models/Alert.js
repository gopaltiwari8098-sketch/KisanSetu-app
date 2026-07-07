const pool = require('../config/db');

const Alert = {
  async create({ farmerId, cropId, condition, targetPrice }) {
    const result = await pool.query(
      `INSERT INTO alerts (farmer_id, crop_id, condition, target_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [farmerId, cropId, condition, targetPrice]
    );
    return result.rows[0];
  },

  async findByFarmer(farmerId) {
    const result = await pool.query(
      `SELECT a.*, c.name_en, c.name_hi
       FROM alerts a JOIN crops c ON a.crop_id = c.id
       WHERE a.farmer_id = $1 ORDER BY a.created_at DESC`,
      [farmerId]
    );
    return result.rows;
  },

  async delete(alertId, farmerId) {
    const result = await pool.query(
      'DELETE FROM alerts WHERE id = $1 AND farmer_id = $2 RETURNING id',
      [alertId, farmerId]
    );
    return result.rows[0];
  },

  async updateStatus(alertId, status) {
    await pool.query(
      'UPDATE alerts SET status = $1 WHERE id = $2',
      [status, alertId]
    );
  }
};

module.exports = Alert;
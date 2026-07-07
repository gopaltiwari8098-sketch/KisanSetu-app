const Mandi = require('../models/Mandi');

async function getAllMandis(req, res) {
  try {
    const { state, q } = req.query;
    let mandis;
    if (q) {
      mandis = await Mandi.search(q);
    } else if (state) {
      mandis = await Mandi.findByState(state);
    } else {
      mandis = await Mandi.findAll();
    }
    res.json(mandis);
  } catch (err) {
    console.error('getAllMandis error:', err.message);
    res.status(500).json({ message: 'Mandis fetch mein error' });
  }
}

module.exports = { getAllMandis };
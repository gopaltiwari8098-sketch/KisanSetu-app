const Scheme = require('../models/Scheme');

async function getSchemes(req, res) {
  try {
    const schemes = await Scheme.findAll();
    res.json(schemes);
  } catch (err) {
    console.error('getSchemes error:', err.message);
    res.status(500).json({ message: 'Schemes fetch mein error' });
  }
}

module.exports = { getSchemes };
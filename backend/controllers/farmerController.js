const Farmer = require('../models/Farmer');

async function getProfile(req, res) {
  try {
    const farmer = await Farmer.findById(req.farmerId);
    if (!farmer) return res.status(404).json({ message: 'Farmer nahi mila' });

    res.json({
      fullName: farmer.full_name,
      email: farmer.email,
      phone: farmer.phone,
      state: farmer.state,
      memberSince: new Date(farmer.created_at).toLocaleDateString('en-IN', {
        month: 'long', year: 'numeric'
      })
    });
  } catch (err) {
    console.error('getProfile error:', err.message);
    res.status(500).json({ message: 'Profile fetch mein error' });
  }
}

async function updateProfile(req, res) {
  try {
    const { fullName, phone, state } = req.body;
    const updated = await Farmer.updateProfile(req.farmerId, { fullName, phone, state });
    if (!updated) return res.status(404).json({ message: 'Farmer nahi mila' });

    res.json({
      message: 'Profile update ho gaya',
      farmer: {
        fullName: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        state: updated.state
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ message: 'Profile update mein error' });
  }
}

module.exports = { getProfile, updateProfile };
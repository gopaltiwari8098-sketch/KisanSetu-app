// Haversine formula — 2 coordinates ke beech distance calculate karta hai (km mein)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

async function getNearbyMandis(pool, lat, lon, radiusKm = 200) {
  try {
    const result = await pool.query(
      `SELECT id, name, state, district, latitude, longitude FROM mandis
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );

    const mandis = result.rows.map(m => ({
      ...m,
      distance: calculateDistance(lat, lon, m.latitude, m.longitude)
    }));

    return mandis
      .filter(m => m.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (err) {
    console.error('getNearbyMandis error:', err.message);
    return [];
  }
}

module.exports = { calculateDistance, getNearbyMandis };
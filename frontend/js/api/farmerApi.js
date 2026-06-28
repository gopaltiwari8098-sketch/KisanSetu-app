async function getFarmerProfile() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Profile fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('farmerApi.getFarmerProfile:', err.message);
    return null;
  }
}

async function updateFarmerProfile(payload) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Profile update fail hua');
    return await res.json();
  } catch (err) {
    console.warn('farmerApi.updateFarmerProfile:', err.message);
    return null;
  }
}
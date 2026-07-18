async function getFarmerProfile() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      clearToken(); // Token expired ya invalid
      return null;
    }
    if (!res.ok) return null; // Network error — don't clear token
    return await res.json();
  } catch (err) {
    console.warn('farmerApi.getFarmerProfile:', err.message);
    return null; // Network error — token rakhna hai, redirect nahi karna
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

// ✅ NEW: Tracked crops
async function getTrackedCrops() {
  try {
    const token = getToken();
    if (!token) return [];
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/tracked-crops`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('farmerApi.getTrackedCrops:', err.message);
    return [];
  }
}

async function addTrackedCrop(cropNameEn) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/tracked-crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ cropNameEn })
    });
    return await res.json();
  } catch (err) {
    console.warn('farmerApi.addTrackedCrop:', err.message);
    return null;
  }
}

async function removeTrackedCrop(cropId) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/tracked-crops/${cropId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.ok;
  } catch (err) {
    console.warn('farmerApi.removeTrackedCrop:', err.message);
    return false;
  }
}

async function saveAlertPreferences(prefs) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/alert-preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(prefs)
    });
    return res.ok;
  } catch (err) {
    console.warn('farmerApi.saveAlertPreferences:', err.message);
    return false;
  }
}
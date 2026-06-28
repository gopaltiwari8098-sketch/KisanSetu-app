async function getAlerts() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/alert`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Alerts fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('alertApi.getAlerts:', err.message);
    return null;
  }
}

async function createAlert(payload) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Alert create fail hua');
    return await res.json();
  } catch (err) {
    console.warn('alertApi.createAlert:', err.message);
    return null;
  }
}

async function deleteAlert(alertId) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/alert/${alertId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.ok;
  } catch (err) {
    console.warn('alertApi.deleteAlert:', err.message);
    return false;
  }
}
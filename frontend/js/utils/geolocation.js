function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { timeout: 10000 }
    );
  });
}

async function getNearbyMandis(maxResults = 10) {
  try {
    const coords = await getUserLocation();
    const res = await fetch(
      `${CONFIG.API_BASE_URL}/mandi/nearby?lat=${coords.latitude}&lng=${coords.longitude}&limit=${maxResults}`
    );
    if (!res.ok) throw new Error('Nearby mandis fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('Location ya backend issue:', err.message);
    return null;
  }
}
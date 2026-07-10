async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker supported nahi hai is browser mein');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('Service Worker registration fail:', err.message);
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush() {
  const token = getToken();
  if (!token) return; // Login nahi hai

  try {
    const reg = await navigator.serviceWorker.ready;

    // VAPID public key fetch karo backend se
    const keyRes = await fetch(`${CONFIG.API_BASE_URL}/farmer/vapid-key`);
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return;

    // Push permission maango
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    // Subscribe karo
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Backend mein save karo
    await fetch(`${CONFIG.API_BASE_URL}/farmer/push-subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    console.log('Push notifications subscribe ho gaya');
  } catch (err) {
    console.warn('Push subscribe fail:', err.message);
  }
}

async function initPushNotifications() {
  await registerServiceWorker();
  // Login ke 3 second baad subscribe karo
  setTimeout(() => {
    subscribeToPush();
  }, 3000);
}
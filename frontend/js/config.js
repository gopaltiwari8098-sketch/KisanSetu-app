const CONFIG = {
  API_BASE_URL: (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://localhost:5000/api'
    : 'https://kisansetu-app.onrender.com/api'
};

// Backend cold start banner
async function checkBackendHealth() {
  const banner = document.getElementById('coldStartBanner');
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok && banner) banner.style.display = 'none';
  } catch {
    if (banner) banner.style.display = 'flex';
    // Retry after 8 seconds
    setTimeout(checkBackendHealth, 8000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Set Google auth button dynamically
  const googleBtns = document.querySelectorAll('.google-auth-btn');
  googleBtns.forEach(btn => {
    btn.href = `${CONFIG.API_BASE_URL}/auth/google`;
  });

  checkBackendHealth();
});
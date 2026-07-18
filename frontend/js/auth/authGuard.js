async function requireAuth() {
  const token = getToken();

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Token expiry check (client-side)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && (payload.exp * 1000 < Date.now());
    if (isExpired) {
      clearToken();
      window.location.href = 'login.html';
      return;
    }
  } catch {
    // Token decode fail — keep going, server will validate
  }

  // Server-side validate — sirf 401/403 pe redirect, network error pe nahi
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/farmer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });

    if (res.status === 401 || res.status === 403) {
      clearToken();
      window.location.href = 'login.html';
    }
    // 404, 500, network error — ignore, user ko dashboard pe rahne do
  } catch {
    // Backend unavailable (cold start) — redirect mat karo
    console.warn('Auth check: backend unavailable, skipping redirect');
  }
}
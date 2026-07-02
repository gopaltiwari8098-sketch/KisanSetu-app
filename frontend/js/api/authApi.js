async function loginUser(email, password) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login fail hua');
    }
    const data = await res.json();
    saveToken(data.token);
    return { success: true, data };
  } catch (err) {
    console.warn('Login backend abhi connect nahi hai:', err.message);
    return { success: false, error: err.message };
  }
}
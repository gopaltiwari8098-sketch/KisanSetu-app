async function getSchemes() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/scheme`);
    if (!res.ok) throw new Error('Schemes fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('schemeApi.getSchemes:', err.message);
    return null;
  }
}
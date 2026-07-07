const CONFIG = {
  API_BASE_URL: window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://kisansetu-app.onrender.com/api'
};
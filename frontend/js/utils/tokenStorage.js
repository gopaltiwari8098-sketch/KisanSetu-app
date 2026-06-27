// frontend/js/utils/tokenStorage.js
function saveToken(token) {
  localStorage.setItem('kisansetu_token', token);
}

function getToken() {
  return localStorage.getItem('kisansetu_token');
}

function clearToken() {
  localStorage.removeItem('kisansetu_token');
}
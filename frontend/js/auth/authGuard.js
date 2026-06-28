function requireAuth() {
  const token = getToken();
  if (!token) {
    // window.location.href = 'login.html';
    console.warn('Auth guard: abhi disabled hai testing ke liye. Backend ready hone par enable karein.');
  }
}

requireAuth();
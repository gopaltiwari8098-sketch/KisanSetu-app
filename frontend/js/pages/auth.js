function showError(groupId, show) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('has-error', show);
}

function showFormMessage(message, isError = true) {
  let msgEl = document.getElementById('formMessage');
  if (!msgEl) {
    msgEl = document.createElement('p');
    msgEl.id = 'formMessage';
    msgEl.style.cssText = 'margin-bottom:var(--space-sm);font-size:0.85rem;text-align:center;padding:0.6rem;border-radius:6px;';
    const card = document.querySelector('.auth-card');
    const form = card.querySelector('form');
    card.insertBefore(msgEl, form);
  }
  msgEl.textContent = message;
  msgEl.style.color = isError ? 'var(--color-danger)' : 'var(--color-success)';
  msgEl.style.background = isError ? 'rgba(192,57,43,0.08)' : 'rgba(46,125,79,0.08)';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test(value);
}

// Fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Server se response nahi mila. Server start ho raha hoga — 30 seconds baad dobara try karein.');
    }
    throw err;
  }
}

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    let valid = true;
    if (!email) { showError('emailGroup', true); valid = false; }
    else { showError('emailGroup', false); }
    if (password.length < 6) { showError('passwordGroup', true); valid = false; }
    else { showError('passwordGroup', false); }
    if (!valid) return;

    setButtonLoading(submitBtn, true, 'Login ho raha hai...');

    try {
      const res = await fetchWithTimeout(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }, 35000);

      const data = await res.json();

      if (!res.ok) {
        showFormMessage(data.message || 'Login fail hua');
        setButtonLoading(submitBtn, false);
        return;
      }

      saveToken(data.token);
      showFormMessage('Login successful! Redirect ho rahe hain...', false);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } catch (err) {
      showFormMessage(err.message || 'Server se connect nahi ho paya. Dobara try karein.');
      setButtonLoading(submitBtn, false);
    }
  });
}

// Signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const state = document.getElementById('state').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    let valid = true;
    showError('nameGroup', !name); if (!name) valid = false;
    const emailOk = isValidEmail(email);
    showError('signupEmailGroup', !emailOk); if (!emailOk) valid = false;
    const phoneOk = isValidPhone(phone);
    showError('phoneGroup', !phoneOk); if (!phoneOk) valid = false;
    showError('locationGroup', !state); if (!state) valid = false;
    const passwordOk = password.length >= 6;
    showError('signupPasswordGroup', !passwordOk); if (!passwordOk) valid = false;
    const confirmOk = password === confirmPassword && confirmPassword.length > 0;
    showError('confirmPasswordGroup', !confirmOk); if (!confirmOk) valid = false;
    if (!valid) return;

    setButtonLoading(submitBtn, true, 'Account ban raha hai...');

    try {
      const res = await fetchWithTimeout(`${CONFIG.API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, phone, state, password })
      }, 35000);

      const data = await res.json();

      if (!res.ok) {
        showFormMessage(data.message || 'Signup fail hua');
        setButtonLoading(submitBtn, false);
        return;
      }

      showFormMessage('Account ban gaya! Email check karein — verification link bheja gaya hai.', false);
      signupForm.reset();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      showFormMessage(err.message || 'Server se connect nahi ho paya. Dobara try karein.');
      setButtonLoading(submitBtn, false);
    }
  });
}
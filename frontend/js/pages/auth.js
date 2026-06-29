function showError(groupId, show) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('has-error', show);
}

function showFormMessage(message, isError = true) {
  let msgEl = document.getElementById('formMessage');
  if (!msgEl) {
    msgEl = document.createElement('p');
    msgEl.id = 'formMessage';
    msgEl.style.marginBottom = 'var(--space-sm)';
    msgEl.style.fontSize = '0.85rem';
    msgEl.style.textAlign = 'center';
    const card = document.querySelector('.auth-card');
    const form = card.querySelector('form');
    card.insertBefore(msgEl, form);
  }
  msgEl.textContent = message;
  msgEl.style.color = isError ? 'var(--color-danger)' : 'var(--color-success)';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test(value);
}

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
    const result = await loginUser(email, password);
    setButtonLoading(submitBtn, false);

    if (result.success) {
      showFormMessage('Login successful! Redirect ho rahe hain...', false);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
      showFormMessage(result.error || 'Login fail hua, dobara try karein');
    }
  });
}

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

    showError('nameGroup', !name);
    if (!name) valid = false;

    const emailOk = isValidEmail(email);
    showError('signupEmailGroup', !emailOk);
    if (!emailOk) valid = false;

    const phoneOk = isValidPhone(phone);
    showError('phoneGroup', !phoneOk);
    if (!phoneOk) valid = false;

    showError('locationGroup', !state);
    if (!state) valid = false;

    const passwordOk = password.length >= 6;
    showError('signupPasswordGroup', !passwordOk);
    if (!passwordOk) valid = false;

    const confirmOk = password === confirmPassword && confirmPassword.length > 0;
    showError('confirmPasswordGroup', !confirmOk);
    if (!confirmOk) valid = false;

    if (!valid) return;

    setButtonLoading(submitBtn, true, 'Account ban raha hai...');
    const result = await signupUser({ fullName: name, email, phone, state, password });
    setButtonLoading(submitBtn, false);

    if (result.success) {
      showFormMessage('Account ban gaya! Redirect ho rahe hain...', false);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
      showFormMessage(result.error || 'Signup fail hua, dobara try karein');
    }
  });
}
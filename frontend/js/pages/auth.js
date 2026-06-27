function showError(groupId, show) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('has-error', show);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test(value);
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;

    if (!email) {
      showError('emailGroup', true);
      valid = false;
    } else {
      showError('emailGroup', false);
    }

    if (password.length < 6) {
      showError('passwordGroup', true);
      valid = false;
    } else {
      showError('passwordGroup', false);
    }

    if (!valid) return;

    console.log('Login submit:', { email, password });
    // TODO: backend ready hone par yahan authApi.login(email, password) call karein
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const state = document.getElementById('state').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

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

    console.log('Signup submit:', { name, email, phone, state, password });
    // TODO: backend ready hone par yahan authApi.signup(...) call karein
  });
}
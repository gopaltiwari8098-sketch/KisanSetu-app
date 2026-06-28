document.addEventListener('DOMContentLoaded', async () => {
  const profile = await getFarmerProfile();

  if (profile) {
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('profileEmail').value = profile.email || '';
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileState').value = profile.state || '';
    document.getElementById('profileName').textContent = profile.fullName || 'Naam set nahi hai';
    document.getElementById('profileMeta').textContent = `${profile.state || 'Location set nahi hai'} · Member since ${profile.memberSince || '—'}`;
    document.getElementById('avatarInitial').textContent = (profile.fullName || '?').charAt(0).toUpperCase();
  } else {
    document.getElementById('profileName').textContent = 'Apna naam set karein';
    document.getElementById('profileMeta').textContent = 'Demo mode — backend connect hone par real data dikhega';
    console.log('Demo mode: profile backend se fetch nahi hua, fields khaali hain.');
  }

  document.getElementById('fullName').addEventListener('input', function () {
    const val = this.value.trim();
    document.getElementById('avatarInitial').textContent = val ? val.charAt(0).toUpperCase() : '?';
    document.getElementById('profileName').textContent = val || 'Apna naam set karein';
  });

  document.getElementById('addCropBtn').addEventListener('click', function () {
    const input = document.getElementById('newCropInput');
    const value = input.value.trim();
    if (!value) return;

    const hint = document.getElementById('noCropsHint');
    if (hint) hint.remove();

    const chip = document.createElement('span');
    chip.className = 'crop-chip';
    chip.innerHTML = `${value} <button class="crop-chip__remove" aria-label="Remove">&times;</button>`;
    document.getElementById('cropChips').appendChild(chip);
    input.value = '';
  });

  document.getElementById('cropChips').addEventListener('click', function (e) {
    if (e.target.classList.contains('crop-chip__remove')) {
      e.target.closest('.crop-chip').remove();
      if (!document.querySelector('.crop-chip')) {
        const hint = document.createElement('p');
        hint.className = 'form-hint';
        hint.id = 'noCropsHint';
        hint.textContent = 'Abhi koi fasal track nahi ki gayi. Neeche search karke add karein.';
        document.getElementById('cropChips').appendChild(hint);
      }
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    clearToken();
    window.location.href = 'login.html';
  });

  document.getElementById('saveProfileBtn').addEventListener('click', async function () {
    const btn = this;
    const payload = {
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('profileEmail').value,
      phone: document.getElementById('profilePhone').value,
      state: document.getElementById('profileState').value
    };

    setButtonLoading(btn, true, 'Save ho raha hai...');
    await delay(700);

    const result = await updateFarmerProfile(payload);
    setButtonLoading(btn, false);

    if (!result) {
      alert('Demo mode: backend abhi connect nahi hai, isliye save permanently nahi hoga.');
      return;
    }
    alert('Profile save ho gaya!');
  });
});
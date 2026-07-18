document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();

  // Token nahi hai — login pe bhejo
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Profile fetch karo
  const profile = await getFarmerProfile();

  if (profile) {
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('profileEmail').value = profile.email || '';
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileState').value = profile.state || '';
    document.getElementById('profileName').textContent = profile.fullName || 'Apna naam set karein';
    document.getElementById('profileMeta').textContent =
      `${profile.state || 'Location set nahi hai'} · Member since ${profile.memberSince || '—'}`;
    document.getElementById('avatarInitial').textContent =
      (profile.fullName || '?').charAt(0).toUpperCase();
  }

  // ✅ Tracked crops DB se load karo
  const chipsContainer = document.getElementById('cropChips');
  const noCropsHint = document.getElementById('noCropsHint');

  async function loadTrackedCrops() {
    const trackedCrops = await getTrackedCrops();

    // Pehle clear karo
    chipsContainer.innerHTML = '';

    if (!trackedCrops || trackedCrops.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'form-hint';
      hint.id = 'noCropsHint';
      hint.textContent = 'Abhi koi fasal track nahi ki gayi. Neeche search karke add karein.';
      chipsContainer.appendChild(hint);
      return;
    }

    trackedCrops.forEach(crop => {
      addChipToDOM(crop.crop_id, `${crop.name_en} / ${crop.name_hi}`);
    });
  }

  function addChipToDOM(cropId, label) {
    const hint = document.getElementById('noCropsHint');
    if (hint) hint.remove();

    const chip = document.createElement('span');
    chip.className = 'crop-chip';
    chip.dataset.cropId = cropId;
    chip.innerHTML = `${label} <button class="crop-chip__remove" aria-label="Remove">&times;</button>`;
    chipsContainer.appendChild(chip);
  }

  await loadTrackedCrops();

  // Naam type karte avatar live update
  document.getElementById('fullName').addEventListener('input', function () {
    const val = this.value.trim();
    document.getElementById('avatarInitial').textContent = val ? val.charAt(0).toUpperCase() : '?';
    document.getElementById('profileName').textContent = val || 'Apna naam set karein';
  });

  // ✅ Crop add — DB mein save karo
  document.getElementById('addCropBtn').addEventListener('click', async function () {
    const input = document.getElementById('newCropInput');
    const value = input.value.trim();
    if (!value) return;

    // "Wheat / गेहूं" format se crop naam nikalo
    const cropNameEn = value.split('/')[0].trim();

    const btn = this;
    btn.textContent = 'Adding...';
    btn.disabled = true;

    const result = await addTrackedCrop(cropNameEn);
    btn.textContent = 'Jode';
    btn.disabled = false;

    if (result && result.crop) {
      addChipToDOM(result.crop.id, `${result.crop.name_en} / ${result.crop.name_hi}`);
      input.value = '';
    } else if (result && result.message) {
      alert(result.message);
    }
  });

  // ✅ Crop remove — DB se delete karo
  chipsContainer.addEventListener('click', async function (e) {
    if (e.target.classList.contains('crop-chip__remove')) {
      const chip = e.target.closest('.crop-chip');
      const cropId = chip.dataset.cropId;

      if (cropId) {
        await removeTrackedCrop(cropId);
      }
      chip.remove();

      if (!document.querySelector('.crop-chip')) {
        const hint = document.createElement('p');
        hint.className = 'form-hint';
        hint.id = 'noCropsHint';
        hint.textContent = 'Abhi koi fasal track nahi ki gayi. Neeche search karke add karein.';
        chipsContainer.appendChild(hint);
      }
    }
  });

  // ✅ Alert preferences — changes save karo
  const alertToggles = document.querySelectorAll('.toggle-row input[type="checkbox"]');
  alertToggles.forEach(toggle => {
    toggle.addEventListener('change', async function () {
      const prefs = {
        priceDropAlerts: alertToggles[0]?.checked ?? true,
        priceRiseAlerts: alertToggles[1]?.checked ?? true,
        weeklyForecastEmail: alertToggles[2]?.checked ?? false
      };
      await saveAlertPreferences(prefs);

      // Push notifications bhi subscribe karo agar allowed hai
      if (this.checked && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            subscribeToPush();
          }
        });
      }
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', function () {
    clearToken();
    window.location.href = 'login.html';
  });

  // Profile save
  document.getElementById('saveProfileBtn').addEventListener('click', async function () {
    const btn = this;
    const payload = {
      fullName: document.getElementById('fullName').value,
      phone: document.getElementById('profilePhone').value,
      state: document.getElementById('profileState').value
    };

    setButtonLoading(btn, true, 'Save ho raha hai...');
    const result = await updateFarmerProfile(payload);
    setButtonLoading(btn, false);

    if (result) {
      document.getElementById('profileName').textContent = payload.fullName || 'Naam nahi hai';
      document.getElementById('profileMeta').textContent =
        `${payload.state} · ${document.getElementById('profileMeta').textContent.split('·')[1] || ''}`;
      document.getElementById('avatarInitial').textContent =
        (payload.fullName || '?').charAt(0).toUpperCase();

      // Success message
      const msg = document.createElement('p');
      msg.style.cssText = 'color:var(--color-success);text-align:center;font-size:0.85rem;margin-top:0.5rem;';
      msg.textContent = '✅ Profile save ho gaya!';
      btn.parentElement.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    }
  });
});
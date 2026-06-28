document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addCropBtn').addEventListener('click', function () {
    const select = document.getElementById('newCropSelect');
    const value = select.value;
    if (!value) return;

    const chip = document.createElement('span');
    chip.className = 'crop-chip';
    chip.innerHTML = `${select.options[select.selectedIndex].text} <button class="crop-chip__remove" aria-label="Remove">&times;</button>`;
    document.getElementById('cropChips').appendChild(chip);
    select.value = '';
  });

  document.getElementById('cropChips').addEventListener('click', function (e) {
    if (e.target.classList.contains('crop-chip__remove')) {
      e.target.closest('.crop-chip').remove();
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
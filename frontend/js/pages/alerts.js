document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newAlertForm');
  const list = document.getElementById('alertList');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const crop = document.getElementById('alertCrop');
    const condition = document.getElementById('alertCondition');
    const priceInput = document.getElementById('alertPrice');
    const price = priceInput.value;

    if (!price) return;

    const conditionText = condition.value === 'above'
      ? `Jab price ₹${price}/q se upar jaye`
      : `Jab price ₹${price}/q se neeche jaye`;

    const result = await createAlert({
      crop: crop.value,
      condition: condition.value,
      targetPrice: price
    });

    if (!result) {
      console.log('Demo mode: backend nahi hai, sirf UI mein add ho rha hai.');
    }

    const item = document.createElement('div');
    item.className = 'alert-item';
    item.innerHTML = `
      <div>
        <p class="alert-item__crop">${crop.options[crop.selectedIndex].text}</p>
        <p class="alert-item__condition">${conditionText}</p>
      </div>
      <div class="alert-item__actions">
        <span class="badge-status badge-status--active">Active</span>
        <button class="alert-item__delete" aria-label="Delete">&times;</button>
      </div>`;
    list.appendChild(item);
    priceInput.value = '';
  });

  list.addEventListener('click', async (e) => {
    if (e.target.classList.contains('alert-item__delete')) {
      e.target.closest('.alert-item').remove();
      // TODO: backend ban jaane par yahan deleteAlert(alertId) call karein
    }
  });
});
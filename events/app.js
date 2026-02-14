const inventoryGrid = document.getElementById('inventoryGrid');
const bookingForm = document.getElementById('bookingForm');

async function loadInventory() {
  try {
    const res = await fetch('inventory.json');
    const items = await res.json();
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'ep-item';
      div.innerHTML = `<h3>${item.name}</h3>`;
      inventoryGrid.appendChild(div);
    });
  } catch (e) {
    console.error('Failed to load inventory', e);
  }
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Inquiry submitted. The Dynasty Party Co. team will contact you shortly.');
  bookingForm.reset();
});

loadInventory();

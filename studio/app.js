const productSelect = document.getElementById('productSelect');
const colorSelect = document.getElementById('colorSelect');
const sizeSelect = document.getElementById('sizeSelect');
const textInput = document.getElementById('textInput');
const previewGarment = document.getElementById('previewGarment');
const previewText = document.getElementById('previewText');
const addToCartBtn = document.getElementById('addToCartBtn');
const cartList = document.getElementById('cartList');
const checkoutForm = document.getElementById('checkoutForm');

let cart = [];

async function loadProducts() {
  try {
    const res = await fetch('products.json');
    const products = await res.json();
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      productSelect.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to load products', e);
  }
}

function updatePreview() {
  previewGarment.style.backgroundColor = colorSelect.value;
  previewText.textContent = textInput.value || 'Your Text';
}

function renderCart() {
  cartList.innerHTML = '';
  cart.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.productName} – ${item.size} – ${item.colorName} – "${item.text}"`;
    cartList.appendChild(li);
  });
}

addToCartBtn.addEventListener('click', () => {
  const productName = productSelect.options[productSelect.selectedIndex]?.text || '';
  const colorName = colorSelect.options[colorSelect.selectedIndex]?.text || '';
  const item = {
    productId: productSelect.value,
    productName,
    color: colorSelect.value,
    colorName,
    size: sizeSelect.value,
    text: textInput.value || ''
  };
  cart.push(item);
  renderCart();
});

checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (cart.length === 0) {
    alert('Add at least one item to the cart.');
    return;
  }

  const order = {
    name: document.getElementById('nameInput').value,
    email: document.getElementById('emailInput').value,
    address: document.getElementById('addressInput').value,
    items: cart
  };

  console.log('Order submitted (save or email this):', order);
  alert('Order request submitted. Divine Living will contact you to confirm and arrange payment.');
  checkoutForm.reset();
  cart = [];
  renderCart();
});

colorSelect.addEventListener('change', updatePreview);
textInput.addEventListener('input', updatePreview);

loadProducts().then(updatePreview);

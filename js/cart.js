let cart = JSON.parse(localStorage.getItem(CONFIG.KEYS.CART) || '[]');
let cartCountdownEnd = 0;
let cartCountdownTimer = null;

const saveCart      = () => localStorage.setItem(CONFIG.KEYS.CART, JSON.stringify(cart));
const getCartTotal  = () => cart.reduce((s, i) => s + i.pricePerUnit * i.qty, 0);
const getCartCount  = () => cart.reduce((s, i) => s + i.qty, 0);
const getCartSaving = () => cart.reduce((s, i) => s + (CONFIG.PRICES[i.size].normal - i.pricePerUnit) * i.qty, 0);
const count60ml     = () => cart.filter(i => i.size === '60ml').reduce((s, i) => s + i.qty, 0);

function addToCart(productId, size, cardEl) {
  if (getStock(productId) === 0) return;
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const pricePerUnit = CONFIG.PRICES[size].promo;
  const existing = cart.find(i => i.productId === productId && i.size === size);
  if (existing) { existing.qty += 1; } else {
    cart.push({ productId, size, pricePerUnit, qty: 1, name: product.name, inspiredBy: product.inspired_by, cap: product.cap_color, rgb: product.rgb });
  }
  saveCart();
  decrementStock(productId, 1);
  refreshCartUI();
  openCart();
  const addBtn = cardEl.querySelector('.btn-add-to-cart');
  if (addBtn) {
    const prev = addBtn.textContent;
    addBtn.textContent = '✓ Ditambah!';
    addBtn.className = 'btn-add-to-cart added';
    setTimeout(() => { addBtn.textContent = prev; addBtn.className = 'btn-add-to-cart'; }, 1400);
  }
}

function removeFromCart(productId, size) {
  cart = cart.filter(i => !(i.productId === productId && i.size === size));
  saveCart(); refreshCartUI();
}

function changeCartQty(productId, size, delta) {
  const item = cart.find(i => i.productId === productId && i.size === size);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(); refreshCartUI();
}

function refreshCartUI() {
  const count = getCartCount(), total = getCartTotal(), saving = getCartSaving(), qty60 = count60ml();
  document.getElementById('nav-badge').textContent        = count;
  document.getElementById('float-cart-badge').textContent = count;
  document.getElementById('nav-badge').classList.toggle('visible', count > 0);
  document.getElementById('float-cart').style.display     = count > 0 ? 'flex' : 'none';
  document.getElementById('cart-count-label').textContent = count > 0 ? `${count} item` : '';
  const emptyEl = document.getElementById('cart-empty'), itemsEl = document.getElementById('cart-items-list'), footerEl = document.getElementById('cart-footer');
  if (count === 0) { emptyEl.style.display = 'block'; footerEl.style.display = 'none'; itemsEl.innerHTML = ''; document.getElementById('bundle-hint').style.display = 'none'; document.getElementById('cart-countdown').style.display = 'none'; clearInterval(cartCountdownTimer); return; }
  emptyEl.style.display = 'none'; footerEl.style.display = 'block';
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-visual">${createMiniBottleSVG(item.cap, item.rgb)}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-insp">Terinspirasi: ${item.inspiredBy}</div>
        <div class="cart-item-size">${item.size} · RM ${item.pricePerUnit}</div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeCartQty('${item.productId}','${item.size}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeCartQty('${item.productId}','${item.size}',1)">+</button>
          </div>
          <span class="cart-item-price">RM ${item.pricePerUnit * item.qty}</span>
        </div>
        <button class="cart-item-remove-btn" onclick="removeFromCart('${item.productId}','${item.size}')">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Buang dari Troli
        </button>
      </div>
    </div>`).join('');
  const hintEl = document.getElementById('bundle-hint'), need = 3 - qty60;
  if (qty60 >= 3) { hintEl.innerHTML = '<b>🎁 Bundle aktif!</b> Anda layak mendapat <b>1 botol 30ml PERCUMA</b>. Nyatakan pilihan dalam nota.'; hintEl.style.display = 'block'; }
  else if (qty60 > 0) { hintEl.innerHTML = `<b>🎁 Hampir dapat hadiah!</b> Tambah <b>${need}</b> lagi 60ml untuk 1×30ml <b>PERCUMA</b>.`; hintEl.style.display = 'block'; }
  else { hintEl.style.display = 'none'; }
  document.getElementById('cart-total-display').textContent = 'RM ' + total;
  const savEl = document.getElementById('cart-savings-display');
  savEl.textContent = saving > 0 ? `Jimat RM ${saving} daripada harga asal` : '';
  document.getElementById('cart-countdown').style.display = 'flex';
  if (!cartCountdownEnd || cartCountdownEnd <= Date.now()) cartCountdownEnd = Date.now() + 15 * 60 * 1000;
  startCartCountdown();
}

function startCartCountdown() {
  clearInterval(cartCountdownTimer);
  const display = document.getElementById('cart-cd-display');
  cartCountdownTimer = setInterval(() => {
    const rem = Math.max(0, cartCountdownEnd - Date.now());
    const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
    if (display) display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (rem === 0) { cartCountdownEnd = Date.now() + 15 * 60 * 1000; startCartCountdown(); }
  }, 1000);
}

function openCart(event) { if (event) event.preventDefault(); document.getElementById('cart-overlay').classList.add('visible'); document.getElementById('cart-panel').classList.add('visible'); document.body.classList.add('lock'); }
function closeCart()     { document.getElementById('cart-overlay').classList.remove('visible'); document.getElementById('cart-panel').classList.remove('visible'); document.body.classList.remove('lock'); }

function sendCartViaWhatsApp() {
  if (!cart.length) return;
  const items = cart.map(i => `• ${i.name} (${i.size}) ×${i.qty} — RM ${i.pricePerUnit * i.qty}`).join('\n');
  const msg = `Salam, saya ingin pesan The Artisan Parfum:\n\n${items}\n\n*Jumlah: RM ${getCartTotal()}*\n\nSila bantu sahkan stok dan bayaran. Terima kasih!`;
  window.open(`https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* =====================================================
   ORDER MODAL
===================================================== */
function openOrderModal() {
  if (!cart.length) return;
  closeCart();
  const sumEl = document.getElementById('modal-order-summary');
  sumEl.innerHTML = cart.map(i => `<div class="order-summary-item"><span>${i.name} ${i.size} ×${i.qty}</span><span>RM ${i.pricePerUnit * i.qty}</span></div>`).join('') + `<div class="order-summary-total"><span>Jumlah</span><span>RM ${getCartTotal()}</span></div>`;
  document.getElementById('modal-total-display').textContent = 'RM ' + getCartTotal();
  ['field-name','field-phone','field-email','field-address','field-state','field-postcode','field-note'].forEach(id => { const el = document.getElementById(id); if (el) { el.value = ''; el.classList.remove('invalid'); } });
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
  document.getElementById('modal-form').style.display    = 'block';
  document.getElementById('modal-loading').style.display = 'none';
  document.getElementById('modal-success').style.display = 'none';
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('modal-overlay').classList.add('visible');
  document.body.classList.add('lock');
  setTimeout(() => document.getElementById('field-name')?.focus(), 150);
}

function closeOrderModal() { document.getElementById('modal-overlay').classList.remove('visible'); document.body.classList.remove('lock'); }

const isValidEmail    = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone    = v => /^(\+?60|0)[0-9]{8,10}$/.test(v.replace(/[\s\-]/g, ''));
const isValidPostcode = v => /^\d{5}$/.test(v.trim());

function setInvalid(fId, eId) { document.getElementById(fId)?.classList.add('invalid'); document.getElementById(eId)?.classList.add('visible'); }
function clearInvalid(fId, eId) { document.getElementById(fId)?.classList.remove('invalid'); document.getElementById(eId)?.classList.remove('visible'); }

function handleOrderSubmit() {
  const name = document.getElementById('field-name').value.trim();
  const phone = document.getElementById('field-phone').value.trim();
  const email = document.getElementById('field-email').value.trim();
  const address = document.getElementById('field-address').value.trim();
  const state = document.getElementById('field-state').value;
  const postcode = document.getElementById('field-postcode').value.trim();
  const note = document.getElementById('field-note').value.trim();
  let ok = true;
  if (name.length < 3) { setInvalid('field-name','err-name'); ok = false; } else clearInvalid('field-name','err-name');
  if (!isValidPhone(phone)) { setInvalid('field-phone','err-phone'); ok = false; } else clearInvalid('field-phone','err-phone');
  if (email && !isValidEmail(email)) { setInvalid('field-email','err-email'); ok = false; } else clearInvalid('field-email','err-email');
  if (address.length < 10) { setInvalid('field-address','err-address'); ok = false; } else clearInvalid('field-address','err-address');
  if (!state) { setInvalid('field-state','err-state'); ok = false; } else clearInvalid('field-state','err-state');
  if (!isValidPostcode(postcode)) { setInvalid('field-postcode','err-postcode'); ok = false; } else clearInvalid('field-postcode','err-postcode');
  if (!ok) return;

  document.getElementById('submit-btn').disabled = true;
  document.getElementById('modal-form').style.display    = 'none';
  document.getElementById('modal-loading').style.display = 'block';

  const itemsFmt = cart.map(i => `• ${i.name} (${i.size}) ×${i.qty} = RM${i.pricePerUnit * i.qty}`).join('\n');
  const itemsStr = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(' | ');

  if (CONFIG.USE_TOYYIBPAY && CONFIG.TOYYIBPAY_URL) {
    const form = document.createElement('form');
    form.method = 'POST'; form.action = CONFIG.TOYYIBPAY_URL;
    const fields = { name, phone, email, address: `${address}, ${state} ${postcode}`, note, total: getCartTotal(), items: itemsStr, itemsFormatted: itemsFmt };
    Object.entries(fields).forEach(([k, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i); });
    document.body.appendChild(form); form.submit();
  } else {
    setTimeout(() => {
      const waMsg = `*Pesanan Baru — The Artisan Parfum*\n\n👤 *Nama:* ${name}\n📞 *Tel:* ${phone}${email ? '\n📧 *Emel:* ' + email : ''}\n📍 *Alamat:* ${address}, ${state} ${postcode}\n\n*Item:*\n${itemsFmt}\n\n💰 *JUMLAH: RM ${getCartTotal()}*\n\n📝 *Nota:* ${note || '-'}`;
      window.open(`https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(waMsg)}`, '_blank');
      document.getElementById('modal-loading').style.display = 'none';
      document.getElementById('modal-success').style.display = 'block';
      document.getElementById('submit-btn').disabled = false;
      cart = []; saveCart(); refreshCartUI();
    }, 1800);
  }
}

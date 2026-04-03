async function loadPricing() {
  try {
    const rows = await sbFetch('pricing?select=size,normal_price,promo_price');
    if (rows && rows.length) {
      rows.forEach(r => {
        CONFIG.PRICES[r.size] = { normal: r.normal_price, promo: r.promo_price };
      });
      updatePriceStrip();
    }
  } catch (e) { /* Keep defaults */ }
}

function updatePriceStrip() {
  ['10ml','30ml','60ml'].forEach(size => {
    const key = size.replace('ml','');
    const p = CONFIG.PRICES[size];
    const promoEl  = document.getElementById('p' + key + '-promo');
    const normalEl = document.getElementById('p' + key + '-normal');
    const saveEl   = document.getElementById('p' + key + '-save');
    if (promoEl)  promoEl.textContent  = 'RM ' + p.promo;
    if (normalEl) normalEl.textContent = 'RM ' + p.normal;
    if (saveEl)   saveEl.textContent   = 'Jimat RM ' + (p.normal - p.promo);
  });
}

let PRODUCTS = [];

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  try {
    const rows = await sbFetch('products?active=eq.true&order=id.asc&select=*');
    PRODUCTS = rows || [];
    // Update gender counts
    ['m','w','u'].forEach(g => {
      const el = document.getElementById('count-' + g);
      if (el) el.textContent = PRODUCTS.filter(p => p.gender === g).length;
    });
    renderProducts();
 } catch (e) {
    const loading = document.getElementById('grid-loading');
    if (loading) loading.innerHTML = '<p style="color:var(--red);font-size:12px">Gagal memuatkan produk. Cuba muat semula.</p>';
    console.error('Failed to load products:', e);
  }
}

/* =====================================================
   STOCK MANAGEMENT — localStorage cache + Supabase sync
===================================================== */
function initStock() {
  const stored = JSON.parse(localStorage.getItem(CONFIG.KEYS.STOCK) || '{}');
  let updated = false;
  PRODUCTS.forEach(p => {
    if (stored[p.id] === undefined) { stored[p.id] = p.stock ?? CONFIG.INITIAL_STOCK; updated = true; }
  });
  if (updated) localStorage.setItem(CONFIG.KEYS.STOCK, JSON.stringify(stored));
}

function getStock(id) {
  const s = JSON.parse(localStorage.getItem(CONFIG.KEYS.STOCK) || '{}');
  const product = PRODUCTS.find(p => p.id === id);
  return s[id] !== undefined ? s[id] : (product?.stock ?? CONFIG.INITIAL_STOCK);
}

function decrementStock(id, qty = 1) {
  const s = JSON.parse(localStorage.getItem(CONFIG.KEYS.STOCK) || '{}');
  s[id] = Math.max(0, (s[id] ?? CONFIG.INITIAL_STOCK) - qty);
  localStorage.setItem(CONFIG.KEYS.STOCK, JSON.stringify(s));
  // Async sync to Supabase
  sbFetch('products?id=eq.' + id, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ stock: s[id] })
  }).catch(() => {});
  refreshCardStock(id);
}

function refreshCardStock(id) {
  const card = document.querySelector(`[data-product-id="${id}"]`);
  if (!card) return;
  const stk = getStock(id);
  const pct = stk / CONFIG.INITIAL_STOCK;
  const fill   = card.querySelector('.stock-fill');
  const text   = card.querySelector('.stock-text');
  const addBtn = card.querySelector('.btn-add-to-cart');
  const sizeBtns = card.querySelectorAll('.size-btn');
  if (fill) { fill.style.width = (pct * 100) + '%'; fill.className = 'stock-fill ' + (stk === 0 ? 'crit' : stk <= 8 ? 'crit' : stk <= 18 ? 'low' : 'ok'); }
  if (text) { text.textContent = stk === 0 ? 'STOK HABIS' : stk + ' unit berbaki'; text.className = 'stock-text' + (stk <= 8 ? ' urgent' : ''); }
  if (addBtn && stk === 0) { addBtn.textContent = 'Stok Habis'; addBtn.className = 'btn-add-to-cart sold-out'; }
  sizeBtns.forEach(b => { b.disabled = stk === 0; });
}

/* =====================================================
   SVG BOTTLE GENERATOR
===================================================== */
function createBottleSVG(productId, cap, rgbStr) {
  const [r, g, b] = (rgbStr || '155,85,110').split(',').map(Number);
  const gradId = 'grad_' + productId.replace(/[^a-zA-Z0-9]/g, '_');
  return `<svg width="58" height="166" viewBox="0 0 58 166" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(${r},${g},${b})" stop-opacity=".26"/>
      <stop offset="46%" stop-color="rgb(${r},${g},${b})" stop-opacity=".88"/>
      <stop offset="100%" stop-color="rgb(${r},${g},${b})" stop-opacity=".26"/>
    </linearGradient></defs>
    <rect x="21" y="0" width="16" height="12" rx="3.5" fill="${cap || '#3A1828'}"/>
    <rect x="23" y="1.5" width="4" height="8.5" rx="1" fill="rgba(255,255,255,.16)"/>
    <rect x="20" y="12" width="18" height="8" rx="1" fill="${cap || '#3A1828'}" opacity=".6"/>
    <rect x="11" y="20" width="36" height="138" rx="3" fill="url(#${gradId})" stroke="rgba(0,0,0,.1)" stroke-width=".5"/>
    <rect x="13" y="22" width="5.5" height="134" rx="1.5" fill="rgba(255,255,255,.055)"/>
    <rect x="13" y="62" width="32" height="54" fill="rgba(255,255,255,.025)" stroke="rgba(255,255,255,.08)" stroke-width=".4"/>
    <text x="29" y="80" text-anchor="middle" font-family="Georgia,serif" font-size="3.2" fill="rgba(255,255,255,.48)" letter-spacing=".9">THE ARTISAN</text>
    <text x="29" y="89" text-anchor="middle" font-family="Georgia,serif" font-size="3.2" fill="rgba(255,255,255,.48)" letter-spacing=".9">PARFUM</text>
    <ellipse cx="29" cy="160" rx="12.5" ry="1.8" fill="rgba(0,0,0,.07)"/>
  </svg>`;
}

function createMiniBottleSVG(cap, rgbStr) {
  const [r, g, b] = (rgbStr || '155,85,110').split(',').map(Number);
  const uid = `${r}_${g}_${b}_${Date.now()}`;
  return `<svg width="32" height="62" viewBox="0 0 32 62" fill="none" aria-hidden="true">
    <defs><linearGradient id="mini_${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(${r},${g},${b})" stop-opacity=".28"/>
      <stop offset="50%" stop-color="rgb(${r},${g},${b})" stop-opacity=".86"/>
      <stop offset="100%" stop-color="rgb(${r},${g},${b})" stop-opacity=".28"/>
    </linearGradient></defs>
    <rect x="11" y="0" width="10" height="7" rx="2" fill="${cap || '#3A1828'}"/>
    <rect x="10" y="7" width="12" height="4" rx="1" fill="${cap || '#3A1828'}" opacity=".6"/>
    <rect x="4" y="11" width="24" height="46" rx="2.5" fill="url(#mini_${uid})" stroke="rgba(0,0,0,.1)" stroke-width=".4"/>
  </svg>`;
}

/* =====================================================
   RENDER PRODUCT CARDS
===================================================== */
function renderProducts() {
  const loading = document.getElementById('grid-loading');
  if (loading) loading.remove();

  // Keep hidden grid for cart internals
  let grid = document.getElementById('product-grid');
  if (grid) {
    grid.innerHTML = '';
    PRODUCTS.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.gender = p.gender;
      card.dataset.productId = p.id;
      card.dataset.searchIndex = [p.name, p.inspired_by, p.family, p.notes].join(' ').toLowerCase();
      card._productId = p.id;
      grid.appendChild(card);
    });
  }

  // Update counts
  ['m','w','u'].forEach(g => {
    const el = document.getElementById('count-' + g);
    if (el) el.textContent = PRODUCTS.filter(p => p.gender === g).length;
  });

  initStock();
  applyFilters();
}

function applyFilters() {
  const chips = document.getElementById('scent-chips');
  if (!chips) return;

  const matching = PRODUCTS.filter(p =>
    p.gender === currentGender &&
    (!searchQuery || [p.name, p.inspired_by, p.family, p.notes].join(' ').toLowerCase().includes(searchQuery))
  );

  document.getElementById('no-results').style.display = matching.length === 0 ? 'block' : 'none';

  chips.innerHTML = matching.map((p, i) => {
    const stk = getStock(p.id);
    let badgeHTML = '';
    if (stk === 0) badgeHTML = `<span class="scent-chip-badge">Habis</span>`;
    else if (p.badge === 'Hot' || p.badge === 'Bestseller') badgeHTML = `<span class="scent-chip-badge hot">${p.badge}</span>`;
    else if (p.badge === 'New') badgeHTML = `<span class="scent-chip-badge new">New</span>`;

    return `<button class="scent-chip ${stk===0?'sold-out':''}"
      onclick="openScentModal('${p.id}')"
      data-product-id="${p.id}">
      <span class="scent-chip-num">${i + 1}.</span>
      ${p.name}
      ${badgeHTML}
    </button>`;
  }).join('');
}

// Scent modal
let currentScentId = null;
let currentScentSize = null;

function openScentModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  currentScentId = productId;
  currentScentSize = null;

  document.getElementById('sm-bottle').innerHTML = createMiniBottleSVG(p.cap_color, p.rgb);
  document.getElementById('sm-insp').textContent = 'Terinspirasi oleh ' + p.inspired_by;
  document.getElementById('sm-name').textContent = p.name;
  document.getElementById('sm-family').textContent = (p.family || '') + (p.notes ? ' · ' + p.notes : '');

  const pr = CONFIG.PRICES;
  document.getElementById('sm-p10').textContent = 'RM ' + pr['10ml'].promo;
  document.getElementById('sm-n10').textContent = 'RM ' + pr['10ml'].normal;
  document.getElementById('sm-p30').textContent = 'RM ' + pr['30ml'].promo;
  document.getElementById('sm-n30').textContent = 'RM ' + pr['30ml'].normal;
  document.getElementById('sm-p60').textContent = 'RM ' + pr['60ml'].promo;
  document.getElementById('sm-n60').textContent = 'RM ' + pr['60ml'].normal;

  const stk = getStock(productId);
  document.getElementById('sm-stock').textContent = stk === 0 ? '⚠️ Stok habis' : stk + ' unit berbaki';

  document.querySelectorAll('.scent-size-btn').forEach(b => b.classList.remove('selected'));
  const addBtn = document.getElementById('sm-add-btn');
  addBtn.textContent = '+ Tambah ke Troli';
  addBtn.disabled = stk === 0;

  document.getElementById('scent-modal-overlay').classList.add('visible');
  document.body.classList.add('lock');
}

function closeScentModal() {
  document.getElementById('scent-modal-overlay').classList.remove('visible');
  document.body.classList.remove('lock');
  currentScentId = null;
  currentScentSize = null;
}

function selectScentSize(btn) {
  document.querySelectorAll('.scent-size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  currentScentSize = btn.dataset.size;
  document.getElementById('sm-add-btn').textContent = `+ Tambah ${currentScentSize} ke Troli`;
}

function scentModalAddToCart() {
  if (!currentScentSize) {
    document.querySelectorAll('.scent-size-btn').forEach(b => {
      b.style.borderColor = 'var(--red)';
      setTimeout(() => b.style.borderColor = '', 1200);
    });
    document.getElementById('sm-add-btn').textContent = '← Pilih saiz dahulu';
    setTimeout(() => document.getElementById('sm-add-btn').textContent = '+ Tambah ke Troli', 1500);
    return;
  }
  const fakeCard = document.querySelector(`[data-product-id="${currentScentId}"]`) || document.createElement('div');
  addToCart(currentScentId, currentScentSize, fakeCard);
  closeScentModal();
}
  grid.innerHTML = '';

  PRODUCTS.forEach((product, index) => {
    const stk = getStock(product.id);
    const pct = stk / CONFIG.INITIAL_STOCK;
    const isOut = stk === 0;
    const fillClass = stk === 0 ? 'crit' : stk <= 8 ? 'crit' : stk <= 18 ? 'low' : 'ok';

    let badgeHTML = '';
    if (product.badge) {
      const bc = ['Exclusive'].includes(product.badge) ? 'badge-exclusive' : ['Hot','Bestseller','Trending'].includes(product.badge) ? 'badge-hot' : 'badge-new';
      badgeHTML = `<span class="card-badge ${bc}">${product.badge}</span>`;
    }

    // Image OR SVG bottle
    const bottleVisual = product.image_url
      ? `<img src="${product.image_url}" alt="${product.name}" style="max-height:200px;max-width:90%;object-fit:contain">`
      : createBottleSVG(product.id, product.cap_color, product.rgb);

    const p = CONFIG.PRICES;
    const card = document.createElement('article');
    card.className = 'product-card' + (product.gender !== 'm' ? ' hidden' : '');
    card.style.display = product.gender !== 'm' ? 'none' : '';
    card.dataset.gender = product.gender;
    card.dataset.productId = product.id;
    card.dataset.searchIndex = [product.name, product.inspired_by, product.family, product.notes].join(' ').toLowerCase();
    

    card.innerHTML = `
      <div class="card-visual" style="background:radial-gradient(ellipse 80% 70% at 50% 35%,rgba(${product.rgb || '155,85,110'},0.16) 0%,rgba(${product.rgb || '155,85,110'},0.04) 100%)">
        <div class="card-mood-overlay">
          <p class="mood-description">${product.mood || ''}</p>
          <p class="mood-vibe">${product.vibe || ''}</p>
        </div>
        <div class="card-bottle">${bottleVisual}</div>
        ${badgeHTML}
      </div>
      <div class="card-info">
        <p class="card-inspired">Terinspirasi oleh ${product.inspired_by}</p>
        <h3 class="card-name">${product.name}</h3>
        <p class="card-family">${product.family} · ${product.notes}</p>
        <div class="stock-wrap">
          <div class="stock-bar"><div class="stock-fill ${fillClass}" style="width:${pct * 100}%"></div></div>
          <span class="stock-text ${stk <= 8 ? 'urgent' : ''}">${isOut ? 'STOK HABIS' : stk + ' unit berbaki'}</span>
        </div>
        <div class="size-selector">
          <button class="size-btn" data-size="10ml" ${isOut ? 'disabled' : ''} title="10ml — RM ${p['10ml'].promo}">
            <span class="size-ml">10ml</span>
            <span class="size-price">RM ${p['10ml'].promo}</span>
            <small class="size-normal">RM ${p['10ml'].normal}</small>
          </button>
          <button class="size-btn" data-size="30ml" ${isOut ? 'disabled' : ''} title="30ml — RM ${p['30ml'].promo}">
            <span class="size-ml">30ml</span>
            <span class="size-price">RM ${p['30ml'].promo}</span>
            <small class="size-normal">RM ${p['30ml'].normal}</small>
          </button>
          <button class="size-btn" data-size="60ml" ${isOut ? 'disabled' : ''} title="60ml — RM ${p['60ml'].promo}">
            <span class="size-ml">60ml</span>
            <span class="size-price">RM ${p['60ml'].promo}</span>
            <small class="size-normal">RM ${p['60ml'].normal}</small>
          </button>
        </div>
        <button class="btn-add-to-cart ${isOut ? 'sold-out' : ''}" data-product-id="${product.id}" ${isOut ? 'disabled' : ''}>
          ${isOut ? 'Stok Habis' : '+ Tambah ke Troli'}
        </button>
      </div>`;

    const sizeBtns = card.querySelectorAll('.size-btn');
    const addBtn   = card.querySelector('.btn-add-to-cart');

    // Store product ID on card for later
    card._productId = product.id;

grid.appendChild(card);
  });

  initScrollReveal();
  applyFilters();
}

// NEW FUNCTION - Add this right after renderProducts()
function attachCardListeners(card) {
  const sizeBtns = card.querySelectorAll('.size-btn');
  const addBtn = card.querySelector('.btn-add-to-cart');
  const productId = card._productId;

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      addBtn.dataset.selectedSize = btn.dataset.size;
      addBtn.textContent = `+ Tambah ${btn.dataset.size} ke Troli`;
    });
  });

  addBtn.addEventListener('click', () => {
    const selectedSize = addBtn.dataset.selectedSize;
    if (!selectedSize) {
      sizeBtns.forEach(b => { b.style.borderColor = 'var(--g)'; });
      setTimeout(() => sizeBtns.forEach(b => { b.style.borderColor = ''; }), 1200);
      addBtn.textContent = '← Pilih saiz dahulu';
      setTimeout(() => { addBtn.textContent = '+ Tambah ke Troli'; }, 1500);
      return;
    }
    addToCart(productId, selectedSize, card);
  });
}

let currentScentId = null;
let currentScentSize = null;

function openScentModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  currentScentId = productId;
  currentScentSize = null;

  document.getElementById('sm-bottle').innerHTML = createMiniBottleSVG(p.cap_color, p.rgb);
  document.getElementById('sm-insp').textContent = 'Terinspirasi oleh ' + p.inspired_by;
  document.getElementById('sm-name').textContent = p.name;
  document.getElementById('sm-family').textContent = (p.family || '') + (p.notes ? ' · ' + p.notes : '');

  const pr = CONFIG.PRICES;
  document.getElementById('sm-p10').textContent = 'RM ' + pr['10ml'].promo;
  document.getElementById('sm-n10').textContent = 'RM ' + pr['10ml'].normal;
  document.getElementById('sm-p30').textContent = 'RM ' + pr['30ml'].promo;
  document.getElementById('sm-n30').textContent = 'RM ' + pr['30ml'].normal;
  document.getElementById('sm-p60').textContent = 'RM ' + pr['60ml'].promo;
  document.getElementById('sm-n60').textContent = 'RM ' + pr['60ml'].normal;

  const stk = getStock(productId);
  document.getElementById('sm-stock').textContent = stk === 0 ? '⚠️ Stok habis' : stk + ' unit berbaki';

  document.querySelectorAll('.scent-size-btn').forEach(b => b.classList.remove('selected'));
  const addBtn = document.getElementById('sm-add-btn');
  addBtn.textContent = '+ Tambah ke Troli';
  addBtn.disabled = stk === 0;

  document.getElementById('scent-modal-overlay').classList.add('visible');
  document.body.classList.add('lock');
}

function closeScentModal() {
  document.getElementById('scent-modal-overlay').classList.remove('visible');
  document.body.classList.remove('lock');
  currentScentId = null;
  currentScentSize = null;
}

function selectScentSize(btn) {
  document.querySelectorAll('.scent-size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  currentScentSize = btn.dataset.size;
  document.getElementById('sm-add-btn').textContent = `+ Tambah ${currentScentSize} ke Troli`;
}

function scentModalAddToCart() {
  if (!currentScentSize) {
    document.querySelectorAll('.scent-size-btn').forEach(b => {
      b.style.borderColor = 'var(--red)';
      setTimeout(() => b.style.borderColor = '', 1200);
    });
    document.getElementById('sm-add-btn').textContent = '← Pilih saiz dahulu';
    setTimeout(() => document.getElementById('sm-add-btn').textContent = '+ Tambah ke Troli', 1500);
    return;
  }
  const fakeCard = document.querySelector(`[data-product-id="${currentScentId}"]`) || document.createElement('div');
  addToCart(currentScentId, currentScentSize, fakeCard);
  closeScentModal();
}

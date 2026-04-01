'use strict';

/* =====================================================
   PRICING
===================================================== */
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
  try {
    const rows = await sbFetch('products?active=eq.true&order=id.asc&select=*');
    PRODUCTS = rows || [];
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
   STOCK MANAGEMENT
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
  sbFetch('products?id=eq.' + id, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ stock: s[id] })
  }).catch(() => {});
  refreshCardStock(id);
}

function refreshCardStock(id) {
  document.querySelectorAll(`[data-product-id="${id}"]`).forEach(card => {
    const stk = getStock(id);
    const pct = stk / CONFIG.INITIAL_STOCK;
    const fill   = card.querySelector('.stock-fill');
    const text   = card.querySelector('.stock-text');
    const addBtn = card.querySelector('.btn-add-to-cart');
    const sizeBtns = card.querySelectorAll('.size-btn');
    if (fill) { fill.style.width = (pct * 100) + '%'; fill.className = 'stock-fill ' + (stk === 0 ? 'crit' : stk <= 8 ? 'crit' : stk <= 18 ? 'low' : ''); }
    if (text) { text.textContent = stk === 0 ? 'STOK HABIS' : stk + ' unit berbaki'; text.className = 'stock-text' + (stk <= 8 ? ' urgent' : ''); }
    if (addBtn && stk === 0) { addBtn.textContent = 'Stok Habis'; addBtn.className = 'btn-add-to-cart sold-out'; addBtn.disabled = true; }
    sizeBtns.forEach(b => { b.disabled = stk === 0; });
  });
}

/* =====================================================
   SVG BOTTLE GENERATOR
===================================================== */
function createBottleSVG(productId, cap, rgbStr) {
  const [r, g, b] = (rgbStr || '155,85,110').split(',').map(Number);
  const gradId = 'grad_' + String(productId).replace(/[^a-zA-Z0-9]/g, '_');
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
  const uid = Math.random().toString(36).slice(2);
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
   BUILD ONE PRODUCT CARD (returns a DOM element)
===================================================== */
function buildCard(product) {
  const stk = getStock(product.id);
  const pct = stk / CONFIG.INITIAL_STOCK;
  const isOut = stk === 0;
  const fillClass = stk === 0 ? 'crit' : stk <= 8 ? 'crit' : stk <= 18 ? 'low' : '';

  let badgeHTML = '';
  if (product.badge) {
    const bc = ['Exclusive'].includes(product.badge) ? 'badge-exclusive'
             : ['Hot','Bestseller','Trending'].includes(product.badge) ? 'badge-hot' : 'badge-new';
    badgeHTML = `<span class="card-badge ${bc}">${product.badge}</span>`;
  }

  const bottleVisual = product.image_url
    ? `<img src="${product.image_url}" alt="${product.name}" loading="lazy" style="max-height:200px;max-width:90%;object-fit:contain">`
    : createBottleSVG(product.id, product.cap_color, product.rgb);

  const p = CONFIG.PRICES;
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.gender = product.gender;
  card.dataset.productId = product.id;
  card.dataset.searchIndex = [product.name, product.inspired_by, product.family, product.notes].join(' ').toLowerCase();

  card.innerHTML = `
    <div class="card-visual">
      ${badgeHTML}
      ${bottleVisual}
    </div>
    <div class="card-info">
      <h3 class="card-name">${product.name}</h3>
      <div class="card-price-row">
        <span class="card-price-current">RM ${p['30ml'].promo}</span>
        <span class="card-price-original">RM ${p['30ml'].normal}</span>
      </div>
      <div class="stock-wrap">
        <div class="stock-bar"><div class="stock-fill ${fillClass}" style="width:${pct * 100}%"></div></div>
        <span class="stock-text ${stk <= 8 ? 'urgent' : ''}">${isOut ? 'STOK HABIS' : stk + ' unit berbaki'}</span>
      </div>
      <div class="size-selector">
        <button class="size-btn" data-size="10ml" ${isOut ? 'disabled' : ''}><span class="size-ml">10ml</span></button>
        <button class="size-btn" data-size="30ml" ${isOut ? 'disabled' : ''}><span class="size-ml">30ml</span></button>
        <button class="size-btn" data-size="60ml" ${isOut ? 'disabled' : ''}><span class="size-ml">60ml</span></button>
      </div>
      <button class="btn-add-to-cart ${isOut ? 'sold-out' : ''}" ${isOut ? 'disabled' : ''}>
        ${isOut ? 'Stok Habis' : '+ Tambah ke Troli'}
      </button>
    </div>`;

  attachCardListeners(card, product.id);
  return card;
}

/* =====================================================
   RENDER — builds hidden master list, then slider
===================================================== */
function renderProducts() {
  const loading = document.getElementById('grid-loading');
  if (loading) loading.remove();

  // Master hidden grid (used as data source)
  let grid = document.getElementById('product-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.id = 'product-grid';
    grid.style.display = 'none';
    document.querySelector('.collection .section-wrap').appendChild(grid);
  }
  grid.innerHTML = '';
  PRODUCTS.forEach(p => grid.appendChild(buildCard(p)));

  initScrollReveal();
  applyFilters();
}

/* =====================================================
   CARD LISTENERS
===================================================== */
function attachCardListeners(card, productId) {
  const sizeBtns = card.querySelectorAll('.size-btn');
  const addBtn   = card.querySelector('.btn-add-to-cart');
  let selectedSize = null;

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.dataset.size;
      if (!card.querySelector('.btn-add-to-cart.sold-out')) {
        addBtn.textContent = `+ Tambah ${selectedSize} ke Troli`;
      }
    });
  });

  addBtn.addEventListener('click', () => {
    if (addBtn.disabled) return;
    if (!selectedSize) {
      // Highlight size buttons to prompt selection
      sizeBtns.forEach(b => {
        b.style.borderColor = 'var(--g)';
        setTimeout(() => { b.style.borderColor = ''; }, 1200);
      });
      const prev = addBtn.textContent;
      addBtn.textContent = '← Pilih saiz dahulu';
      setTimeout(() => { addBtn.textContent = prev; }, 1500);
      return;
    }
    addToCart(productId, selectedSize, card);
  });
}

/* =====================================================
   FILTER + SLIDER
===================================================== */
let currentGender = 'm';
let searchQuery   = '';
let searchDebounce;
const CARDS_PER_ROW = 10;

function switchGender(gender) {
  currentGender = gender;
  document.querySelectorAll('.coll-gender-btn').forEach(b => b.classList.remove('active'));
  const map = { m: 'gbtn-m', w: 'gbtn-w', u: 'gbtn-u' };
  document.getElementById(map[gender])?.classList.add('active');
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('search-input');
  if (inp) {
    inp.addEventListener('input', function () {
      searchQuery = this.value.toLowerCase().trim();
      document.getElementById('search-clear').style.display = searchQuery ? 'block' : 'none';
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(applyFilters, 240);
    });
  }
});

function clearSearch() {
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  searchQuery = '';
  document.getElementById('search-clear').style.display = 'none';
  applyFilters();
}

function applyFilters() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const matching = PRODUCTS.filter(p =>
    p.gender === currentGender &&
    (!searchQuery || [p.name, p.inspired_by, p.family, p.notes].join(' ').toLowerCase().includes(searchQuery))
  );

  document.getElementById('no-results').style.display = matching.length === 0 ? 'block' : 'none';
  buildRows(matching);
}

/* =====================================================
   BUILD ROWS — creates fresh cards for each row slot
===================================================== */
function buildRows(products) {
  const container = document.getElementById('pslider-rows');
  if (!container) return;
  container.innerHTML = '';
  if (products.length === 0) return;

  // Split into chunks of CARDS_PER_ROW
  const chunks = [];
  for (let i = 0; i < products.length; i += CARDS_PER_ROW) {
    chunks.push(products.slice(i, i + CARDS_PER_ROW));
  }

  chunks.forEach((chunk, rowIndex) => {
    const rowWrap = document.createElement('div');
    rowWrap.className = 'prow-wrap';

    // Row header
    const start = rowIndex * CARDS_PER_ROW + 1;
    const end   = start + chunk.length - 1;
    const rowHeader = document.createElement('div');
    rowHeader.className = 'prow-header';
    rowHeader.innerHTML = `
      <span class="prow-label">${start}–${end} daripada ${products.length}</span>
      <div class="prow-arrows">
        <button class="pslider-arrow" data-row="${rowIndex}" data-dir="-1" aria-label="Kiri">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="pslider-arrow" data-row="${rowIndex}" data-dir="1" aria-label="Kanan">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;

    // Viewport + track
    const viewport = document.createElement('div');
    viewport.className = 'prow-viewport';

    const track = document.createElement('div');
    track.className = 'prow-track';
    track.id = `prow-track-${rowIndex}`;
    track.dataset.offset = '0';

    // Build fresh cards for this row
    chunk.forEach(product => {
      const card = buildCard(product);
      track.appendChild(card);
    });

    viewport.appendChild(track);
    rowWrap.appendChild(rowHeader);
    rowWrap.appendChild(viewport);

    // Dots
    const visibleCards = getVisibleCardCount();
    const maxOffset = Math.max(0, chunk.length - visibleCards);
    if (maxOffset > 0) {
      const dots = document.createElement('div');
      dots.className = 'prow-dots';
      dots.id = `prow-dots-${rowIndex}`;
      for (let d = 0; d <= maxOffset; d++) {
        const dot = document.createElement('button');
        dot.className = 'pslider-dot' + (d === 0 ? ' active' : '');
        dot.dataset.row = rowIndex;
        dot.dataset.offset = d;
        dots.appendChild(dot);
      }
      rowWrap.appendChild(dots);

      // Dots click (delegated)
      dots.addEventListener('click', e => {
        const btn = e.target.closest('.pslider-dot');
        if (btn) rowScrollTo(rowIndex, parseInt(btn.dataset.offset));
      });
    }

    // Arrow click (delegated)
    rowHeader.addEventListener('click', e => {
      const btn = e.target.closest('.pslider-arrow');
      if (btn) rowScroll(parseInt(btn.dataset.row), parseInt(btn.dataset.dir));
    });

    // Touch swipe
    addSwipeSupport(viewport, rowIndex);

    container.appendChild(rowWrap);
  });
}

/* =====================================================
   SLIDER MECHANICS
===================================================== */
function getVisibleCardCount() {
  const w = window.innerWidth;
  if (w <= 600)  return 1;
  if (w <= 1024) return 2;
  return 3;
}

function rowScroll(rowIndex, dir) {
  const track = document.getElementById(`prow-track-${rowIndex}`);
  if (!track) return;
  const current = parseInt(track.dataset.offset) || 0;
  const max = Math.max(0, track.children.length - getVisibleCardCount());
  rowScrollTo(rowIndex, Math.min(max, Math.max(0, current + dir)));
}

function rowScrollTo(rowIndex, offset) {
  const track = document.getElementById(`prow-track-${rowIndex}`);
  if (!track) return;
  const visible = getVisibleCardCount();
  const max = Math.max(0, track.children.length - visible);
  offset = Math.min(max, Math.max(0, offset));
  track.style.transform = `translateX(-${(100 / visible) * offset}%)`;
  track.dataset.offset = offset;

  const dotsEl = document.getElementById(`prow-dots-${rowIndex}`);
  if (dotsEl) {
    dotsEl.querySelectorAll('.pslider-dot').forEach((d, i) => d.classList.toggle('active', i === offset));
  }
}

function addSwipeSupport(viewport, rowIndex) {
  let startX = 0;
  viewport.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) rowScroll(rowIndex, diff > 0 ? 1 : -1);
  }, { passive: true });
}

// Re-render on resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyFilters, 200);
}, { passive: true });

/* =====================================================
   COLLECTION SLIDER — multi-row, 10 per row
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

function closeNavSearch() {
  document.getElementById('nav-search-bar').classList.remove('open');
  document.getElementById('nav-search-input').value = '';
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
  const allCards = Array.from(grid.querySelectorAll('.product-card'));
  const matching = allCards.filter(c =>
    c.dataset.gender === currentGender &&
    (!searchQuery || c.dataset.searchIndex.includes(searchQuery))
  );
  allCards.forEach(c => { c.style.display = 'none'; c.classList.add('hidden'); });
  matching.forEach(c => { c.classList.remove('hidden'); });
  document.getElementById('no-results').style.display = matching.length === 0 ? 'block' : 'none';
  buildRows(matching);
}

function buildRows(matching) {
  const container = document.getElementById('pslider-rows');
  container.innerHTML = '';
  if (matching.length === 0) return;

  const clonedCards = matching.map(c => {
    const clone = c.cloneNode(true);
    clone._productId = c._productId;
    return clone;
  });

  const chunks = [];
  for (let i = 0; i < matching.length; i += CARDS_PER_ROW) {
    chunks.push(matching.slice(i, i + CARDS_PER_ROW));
  }

  chunks.forEach((chunk, rowIndex) => {
    const rowWrap = document.createElement('div');
    rowWrap.className = 'prow-wrap';
    rowWrap.dataset.row = rowIndex;

    const rowHeader = document.createElement('div');
    rowHeader.className = 'prow-header';
    const start = rowIndex * CARDS_PER_ROW + 1;
    const end   = Math.min(start + chunk.length - 1, matching.length);
    rowHeader.innerHTML = `
      <span class="prow-label">${start}–${end} daripada ${matching.length}</span>
      <div class="prow-arrows">
        <button class="pslider-arrow" onclick="rowScroll(${rowIndex},-1)" aria-label="Kiri">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="pslider-arrow" onclick="rowScroll(${rowIndex},1)" aria-label="Kanan">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;

    const viewport = document.createElement('div');
    viewport.className = 'prow-viewport';
    viewport.dataset.rowIndex = rowIndex;

    const track = document.createElement('div');
    track.className = 'prow-track';
    track.id = `prow-track-${rowIndex}`;
    track.dataset.offset = '0';

    clonedCards.slice(rowIndex * CARDS_PER_ROW, rowIndex * CARDS_PER_ROW + chunk.length).forEach(card => {
      card.style.display = '';
      attachCardListeners(card);
      track.appendChild(card);
    });

    // ── TOUCH swipe ──
    let touchStartX = 0;
    viewport.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchmove', e => {
      const delta   = touchStartX - e.touches[0].clientX;
      const current = parseInt(track.dataset.offset) || 0;
      const pct     = (100 / getVisibleCardCount()) * current;
      track.style.transition = 'none';
      track.style.transform  = `translateX(calc(-${pct}% - ${delta}px))`;
    }, { passive: true });
    viewport.addEventListener('touchend', e => {
      track.style.transition = '';
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) rowScroll(rowIndex, diff > 0 ? 1 : -1);
      else rowScrollTo(rowIndex, parseInt(track.dataset.offset) || 0);
    }, { passive: true });

    // ── MOUSE DRAG ──
    let dragStartX = 0, dragging = false, dragDelta = 0;
    viewport.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      dragging   = true;
      dragStartX = e.clientX;
      dragDelta  = 0;
      track.style.transition = 'none';
      viewport.style.cursor  = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      dragDelta = dragStartX - e.clientX;
      const current = parseInt(track.dataset.offset) || 0;
      const pct     = (100 / getVisibleCardCount()) * current;
      track.style.transform = `translateX(calc(-${pct}% - ${dragDelta}px))`;
    });
    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      viewport.style.cursor  = 'grab';
      if (Math.abs(dragDelta) > 40) rowScroll(rowIndex, dragDelta > 0 ? 1 : -1);
      else rowScrollTo(rowIndex, parseInt(track.dataset.offset) || 0);
    });
    viewport.addEventListener('dragstart', e => e.preventDefault());

    viewport.appendChild(track);
    rowWrap.appendChild(rowHeader);
    rowWrap.appendChild(viewport);

    // Dots
    const cardCount  = chunk.length;
    const maxOffset  = Math.max(0, cardCount - getVisibleCardCount());
    if (maxOffset > 0) {
      const dots = document.createElement('div');
      dots.className = 'prow-dots';
      dots.id = `prow-dots-${rowIndex}`;
      for (let d = 0; d <= maxOffset; d++) {
        const dot = document.createElement('button');
        dot.className = 'pslider-dot' + (d === 0 ? ' active' : '');
        dot.onclick = ((ri, di) => () => rowScrollTo(ri, di))(rowIndex, d);
        dots.appendChild(dot);
      }
      rowWrap.appendChild(dots);
    }

    container.appendChild(rowWrap);
  });
}

function getVisibleCardCount() {
  const w = window.innerWidth;
  if (w <= 600) return 1;
  if (w <= 1024) return 2;
  return 3;
}

function rowScroll(rowIndex, dir) {
  const track = document.getElementById(`prow-track-${rowIndex}`);
  if (!track) return;
  const current = parseInt(track.dataset.offset) || 0;
  const cardCount = track.children.length;
  const visible = getVisibleCardCount();
  const max = Math.max(0, cardCount - visible);
  const next = Math.min(max, Math.max(0, current + dir));
  rowScrollTo(rowIndex, next);
}

function rowScrollTo(rowIndex, offset) {
  const track = document.getElementById(`prow-track-${rowIndex}`);
  if (!track) return;
  const cardCount = track.children.length;
  const visible = getVisibleCardCount();
  const max = Math.max(0, cardCount - visible);
  offset = Math.min(max, Math.max(0, offset));

  const pct = (100 / visible) * offset;
  track.style.transform = `translateX(-${pct}%)`;
  track.dataset.offset = offset;

  // Update dots
  const dotsEl = document.getElementById(`prow-dots-${rowIndex}`);
  if (dotsEl) {
    dotsEl.querySelectorAll('.pslider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === offset);
    });
  }
}

// Re-render rows on resize
window.addEventListener('resize', () => {
  const allCards = Array.from(document.querySelectorAll('.product-card:not(.hidden)'));
  if (allCards.length > 0) buildRows(allCards);
}, { passive: true });
/* =====================================================
   PROMO POPUP
===================================================== */
function openPromoPopup() {
  if (localStorage.getItem('artisan_promo_hide') === '1') return;
  setTimeout(() => {
    document.getElementById('promo-overlay').classList.add('visible');
    document.body.classList.add('lock');
  }, 1800); // delay so page loads first
}

function closePromoPopup() {
  document.getElementById('promo-overlay').classList.remove('visible');
  document.body.classList.remove('lock');
}

function handleDontShow(checkbox) {
  localStorage.setItem('artisan_promo_hide', checkbox.checked ? '1' : '0');
}

/* =====================================================
   ANNOUNCEMENT COUNTDOWN
===================================================== */
function initAnnouncementCountdown() {
  let end = parseInt(localStorage.getItem(CONFIG.KEYS.TIMER) || '0');
  if (!end || end <= Date.now()) { end = Date.now() + 24 * 60 * 60 * 1000; localStorage.setItem(CONFIG.KEYS.TIMER, end); }
  (function tick() {
    const rem = Math.max(0, end - Date.now());
    const pad = n => String(n).padStart(2,'0');
    const hEl = document.getElementById('cdH'), mEl = document.getElementById('cdM'), sEl = document.getElementById('cdS');
    if (hEl) hEl.textContent = pad(Math.floor(rem / 3600000));
    if (mEl) mEl.textContent = pad(Math.floor((rem % 3600000) / 60000));
    if (sEl) sEl.textContent = pad(Math.floor((rem % 60000) / 1000));
    if (rem > 0) { setTimeout(tick, 1000); } else { end = Date.now() + 24 * 60 * 60 * 1000; localStorage.setItem(CONFIG.KEYS.TIMER, end); tick(); }
  })();
}

document.getElementById('ann-close').addEventListener('click', () => {
  const bar = document.getElementById('ann'); if (bar) bar.style.display = 'none';
  document.getElementById('main-nav').classList.add('no-ann');
});

/* =====================================================
   NAV SCROLL / HAMBURGER / MISC
===================================================== */
const mainNav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 60;
  mainNav.classList.toggle('scrolled', scrolled);
  
}, { passive: true });
// HAMBURGER / MEGA MENU
let megaOpen = false;

function openMegaMenu() {
  megaOpen = true;
  document.getElementById('mega-overlay').classList.add('visible');
  document.getElementById('hamburger').classList.add('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'true');
  document.getElementById('main-nav').classList.add('scrolled');
  document.getElementById('nav-search-btn').style.display = 'none'; // ADD THIS
  document.body.classList.add('lock');
}

function closeMegaMenu() {
  megaOpen = false;
   document.getElementById('nav-search-btn').style.display = ''; // ADD THIS
  document.getElementById('mega-overlay').classList.remove('visible');
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('lock');
  // Only remove solid if not actually scrolled
  if (window.scrollY <= 60) {
    document.getElementById('main-nav').classList.remove('scrolled');
  }
}

function switchMegaTab(gender) {
  document.querySelectorAll('.mega-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('mtab-' + gender).classList.add('active');
  document.querySelectorAll('.mega-grid').forEach(g => g.classList.add('hidden'));
  document.getElementById('mgrid-' + gender).classList.remove('hidden');
}

document.getElementById('hamburger').addEventListener('click', () => {
  megaOpen ? closeMegaMenu() : openMegaMenu();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMegaMenu(); closeCart(); closeOrderModal(); }
});

document.getElementById('nav-cart-btn').addEventListener('click', openCart);
document.getElementById('nav-search-btn').addEventListener('click', () => {
  const bar = document.getElementById('nav-search-bar');
  const isOpen = bar.classList.contains('open');
  if (isOpen) {
    bar.classList.remove('open');
    document.getElementById('main-nav').classList.remove('search-open');
    if (window.scrollY <= 60 && !megaOpen) {
      document.getElementById('main-nav').classList.remove('scrolled');
    }
  } else {
    bar.classList.add('open');
    document.getElementById('main-nav').classList.add('scrolled');
    document.getElementById('main-nav').classList.add('search-open');
    setTimeout(() => document.getElementById('nav-search-input').focus(), 150);
  }
});

document.getElementById('nav-search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) window.location.href = `koleksi.html?q=${encodeURIComponent(q)}`;
  }
  if (e.key === 'Escape') {
    document.getElementById('nav-search-bar').classList.remove('open');
    document.getElementById('main-nav').classList.remove('search-open');
    if (window.scrollY <= 60 && !megaOpen) {
      document.getElementById('main-nav').classList.remove('scrolled');
    }
    e.target.value = '';
  }
});
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - mainNav.offsetHeight - 10, behavior: 'smooth' }); }
  });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeOrderModal(); closeMobileNav(); } });

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - mainNav.offsetHeight - 10, behavior: 'smooth' });
}

/* =====================================================
   SCROLL REVEAL
===================================================== */
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }), { threshold: 0.07 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* =====================================================
   CUSTOM CURSOR
===================================================== */
(function initCursor() {
  const dot = document.getElementById('cur'), ring = document.getElementById('cur2');
  if (!dot || !ring || window.matchMedia('(pointer:coarse)').matches) return;
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
  document.addEventListener('mouseleave', () => { dot.style.opacity='0'; ring.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity='1'; ring.style.opacity='1'; });
  (function ar() { rx += (mx-rx)*.11; ry += (my-ry)*.11; ring.style.left = rx+'px'; ring.style.top = ry+'px'; requestAnimationFrame(ar); })();
  document.querySelectorAll('a,button,[role="button"],.product-card,.size-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('h'));
    el.addEventListener('mouseleave', () => ring.classList.remove('h'));
  });
})();

/* =====================================================
   APP INIT — async: load pricing + products from Supabase
===================================================== */

/* =====================================================
   DARK MODE TOGGLE
===================================================== */
(function initTheme() {
  const saved = localStorage.getItem('artisan_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('artisan_theme', isDark ? 'light' : 'dark');
  });
})();

/* =====================================================
   HERO CAROUSEL — auto, swipe, mouse drag
===================================================== */
let hcCurrent = 0;
const hcTotal  = document.querySelectorAll('.hc-slide').length;
let hcTimer;
let hcDragging = false, hcDragStartX = 0, hcDragDelta = 0;

function hcGoTo(index) {
  hcCurrent = (index + hcTotal) % hcTotal;
  const track = document.getElementById('hc-track');
  if (track) track.style.transform = `translateX(-${hcCurrent * 100}%)`;
  document.querySelectorAll('.hc-dot').forEach((d, i) =>
    d.classList.toggle('active', i === hcCurrent)
  );
  resetHcTimer();
}

function hcNext() { hcGoTo(hcCurrent + 1); }
function hcPrev() { hcGoTo(hcCurrent - 1); }

function resetHcTimer() {
  clearInterval(hcTimer);
  hcTimer = setInterval(hcNext, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.hero-carousel');
  const track    = document.getElementById('hc-track');
  if (!carousel || !track) return;

  // Start auto-play
  hcTimer = setInterval(hcNext, 5000);

  // Pause on hover
  carousel.addEventListener('mouseenter', () => clearInterval(hcTimer));
  carousel.addEventListener('mouseleave', () => { resetHcTimer(); });

  // ── TOUCH SWIPE ──
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    clearInterval(hcTimer);
  }, { passive: true });
  carousel.addEventListener('touchmove', e => {
    const delta = touchStartX - e.touches[0].clientX;
    track.style.transform = `translateX(calc(-${hcCurrent * 100}% - ${delta}px))`;
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    track.style.transition = '';
    if (Math.abs(diff) > 50) {
      diff > 0 ? hcNext() : hcPrev();
    } else {
      hcGoTo(hcCurrent); // snap back
    }
    resetHcTimer();
  }, { passive: true });

  // ── MOUSE DRAG (laptop) ──
  carousel.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    hcDragging   = true;
    hcDragStartX = e.clientX;
    hcDragDelta  = 0;
    track.style.transition = 'none';
    carousel.style.cursor  = 'grabbing';
    clearInterval(hcTimer);
  });
  window.addEventListener('mousemove', e => {
    if (!hcDragging) return;
    hcDragDelta = hcDragStartX - e.clientX;
    track.style.transform = `translateX(calc(-${hcCurrent * 100}% - ${hcDragDelta}px))`;
  });
  window.addEventListener('mouseup', () => {
    if (!hcDragging) return;
    hcDragging = false;
    track.style.transition = '';
    carousel.style.cursor  = 'grab';
    if (Math.abs(hcDragDelta) > 60) {
      hcDragDelta > 0 ? hcNext() : hcPrev();
    } else {
      hcGoTo(hcCurrent);
    }
    resetHcTimer();
  });

   window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 60;
  mainNav.classList.toggle('scrolled', scrolled);
  if (scrolled) {
    mainNav.classList.add('no-ann');
  } else if (document.getElementById('ann')?.style.display !== 'none') {
    mainNav.classList.remove('no-ann');
  }
}, { passive: true });

  // Prevent drag from triggering link clicks
  carousel.addEventListener('dragstart', e => e.preventDefault());
});

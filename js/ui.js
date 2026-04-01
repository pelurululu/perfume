/* =====================================================
   COLLECTION SLIDER
===================================================== */
let currentGender = 'm';
let searchQuery   = '';
let searchDebounce;
let pSliderIndex  = 0;
let pSliderPages  = 0;
const CARDS_PER_SLIDE = 3;

function switchGender(gender) {
  currentGender = gender;
  pSliderIndex  = 0;
  document.querySelectorAll('.coll-gender-btn').forEach(b => b.classList.remove('active'));
  const map = { m: 'gbtn-m', w: 'gbtn-w', u: 'gbtn-u' };
  document.getElementById(map[gender])?.classList.add('active');
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('search-input');
  if (inp) {
    inp.addEventListener('input', function () {
      searchQuery  = this.value.toLowerCase().trim();
      pSliderIndex = 0;
      document.getElementById('search-clear').style.display = searchQuery ? 'block' : 'none';
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(applyFilters, 240);
    });
  }
});

function clearSearch() {
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  searchQuery  = '';
  pSliderIndex = 0;
  document.getElementById('search-clear').style.display = 'none';
  applyFilters();
}

function applyFilters() {
  const allCards = Array.from(document.querySelectorAll('.product-card'));
  const matching = allCards.filter(c =>
    c.dataset.gender === currentGender &&
    (!searchQuery || c.dataset.searchIndex.includes(searchQuery))
  );

  // Hide all, then reorder track so matching cards come first
  allCards.forEach(c => {
    c.style.display = 'none';
    c.classList.add('hidden');
  });

  matching.forEach(c => {
    c.style.display = '';
    c.classList.remove('hidden');
  });

  document.getElementById('no-results').style.display = matching.length === 0 ? 'block' : 'none';

  pSliderPages = Math.max(1, Math.ceil(matching.length / CARDS_PER_SLIDE));
  pSliderIndex = Math.min(pSliderIndex, pSliderPages - 1);
  pSliderRender(matching);
}

function pSliderRender(matching) {
  // Move track to current page
  const cardW = 100 / CARDS_PER_SLIDE;
  const offset = pSliderIndex * CARDS_PER_SLIDE * cardW;
  const track = document.getElementById('pslider-track');
  track.style.transform = `translateX(-${offset}%)`;

  // Arrows
  document.getElementById('pslider-prev').disabled = pSliderIndex === 0;
  document.getElementById('pslider-next').disabled = pSliderIndex >= pSliderPages - 1;

  // Dots
  const dotsEl = document.getElementById('pslider-dots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < pSliderPages; i++) {
    const d = document.createElement('button');
    d.className = 'pslider-dot' + (i === pSliderIndex ? ' active' : '');
    d.setAttribute('aria-label', `Halaman ${i + 1}`);
    d.onclick = () => { pSliderIndex = i; pSliderRender(matching); };
    dotsEl.appendChild(d);
  }

  // Counter
  const start = pSliderIndex * CARDS_PER_SLIDE + 1;
  const end   = Math.min(start + CARDS_PER_SLIDE - 1, matching.length);
  document.getElementById('pslider-counter').textContent =
    matching.length > 0 ? `${start}–${end} / ${matching.length}` : '';
}

function pSliderNext() {
  if (pSliderIndex < pSliderPages - 1) {
    pSliderIndex++;
    const matching = Array.from(document.querySelectorAll('.product-card:not(.hidden)'));
    pSliderRender(matching);
  }
}

function pSliderPrev() {
  if (pSliderIndex > 0) {
    pSliderIndex--;
    const matching = Array.from(document.querySelectorAll('.product-card:not(.hidden)'));
    pSliderRender(matching);
  }
}
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
window.addEventListener('scroll', () => mainNav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });

const hamburgerBtn = document.getElementById('hamburger'), mobileNavEl = document.getElementById('mobile-nav');
hamburgerBtn.addEventListener('click', () => {
  const isOpen = mobileNavEl.classList.toggle('open');
  hamburgerBtn.classList.toggle('open', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', isOpen);
  document.body.classList.toggle('lock', isOpen);
});
function closeMobileNav() { mobileNavEl.classList.remove('open'); hamburgerBtn.classList.remove('open'); hamburgerBtn.setAttribute('aria-expanded','false'); document.body.classList.remove('lock'); }
document.getElementById('nav-cart-btn').addEventListener('click', openCart);
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
   HERO CAROUSEL
===================================================== */
let hcCurrent = 0;
const hcTotal = 3;
let hcTimer;

function hcGoTo(index) {
  hcCurrent = index;
  document.getElementById('hc-track').style.transform = `translateX(-${index * 100}%)`;
  document.querySelectorAll('.hc-dot').forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });
  clearInterval(hcTimer);
  hcTimer = setInterval(hcNext, 5000);
}

function hcNext() {
  hcGoTo((hcCurrent + 1) % hcTotal);
}

function hcPrev() {
  hcGoTo((hcCurrent - 1 + hcTotal) % hcTotal);
}

// Auto-play
hcTimer = setInterval(hcNext, 5000);

// Pause on hover
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.hero-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(hcTimer));
    carousel.addEventListener('mouseleave', () => { hcTimer = setInterval(hcNext, 5000); });
  }
});

let currentGender = 'm';
let searchQuery   = '';
let searchDebounce;
let carouselPage  = 0;
const CARDS_PER_PAGE = 10; // 2 rows of 5

function switchGender(gender) {
  currentGender = gender;
  carouselPage  = 0;
  document.getElementById('tab-men').className    = 'gender-tab' + (gender === 'm' ? ' active-men' : '');
  document.getElementById('tab-women').className  = 'gender-tab' + (gender === 'w' ? ' active-women' : '');
  document.getElementById('tab-unisex').className = 'gender-tab' + (gender === 'u' ? ' active-unisex' : '');
  ['m','w','u'].forEach(g => {
    const key = g === 'm' ? 'men' : g === 'w' ? 'women' : 'unisex';
    document.getElementById('tab-' + key).setAttribute('aria-selected', gender === g);
  });
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input').addEventListener('input', function () {
    searchQuery  = this.value.toLowerCase().trim();
    carouselPage = 0;
    document.getElementById('search-clear').style.display = searchQuery ? 'block' : 'none';
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyFilters, 240);
  });
});

function clearSearch() {
  document.getElementById('search-input').value = '';
  searchQuery  = '';
  carouselPage = 0;
  document.getElementById('search-clear').style.display = 'none';
  applyFilters();
}

function applyFilters() {
  const allCards = Array.from(document.querySelectorAll('.product-card'));
  const matching = allCards.filter(card =>
    card.dataset.gender === currentGender &&
    (!searchQuery || card.dataset.searchIndex.includes(searchQuery))
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / CARDS_PER_PAGE));
  carouselPage = Math.min(carouselPage, totalPages - 1);
  const start = carouselPage * CARDS_PER_PAGE;
  const pageCards = matching.slice(start, start + CARDS_PER_PAGE);
  // Show/hide
  allCards.forEach(c => c.classList.add('hidden'));
  pageCards.forEach(c => c.classList.remove('hidden'));
  // No results
  document.getElementById('no-results').style.display = matching.length === 0 ? 'block' : 'none';
  updateCarouselUI(matching.length, totalPages);
}

function updateCarouselUI(total, totalPages) {
  // Page label
  document.getElementById('carousel-page-label').textContent =
    `Halaman ${carouselPage + 1} / ${totalPages}`;
  // Arrows
  document.getElementById('carousel-prev').disabled = carouselPage === 0;
  document.getElementById('carousel-next').disabled = carouselPage >= totalPages - 1;
  // Dots
  const dotsEl = document.getElementById('carousel-dots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === carouselPage ? ' active' : '');
    dot.setAttribute('aria-label', `Halaman ${i + 1}`);
    dot.onclick = () => { carouselPage = i; applyFilters(); };
    dotsEl.appendChild(dot);
  }
  // See more — only show if more than 1 page
  const seeMore = document.getElementById('carousel-see-more');
  seeMore.style.display = totalPages > 1 ? 'inline-flex' : 'none';
  seeMore.textContent = '';
  seeMore.innerHTML = carouselPage >= totalPages - 1
    ? `Lihat Kurang <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`
    : `Lihat Semua (${total}) <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
}

function carouselPrev() {
  if (carouselPage > 0) { carouselPage--; pageTransition(); }
}
function carouselNext() {
  carouselPage++; pageTransition();
}
function carouselSeeMore(e) {
  e.preventDefault();
  const allCards = Array.from(document.querySelectorAll('.product-card'));
  const matching = allCards.filter(c => c.dataset.gender === currentGender && (!searchQuery || c.dataset.searchIndex.includes(searchQuery)));
  const totalPages = Math.ceil(matching.length / CARDS_PER_PAGE);
  carouselPage = carouselPage >= totalPages - 1 ? 0 : totalPages - 1;
  pageTransition();
}
function pageTransition() {
  const grid = document.getElementById('product-grid');
  grid.classList.add('page-transition');
  setTimeout(() => { applyFilters(); grid.classList.remove('page-transition'); }, 220);
  document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
init();

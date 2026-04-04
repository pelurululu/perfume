async function init() {
  initAnnouncementCountdown();
  initScrollReveal();
  
  await loadProducts();
  initStock();
 refreshCartUI();
  await loadCarouselFromDB();
  await loadPopupFromDB();
  openPromoPopup();
}

async function loadCarouselFromDB() {
  try {
    const slides = await sbFetch('carousel_slides?active=eq.true&order=slide_order.asc');
    if (!slides || !slides.length) return;
    slides.forEach((slide, i) => {
      const s = document.querySelector(`.hc-slide:nth-child(${i + 1})`);
      if (!s) return;
      s.querySelector('.hc-eyebrow').textContent   = slide.eyebrow || '';
      const titleEl = s.querySelector('.hc-title');
      titleEl.innerHTML = `${slide.title || ''}<br><em>${slide.title_em || ''}</em>`;
      s.querySelector('.hc-desc').textContent = slide.description || '';
      const btn = s.querySelector('.hc-btn');
      if (btn) {
        btn.textContent = slide.btn_text || '';
        if (slide.btn_onclick) btn.setAttribute('onclick', slide.btn_onclick);
      }
      const bgEl = s.querySelector('.hc-bg');
if (slide.bg_image_url) {
  bgEl.style.backgroundImage = `url('${slide.bg_image_url}')`;
  bgEl.style.background = slide.bg_gradient || '';
  bgEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url('${slide.bg_image_url}')`;
  bgEl.style.backgroundSize = 'cover';
  bgEl.style.backgroundPosition = 'center';
} else {
  bgEl.style.background = slide.bg_gradient || '';
}
    });
  } catch(e) { /* keep hardcoded fallback */ }
}

async function loadPopupFromDB() {
  try {
    const rows = await sbFetch('promo_popup?id=eq.1');
    const p = rows?.[0];
    if (!p) return;
    if (!p.active) {
      return;
    }
    // Clear any previously stored hide flag since popup is now active
    localStorage.removeItem('artisan_promo_hide');
    document.querySelector('.promo-popup-eyebrow').textContent = p.eyebrow || '';
    document.querySelector('.promo-popup-title').innerHTML =
      `${p.title || ''} <br><em>${p.title_em || ''}</em>`;
    document.querySelector('.promo-popup-desc').textContent = p.description || '';
    document.querySelector('.promo-popup-saving strong').textContent = p.saving_text || '';
    const cta = document.querySelector('.promo-popup-cta');
    const imgWrap = document.getElementById('promo-popup-img-wrap');
if (imgWrap && p.image_url) {
  let img = imgWrap.querySelector('img.popup-bg-img');
  if (!img) {
    img = document.createElement('img');
    img.className = 'popup-bg-img';
    imgWrap.insertBefore(img, imgWrap.firstChild);
  }
  img.src = p.image_url;
  img.classList.add('visible');
  imgWrap.querySelector('svg').style.display = 'none';
}
    cta.textContent = p.cta_text || '';
    cta.href = p.cta_href || '#';
  } catch(e) { /* keep hardcoded fallback */ }
}

init();

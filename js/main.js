async function init() {
  initAnnouncementCountdown();
  initScrollReveal();
  await loadPricing();
  await loadProducts();
  initStock();
  refreshCartUI();
  openPromoPopup();
}

init();

async function init() {
  initAnnouncementCountdown();
  initScrollReveal();
  // Load pricing first (affects price display in cards)
  await loadPricing();
  // Load + render products
  await loadProducts();
  // Init stock from loaded products
  initStock();
  // Restore cart
  refreshCartUI();
}

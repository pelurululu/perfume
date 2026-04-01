'use strict';

/* =====================================================
   SUPABASE CONFIG
===================================================== */
const SB_URL = 'https://oyhtkqfmlwbkjbcfgqxm.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aHRrcWZtbHdia2piY2ZncXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzM0NzcsImV4cCI6MjA5MDUwOTQ3N30.ZtWi9M7biYA47TcELySXXT-8KdhEne5Iag6uSA7bhrQ';

async function sbFetch(path, opts = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    ...opts,
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (!res.ok) throw new Error('Supabase error: ' + res.status);
  return res.status === 204 ? null : res.json();
}

/* =====================================================
   APP CONFIG — prices loaded from Supabase
===================================================== */
const CONFIG = {
  WA_NUMBER:     '601159003985',
  TOYYIBPAY_URL: 'https://perfume-backend-9653.onrender.com/checkout.php',
  USE_TOYYIBPAY: true,
  PRICES: { '10ml': { normal: 35, promo: 25 }, '30ml': { normal: 69, promo: 49 }, '60ml': { normal: 99, promo: 79 } },
  INITIAL_STOCK: 50,
  KEYS: { STOCK: 'artisan_stock_v2', CART: 'artisan_cart_v2', TIMER: 'artisan_ann_end_v1' }
};

/**
 * Application Configuration
 * The Artisan Parfum
 */

const CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://oyhtkqfmlwbkjbcfgqxm.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aHRrcWZtbHdia2piY2ZncXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzM0NzcsImV4cCI6MjA5MDUwOTQ3N30.ZtWi9M7biYA47TcELySXXT-8KdhEne5Iag6uSA7bhrQ',
  
  // Business Configuration
  WHATSAPP_NUMBER: '601159003985',
  TOYYIBPAY_URL: 'https://perfume-backend-9653.onrender.com/checkout.php',
  USE_TOYYIBPAY: true,
  
  // Pricing (will be loaded from Supabase)
  PRICES: {
    '10ml': { normal: 35, promo: 25 },
    '30ml': { normal: 69, promo: 49 },
    '60ml': { normal: 99, promo: 79 }
  },
  
  // Stock Configuration
  INITIAL_STOCK: 50,
  LOW_STOCK_THRESHOLD: 18,
  CRITICAL_STOCK_THRESHOLD: 8,
  
  // Cart Configuration
  CART_EXPIRY_MINUTES: 15,
  BUNDLE_THRESHOLD: 3, // Buy 3x60ml get 1x30ml free
  FREE_SHIPPING_THRESHOLD: 150,
  SHIPPING_COST: 8,
  
  // LocalStorage Keys
  STORAGE_KEYS: {
    CART: 'artisan_cart_v3',
    USER: 'artisan_user_v3',
    WISHLIST: 'artisan_wishlist_v3',
    RECENT_VIEWS: 'artisan_recent_v3',
    PREFERENCES: 'artisan_prefs_v3'
  },
  
  // UI Configuration
  PRODUCTS_PER_PAGE: 24,
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION_MS: 3000,
  
  // Categories
  CATEGORIES: {
    HOT_SELLERS: 'hot',
    NEW_ARRIVALS: 'new',
    EXCLUSIVE: 'exclusive',
    MEN: 'm',
    WOMEN: 'w',
    UNISEX: 'u'
  },
  
  // Fragrance Families
  FRAGRANCE_FAMILIES: [
    'Floral',
    'Oriental',
    'Woody',
    'Fresh',
    'Citrus',
    'Gourmand',
    'Chypre',
    'Fougère',
    'Aquatic',
    'Spicy',
    'Fruity',
    'Green'
  ],
  
  // States for Malaysia
  STATES: [
    'Johor',
    'Kedah',
    'Kelantan',
    'Melaka',
    'Negeri Sembilan',
    'Pahang',
    'Perak',
    'Perlis',
    'Pulau Pinang',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Terengganu',
    'W.P. Kuala Lumpur',
    'W.P. Labuan',
    'W.P. Putrajaya'
  ],
  
  // Shipping Zones
  SHIPPING_ZONES: {
    WEST: ['Johor', 'Melaka', 'Negeri Sembilan', 'Selangor', 'W.P. Kuala Lumpur', 'W.P. Putrajaya', 'Perak', 'Pulau Pinang', 'Kedah', 'Perlis'],
    EAST: ['Kelantan', 'Terengganu', 'Pahang'],
    SABAH_SARAWAK: ['Sabah', 'Sarawak', 'W.P. Labuan']
  },
  
  // Shipping Duration (business days)
  SHIPPING_DURATION: {
    WEST: '2-4',
    EAST: '3-5',
    SABAH_SARAWAK: '4-7'
  }
};

// Helper Functions
const CONFIG_HELPERS = {
  /**
   * Get shipping duration for a state
   */
  getShippingDuration(state) {
    if (CONFIG.SHIPPING_ZONES.WEST.includes(state)) {
      return CONFIG.SHIPPING_DURATION.WEST;
    }
    if (CONFIG.SHIPPING_ZONES.EAST.includes(state)) {
      return CONFIG.SHIPPING_DURATION.EAST;
    }
    if (CONFIG.SHIPPING_ZONES.SABAH_SARAWAK.includes(state)) {
      return CONFIG.SHIPPING_DURATION.SABAH_SARAWAK;
    }
    return CONFIG.SHIPPING_DURATION.WEST; // Default
  },
  
  /**
   * Check if order qualifies for free shipping
   */
  isFreeShipping(total) {
    return total >= CONFIG.FREE_SHIPPING_THRESHOLD;
  },
  
  /**
   * Calculate shipping cost
   */
  getShippingCost(total) {
    return this.isFreeShipping(total) ? 0 : CONFIG.SHIPPING_COST;
  },
  
  /**
   * Check if cart qualifies for bundle offer
   */
  isBundleEligible(cart) {
    const count60ml = cart
      .filter(item => item.size === '60ml')
      .reduce((sum, item) => sum + item.qty, 0);
    return count60ml >= CONFIG.BUNDLE_THRESHOLD;
  },
  
  /**
   * Get bundle progress
   */
  getBundleProgress(cart) {
    const count60ml = cart
      .filter(item => item.size === '60ml')
      .reduce((sum, item) => sum + item.qty, 0);
    return {
      current: count60ml,
      needed: Math.max(0, CONFIG.BUNDLE_THRESHOLD - count60ml),
      eligible: count60ml >= CONFIG.BUNDLE_THRESHOLD
    };
  }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.PRICES);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG.FRAGRANCE_FAMILIES);
Object.freeze(CONFIG.STATES);
Object.freeze(CONFIG.SHIPPING_ZONES);
Object.freeze(CONFIG.SHIPPING_DURATION);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, CONFIG_HELPERS };
}

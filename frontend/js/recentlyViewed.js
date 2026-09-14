/**
 * recentlyViewed.js — Recently Viewed Products
 * Persists up to MAX_ITEMS product IDs in localStorage.
 * No server calls, no personal data stored.
 */

const RECENTLY_VIEWED_KEY = 'aroracart_recently_viewed';
const MAX_ITEMS = 10;

/**
 * Track a product view. Call this when a product detail page loads.
 * @param {string} productId
 */
const trackProductView = (productId) => {
  if (!productId) return;
  try {
    let viewed = getRecentlyViewedIds();
    // Remove if already present (to move it to front)
    viewed = viewed.filter(id => id !== String(productId));
    viewed.unshift(String(productId));
    // Keep only MAX_ITEMS
    viewed = viewed.slice(0, MAX_ITEMS);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(viewed));
  } catch (_) { /* localStorage may be unavailable in private mode */ }
};

/**
 * Get array of recently viewed product IDs (most recent first).
 * @returns {string[]}
 */
const getRecentlyViewedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch (_) { return []; }
};

/**
 * Clear the recently viewed list.
 */
const clearRecentlyViewed = () => {
  try { localStorage.removeItem(RECENTLY_VIEWED_KEY); } catch (_) {}
};

/**
 * Render a recently viewed products row.
 * Fetches product details for each stored ID and renders cards into containerId.
 * @param {string} containerId - DOM element ID to render into
 * @param {string|null} excludeId - Product ID to exclude (current product)
 */
const renderRecentlyViewed = async (containerId, excludeId = null) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  let ids = getRecentlyViewedIds();
  if (excludeId) ids = ids.filter(id => id !== String(excludeId));
  if (ids.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  // Fetch up to 6 products concurrently, ignore failures
  const productPromises = ids.slice(0, 6).map(id =>
    fetch(`/api/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => data?.product || null)
      .catch(() => null)
  );

  const products = (await Promise.all(productPromises)).filter(Boolean);

  if (products.length === 0) {
    container.style.display = 'none';
    return;
  }

  // Build HTML
  const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const discountPct = (orig, curr) => orig > curr ? Math.round((1 - curr / orig) * 100) : 0;

  container.innerHTML = `
    <section class="recently-viewed-section">
      <h3 class="section-heading">🕐 Recently Viewed</h3>
      <div class="recently-viewed-grid">
        ${products.map(p => {
          const discount = discountPct(p.originalPrice, p.price);
          const inStock = p.stock > 0;
          return `
            <a href="/product.html?id=${p._id}" class="rv-card" aria-label="View ${p.title}">
              <div class="rv-img-wrap">
                <img src="${p.image}" alt="${p.title}" loading="lazy" />
                ${discount > 0 ? `<span class="rv-badge">${discount}% OFF</span>` : ''}
              </div>
              <div class="rv-info">
                <p class="rv-title">${p.title}</p>
                <p class="rv-price">${formatINR(p.price)}</p>
                ${!inStock ? '<span class="rv-oos">Out of Stock</span>' : ''}
              </div>
            </a>`;
        }).join('')}
      </div>
    </section>`;
};

// Expose globally for use across pages
window.trackProductView = trackProductView;
window.getRecentlyViewedIds = getRecentlyViewedIds;
window.renderRecentlyViewed = renderRecentlyViewed;
window.clearRecentlyViewed = clearRecentlyViewed;

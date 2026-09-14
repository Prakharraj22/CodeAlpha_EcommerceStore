/**
 * AroraCart — Wishlist Page Controller (wishlist-page.js)
 * Manages wishlist rendering, total value calculation,
 * move-to-cart, and move-all-to-cart functionality.
 */

document.addEventListener('DOMContentLoaded', loadWishlistPage);

async function loadWishlistPage() {
  const container = document.getElementById('wishlist-page-container');
  if (!container) return;

  const wishlistIds = getWishlistItems();

  if (!wishlistIds || wishlistIds.length === 0) {
    renderEmptyWishlist(container);
    return;
  }

  container.innerHTML = `
    <div class="skeleton-order-card" aria-hidden="true">
      <div class="skeleton skeleton-text full" style="height:2rem;margin-bottom:1rem;"></div>
      <div class="product-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  `;

  try {
    // Fetch product details for each wishlist ID
    const promises = wishlistIds.map(id =>
      fetch(`/api/products/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.product || null)
        .catch(() => null)
    );

    const products = (await Promise.all(promises)).filter(Boolean);

    // Sync localStorage with genuinely found products to eliminate ghost badges
    const validIds = products.map(p => p._id);
    if (validIds.length !== wishlistIds.length) {
      localStorage.setItem('arora_wishlist', JSON.stringify(validIds));
      if (typeof updateWishlistUI === 'function') updateWishlistUI();
    }

    if (products.length === 0) {
      renderEmptyWishlist(container);
      return;
    }

    renderWishlistProducts(container, products);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" role="alert">
        <div class="empty-state-icon">⚠️</div>
        <h2>Unable to Load Wishlist</h2>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="loadWishlistPage()">Try Again</button>
      </div>
    `;
  }
}

function renderEmptyWishlist(container) {
  container.innerHTML = `
    <div class="empty-state" role="status">
      <div class="empty-state-icon">💖</div>
      <h1 class="empty-state-title">Your Wishlist is Empty</h1>
      <p class="empty-state-desc">
        Explore our curated collection of next-gen electronics, save your favorites, and track price drops!
      </p>
      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;margin-top:1rem;">
        <a href="/index.html" class="btn btn-primary">Discover Gadgets</a>
        <button class="btn btn-secondary" onclick="window.demoPopulateWishlist ? window.demoPopulateWishlist() : null">
          🚀 Seed Demo Wishlist
        </button>
      </div>
    </div>
  `;
}

function renderWishlistProducts(container, products) {
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  container.innerHTML = `
    <div class="wishlist-page-header">
      <div>
        <h1 class="page-heading" style="margin-bottom:0.25rem;">My Wishlist</h1>
        <p style="color:var(--text-muted);font-size:0.9rem;">
          ${products.length} saved item${products.length !== 1 ? 's' : ''} · Total value: <strong style="color:var(--accent-secondary);">${formatINR(totalValue)}</strong>
        </p>
      </div>
      <div class="wishlist-header-actions">
        <button class="btn btn-primary" onclick="moveAllWishlistToCart()" id="btn-move-all">
          ⚡ Move All to Cart
        </button>
        <button class="btn btn-outline btn-sm" onclick="clearAllWishlist()">
          🗑️ Clear All
        </button>
      </div>
    </div>

    <div class="product-grid" style="margin-top:1.5rem;">
      ${products.map(p => buildWishlistCard(p)).join('')}
    </div>
  `;
}

function buildWishlistCard(product) {
  const discountPct = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const inStock = product.stock > 0;
  const stockClass = inStock ? (product.stock < 6 ? 'stock-low' : 'stock-in') : 'stock-out';
  const stockText = inStock ? (product.stock < 6 ? `Only ${product.stock} left!` : 'In Stock') : 'Out of Stock';

  return `
    <article class="product-card" id="wishlist-card-${product._id}">
      <div class="product-img-wrapper">
        <a href="/product.html?id=${product._id}" aria-label="View ${product.title}">
          <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy" />
        </a>
        ${discountPct > 0 ? `<span class="discount-badge">${discountPct}% OFF</span>` : ''}
        <button
          class="wishlist-btn active"
          onclick="removeWishlistCard('${product._id}')"
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
        >✕</button>
      </div>

      <div class="product-info">
        <div class="product-meta-row">
          <span class="product-category">${product.category}</span>
          <span class="stock-badge ${stockClass}">${stockText}</span>
        </div>

        <h3 class="product-title">
          <a href="/product.html?id=${product._id}">${product.title}</a>
        </h3>

        <div class="price-row">
          <span class="current-price">${formatINR(product.price)}</span>
          ${product.originalPrice > product.price ? `<span class="original-price">${formatINR(product.originalPrice)}</span>` : ''}
        </div>

        <div style="display:flex;gap:0.5rem;margin-top:auto;padding-top:0.5rem;">
          <button
            class="btn btn-primary btn-sm"
            style="flex:1;"
            onclick="moveItemToCart('${product._id}')"
            ${!inStock ? 'disabled' : ''}
          >
            🛒 ${inStock ? 'Move to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </article>
  `;
}

async function moveItemToCart(productId) {
  try {
    const res = await fetchAPI(`/products/${productId}`);
    if (res.product) {
      addToCart(res.product, 1);
      // Remove from wishlist
      await toggleWishlistItem(productId);
      showToast('Moved to cart!', 'success');
      loadWishlistPage();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function moveAllWishlistToCart() {
  const wishlistIds = getWishlistItems();
  if (wishlistIds.length === 0) return;

  const btn = document.getElementById('btn-move-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Moving items...'; }

  let movedCount = 0;
  for (const id of wishlistIds) {
    try {
      const res = await fetch(`/api/products/${id}`).then(r => r.json());
      if (res?.product && res.product.stock > 0) {
        addToCart(res.product, 1);
        movedCount++;
      }
    } catch (_) {}
  }

  // Clear wishlist
  localStorage.setItem('arora_wishlist', JSON.stringify([]));
  updateWishlistUI();
  showToast(`Moved ${movedCount} items to your shopping cart!`, 'success');

  setTimeout(() => {
    window.location.href = '/cart.html';
  }, 600);
}

function removeWishlistCard(productId) {
  toggleWishlistItem(productId);
  const card = document.getElementById(`wishlist-card-${productId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    setTimeout(loadWishlistPage, 250);
  }
}

function clearAllWishlist() {
  if (!confirm('Clear all items from your wishlist?')) return;
  localStorage.setItem('arora_wishlist', JSON.stringify([]));
  updateWishlistUI();
  loadWishlistPage();
  showToast('Wishlist cleared', 'info');
}

// Global exports
window.moveItemToCart = moveItemToCart;
window.moveAllWishlistToCart = moveAllWishlistToCart;
window.removeWishlistCard = removeWishlistCard;
window.clearAllWishlist = clearAllWishlist;

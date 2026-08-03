/**
 * AroraCart — Main Catalog Controller (main.js)
 * Handles product listing, live search, category filters,
 * sorting, price range filtering, rating filter, and pagination.
 */

// ─── State ───────────────────────────────────────────────────
const PRODUCTS_PER_PAGE = 12;
let state = {
  allProducts: [],
  filteredProducts: [],
  currentPage: 1,
  currentCategory: 'All',
  currentSort: 'newest',
  searchQuery: '',
  minPrice: null,
  maxPrice: null,
  minRating: null,
};

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearchBox();
  initSortControl();
  initFilterPanel();
  loadProducts();
});

// ─── Data Fetching ────────────────────────────────────────────

/** Fetch products from API and populate state */
const loadProducts = async () => {
  showSkeletonGrid();

  try {
    const params = new URLSearchParams();
    if (state.currentCategory !== 'All') params.set('category', state.currentCategory);
    if (state.currentSort) params.set('sort', state.currentSort);
    if (state.searchQuery) params.set('search', state.searchQuery);

    const data = await fetchAPI(`/products?${params.toString()}`);
    state.allProducts = data.products || [];
    applyClientFilters();
    renderCategories(data.categories || []);
  } catch (err) {
    renderErrorState(err.message);
  }
};

/** Apply client-side price range and rating filters */
const applyClientFilters = () => {
  let result = [...state.allProducts];

  if (state.minPrice !== null) result = result.filter(p => p.price >= state.minPrice);
  if (state.maxPrice !== null) result = result.filter(p => p.price <= state.maxPrice);
  if (state.minRating !== null) result = result.filter(p => p.rating >= state.minRating);

  state.filteredProducts = result;
  state.currentPage = 1;
  renderProductGrid();
  renderPagination();
  renderResultsBar();
};

// ─── Render Functions ─────────────────────────────────────────

/** Render category pill buttons */
const renderCategories = (categories) => {
  const container = document.getElementById('categories-pills');
  if (!container) return;

  const allCats = ['All', ...categories];
  container.innerHTML = allCats
    .map(cat => `
      <button
        class="pill ${cat === state.currentCategory ? 'active' : ''}"
        onclick="selectCategory('${cat}')"
        role="listitem"
        aria-pressed="${cat === state.currentCategory}"
        aria-label="Filter by ${cat}"
      >
        ${cat}
      </button>
    `)
    .join('');
};

/** Render a page of products into the grid */
const renderProductGrid = () => {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const startIdx = (state.currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginated = state.filteredProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

  if (paginated.length === 0) {
    renderEmptyState(grid);
    return;
  }

  const wishlist = getWishlistItems();
  grid.innerHTML = paginated.map(product => buildProductCard(product, wishlist)).join('');
  updateWishlistUI();
};

/** Build a single product card HTML string */
const buildProductCard = (product, wishlist) => {
  const isWishlisted = wishlist.includes(product._id);
  const discountPct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  let stockClass = 'stock-in';
  let stockText = `In Stock (${product.stock})`;
  if (product.stock <= 0) { stockClass = 'stock-out'; stockText = 'Out of Stock'; }
  else if (product.stock < 6) { stockClass = 'stock-low'; stockText = `Only ${product.stock} left!`; }

  const stars = renderStars(product.rating);

  return `
    <article class="product-card" data-product-id="${product._id}">
      <div class="product-img-wrapper">
        <a href="/product.html?id=${product._id}" aria-label="View ${product.title} details">
          <img
            src="${product.image}"
            alt="${product.title}"
            class="product-img"
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'"
          />
        </a>
        ${discountPct > 0 ? `<span class="discount-badge">${discountPct}% OFF</span>` : ''}
        <button
          class="wishlist-btn ${isWishlisted ? 'active' : ''}"
          data-product-id="${product._id}"
          onclick="toggleWishlistItem('${product._id}')"
          aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
          aria-pressed="${isWishlisted}"
        >♥</button>
      </div>

      <div class="product-info">
        <div class="product-meta-row">
          <span class="product-category">${product.category}</span>
          <span class="stock-badge ${stockClass}">${stockText}</span>
        </div>

        <h3 class="product-title">
          <a href="/product.html?id=${product._id}">${product.title}</a>
        </h3>

        <div class="product-rating" aria-label="Rating: ${product.rating} out of 5">
          <span class="stars" aria-hidden="true">${stars}</span>
          <span class="rating-value">${product.rating.toFixed(1)}</span>
          <span class="rating-count">(${product.numReviews} reviews)</span>
        </div>

        <div class="price-row">
          <span class="current-price">${formatINR(product.price)}</span>
          ${product.originalPrice > product.price
            ? `<span class="original-price">${formatINR(product.originalPrice)}</span>`
            : ''}
        </div>

        <button
          class="btn btn-primary btn-add-cart"
          onclick="handleAddToCart('${product._id}')"
          ${product.stock <= 0 ? 'disabled aria-disabled="true"' : ''}
          aria-label="Add ${product.title} to cart"
        >
          ${product.stock <= 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </article>
  `;
};

/** Render star rating as HTML */
const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

/** Render empty / no-results state */
const renderEmptyState = (grid) => {
  grid.innerHTML = `
    <div class="empty-state" role="status">
      <div class="empty-state-icon">🔎</div>
      <h2 class="empty-state-title">No Products Found</h2>
      <p class="empty-state-desc">
        Try adjusting your search query, clearing category filters, or widening your price range.
      </p>
      <button class="btn btn-primary" onclick="resetAllFilters()">Clear All Filters</button>
    </div>
  `;
};

/** Render error state */
const renderErrorState = (message) => {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="empty-state" role="alert">
      <div class="empty-state-icon">⚠️</div>
      <h2 class="empty-state-title">Unable to Load Products</h2>
      <p class="empty-state-desc">${message}</p>
      <button class="btn btn-primary" onclick="loadProducts()">Try Again</button>
    </div>
  `;
};

/** Show skeleton loading grid */
const showSkeletonGrid = () => {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-text full"></div>
        <div class="skeleton skeleton-text medium"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `).join('');
};

/** Render results count and active filter chips */
const renderResultsBar = () => {
  const countEl = document.getElementById('results-count');
  const chipsEl = document.getElementById('active-filter-chips');
  if (countEl) {
    const total = state.filteredProducts.length;
    countEl.textContent = total > 0 ? `${total} product${total !== 1 ? 's' : ''} found` : '';
  }
  if (chipsEl) {
    const chips = [];
    if (state.currentCategory !== 'All') chips.push(`<span class="chip">📂 ${state.currentCategory} <button onclick="selectCategory('All')" aria-label="Remove category filter">✕</button></span>`);
    if (state.searchQuery) chips.push(`<span class="chip">🔍 "${state.searchQuery}" <button onclick="clearSearchFilter()" aria-label="Remove search filter">✕</button></span>`);
    if (state.minPrice || state.maxPrice) chips.push(`<span class="chip">💰 ₹${state.minPrice || '0'} – ₹${state.maxPrice || '∞'} <button onclick="clearPriceFilter()" aria-label="Remove price filter">✕</button></span>`);
    chipsEl.innerHTML = chips.join('');
  }
};

/** Render pagination controls */
const renderPagination = () => {
  const wrapper = document.getElementById('pagination-wrapper');
  const indicator = document.getElementById('page-indicator');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');

  if (!wrapper) return;

  const totalPages = Math.ceil(state.filteredProducts.length / PRODUCTS_PER_PAGE);
  if (totalPages <= 1) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;
  if (indicator) indicator.textContent = `Page ${state.currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = state.currentPage === 1;
  if (nextBtn) nextBtn.disabled = state.currentPage === totalPages;
};

// ─── Interactions ──────────────────────────────────────────────

/** Select a category pill */
const selectCategory = (cat) => {
  state.currentCategory = cat;
  state.currentPage = 1;
  loadProducts();
};

/** Add a product to cart (fetches latest data from API) */
const handleAddToCart = async (productId) => {
  const btn = document.querySelector(`[onclick="handleAddToCart('${productId}')"]`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Adding…'; }

  try {
    const res = await fetchAPI(`/products/${productId}`);
    if (res.product) addToCart(res.product, 1);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🛒 Add to Cart'; }
  }
};

/** Clear all active filters and reload */
const resetAllFilters = () => {
  state.currentCategory = 'All';
  state.searchQuery = '';
  state.minPrice = null;
  state.maxPrice = null;
  state.minRating = null;
  state.currentSort = 'newest';
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'newest';
  if (minPriceInput) minPriceInput.value = '';
  if (maxPriceInput) maxPriceInput.value = '';
  loadProducts();
};

const clearSearchFilter = () => {
  state.searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  loadProducts();
};

const clearPriceFilter = () => {
  state.minPrice = null;
  state.maxPrice = null;
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  if (minPriceInput) minPriceInput.value = '';
  if (maxPriceInput) maxPriceInput.value = '';
  applyClientFilters();
};

// ─── Init Helpers ──────────────────────────────────────────────

/** Wire up search input with debounce */
const initSearchBox = () => {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = state.searchQuery ? 'flex' : 'none';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadProducts, 350);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearBtn.style.display = 'none';
      loadProducts();
      searchInput.focus();
    });
  }
};

/** Wire up sort select */
const initSortControl = () => {
  const sortSelect = document.getElementById('sort-select');
  if (!sortSelect) return;
  sortSelect.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    loadProducts();
  });
};

/** Wire up advanced filter panel toggle and controls */
const initFilterPanel = () => {
  const toggleBtn = document.getElementById('toggle-filters-btn');
  const panel = document.getElementById('advanced-filters-panel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      panel.setAttribute('aria-hidden', String(!isHidden));
      toggleBtn.setAttribute('aria-expanded', String(isHidden));
      toggleBtn.classList.toggle('active', isHidden);
    });
  }

  const applyPriceBtn = document.getElementById('apply-price-btn');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      const minVal = parseFloat(document.getElementById('min-price')?.value);
      const maxVal = parseFloat(document.getElementById('max-price')?.value);
      state.minPrice = isNaN(minVal) ? null : minVal;
      state.maxPrice = isNaN(maxVal) ? null : maxVal;
      applyClientFilters();
    });
  }

  document.querySelectorAll('input[name="min-rating"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      state.minRating = isNaN(val) ? null : val;
      applyClientFilters();
    });
  });

  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);

  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderProductGrid();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(state.filteredProducts.length / PRODUCTS_PER_PAGE);
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderProductGrid();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
};

/** Wire up hamburger mobile menu */
const initMobileMenu = () => {
  const btn = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    drawer.setAttribute('aria-hidden', String(isOpen));
    btn.classList.toggle('open', !isOpen);
    drawer.classList.toggle('open', !isOpen);
  });
};

// ─── Global Exports ────────────────────────────────────────────
window.selectCategory = selectCategory;
window.handleAddToCart = handleAddToCart;
window.resetAllFilters = resetAllFilters;
window.clearSearchFilter = clearSearchFilter;
window.clearPriceFilter = clearPriceFilter;

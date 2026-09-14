/**
 * AroraCart — Main Catalog Controller (main.js)
 * Handles product listing, live search, category filters,
 * sorting, price range filtering, rating filter, and pagination.
 */

// ─── State ───────────────────────────────────────────────────
const PRODUCTS_PER_PAGE = 12;
let compareList = [];
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
  initGlobalKeyboard();
  updateMobileDockBadges();
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

        <div class="card-quick-actions">
          <button class="btn-card-action" onclick="openQuickView('${product._id}')" title="Preview specs">
            👁️ Quick View
          </button>
          <button
            class="btn-card-action ${compareList.includes(product._id) ? 'compare-active' : ''}"
            onclick="toggleCompareProduct('${product._id}', this)"
            title="Compare with other gadgets"
          >
            ⇄ ${compareList.includes(product._id) ? 'Comparing' : 'Compare'}
          </button>
        </div>
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
    if (state.minPrice !== null || state.maxPrice !== null) {
      const minText = typeof formatINR === 'function' ? formatINR(state.minPrice || 5000) : `₹${state.minPrice || 5000}`;
      const maxText = state.maxPrice ? (typeof formatINR === 'function' ? formatINR(state.maxPrice) : `₹${state.maxPrice}`) : 'Above';
      chips.push(`<span class="chip">💰 ${minText} – ${maxText} <button onclick="clearPriceFilter()" aria-label="Remove price filter">✕</button></span>`);
    }
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
  const user = typeof getAuthUser === 'function' ? getAuthUser() : JSON.parse(localStorage.getItem('arora_user') || 'null');
  if (!user) {
    const prod = (state.products || []).find(p => p._id === productId);
    if (typeof showAuthPromptModal === 'function') {
      showAuthPromptModal(prod || { _id: productId, title: 'this item' });
    } else {
      showToast('🔒 Please sign in before adding items to your cart!', 'warning');
      setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 900);
    }
    return;
  }

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

/** Wire up search input with debounce & live autocomplete dropdown */
const initSearchBox = () => {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const dropdown = document.getElementById('search-suggestions-dropdown');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = state.searchQuery ? 'flex' : 'none';

    // Live autocomplete dropdown
    if (dropdown) {
      if (state.searchQuery.length >= 2) {
        const query = state.searchQuery.toLowerCase();
        const matches = state.allProducts.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query))
        ).slice(0, 4);

        if (matches.length > 0) {
          dropdown.innerHTML = matches.map(p => `
            <a href="/product.html?id=${p._id}" class="suggestion-item">
              <img src="${p.image}" alt="${p.title}" class="suggestion-thumb" />
              <div class="suggestion-info">
                <div class="suggestion-title">${p.title}</div>
                <div class="suggestion-meta">
                  <span>${p.category}</span>
                  <span>·</span>
                  <span>⭐ ${p.rating}</span>
                </div>
              </div>
              <div class="suggestion-price">${formatINR(p.price)}</div>
            </a>
          `).join('') + `
            <div class="suggestion-footer" onclick="loadProducts(); document.getElementById('search-suggestions-dropdown')?.classList.remove('open');">
              View all results for "<strong>${state.searchQuery}</strong>" →
            </div>
          `;
          dropdown.classList.add('open');
        } else {
          dropdown.innerHTML = `
            <div style="padding:0.75rem 1rem;font-size:0.82rem;color:var(--text-muted);text-align:center;">
              No matching gadgets found for "${state.searchQuery}"
            </div>
          `;
          dropdown.classList.add('open');
        }
      } else {
        dropdown.classList.remove('open');
      }
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadProducts, 350);
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown?.contains(e.target)) {
      dropdown?.classList.remove('open');
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearBtn.style.display = 'none';
      dropdown?.classList.remove('open');
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
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');

  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      const minRaw = minPriceInput?.value.trim();
      const maxRaw = maxPriceInput?.value.trim();

      // If user left both inputs empty, do not apply filter
      if (!minRaw && !maxRaw) {
        state.minPrice = null;
        state.maxPrice = null;
        applyClientFilters();
        if (typeof showToast === 'function') {
          showToast('Price filter cleared (showing all products)', 'info');
        }
        return;
      }

      let minVal = minRaw ? parseFloat(minRaw) : null;
      let maxVal = maxRaw ? parseFloat(maxRaw) : null;

      // Min: starts at 0 or whatever user entered, in increments of 250
      if (minVal !== null && !isNaN(minVal)) {
        minVal = Math.max(0, minVal);
        minVal = Math.round(minVal / 250) * 250;
        if (minPriceInput) minPriceInput.value = minVal;
      } else {
        minVal = null;
      }

      // Max: starts at 5000 and increments by 250
      if (maxVal !== null && !isNaN(maxVal)) {
        if (maxVal < 5000) maxVal = 5000;
        else maxVal = 5000 + Math.round((maxVal - 5000) / 250) * 250;

        // Ensure difference of at least 250 Rs if min is set
        if (minVal !== null && maxVal < minVal + 250) {
          maxVal = minVal + 250;
        }

        if (maxPriceInput) maxPriceInput.value = maxVal;
      } else {
        maxVal = null;
      }

      state.minPrice = minVal;
      state.maxPrice = maxVal;
      applyClientFilters();

      if (typeof showToast === 'function') {
        const minStr = minVal !== null ? (typeof formatINR === 'function' ? formatINR(minVal) : `₹${minVal}`) : '₹0';
        const maxStr = maxVal !== null ? (typeof formatINR === 'function' ? formatINR(maxVal) : `₹${maxVal}`) : 'Above';
        showToast(`💰 Price filter: ${minStr} – ${maxStr}`, 'info');
      }
    });
  }

  // Allow pressing Enter in price inputs
  [minPriceInput, maxPriceInput].forEach(input => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyPriceBtn?.click();
        }
      });
    }
  });

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

// ─── Quick View Modal ─────────────────────────────────────────
const openQuickView = async (productId) => {
  const modal = document.getElementById('glass-modal-backdrop');
  const body = document.getElementById('glass-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="padding:2rem;text-align:center;color:var(--text-muted);">
      <div class="skeleton-detail-img" style="height:250px;margin-bottom:1rem;"></div>
      <p>Loading gadget specs…</p>
    </div>
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  try {
    const data = await fetchAPI(`/products/${productId}`);
    const p = data.product;
    if (!p) throw new Error('Product not found');

    const discountPct = p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;align-items:start;">
        <div style="position:relative;border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-surface);">
          <img src="${p.image}" alt="${p.title}" style="width:100%;height:320px;object-fit:cover;" />
          ${discountPct > 0 ? `<span class="discount-badge large">${discountPct}% OFF</span>` : ''}
        </div>

        <div>
          <span class="product-category">${p.category} · ${p.brand || 'AroraCart'}</span>
          <h2 style="font-size:1.4rem;font-weight:700;margin:0.4rem 0 0.8rem;color:#f1f5f9;">${p.title}</h2>

          <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem;">
            <span style="color:var(--accent-warning);font-size:0.95rem;">${renderStars(p.rating)}</span>
            <span style="font-weight:700;font-size:0.9rem;">${p.rating.toFixed(1)}</span>
            <span style="color:var(--text-dim);font-size:0.8rem;">(${p.numReviews} reviews)</span>
            <span class="stock-badge ${p.stock > 0 ? 'stock-in' : 'stock-out'}">${p.stock > 0 ? 'In Stock (' + p.stock + ')' : 'Out of Stock'}</span>
          </div>

          <div class="price-row" style="margin-bottom:1rem;">
            <span class="current-price" style="font-size:1.4rem;">${formatINR(p.price)}</span>
            ${p.originalPrice > p.price ? `<span class="original-price" style="font-size:1rem;">${formatINR(p.originalPrice)}</span>` : ''}
            ${discountPct > 0 ? `<span class="save-badge">Save ${formatINR(p.originalPrice - p.price)}</span>` : ''}
          </div>

          <p style="color:var(--text-muted);font-size:0.88rem;line-height:1.6;margin-bottom:1.25rem;">
            ${p.description}
          </p>

          ${p.specifications && p.specifications.length > 0 ? `
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);padding:0.75rem 1rem;margin-bottom:1.5rem;">
              <div style="font-size:0.8rem;font-weight:700;color:#38bdf8;text-transform:uppercase;margin-bottom:0.4rem;">Key Highlights</div>
              <ul style="list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;font-size:0.8rem;color:#cbd5e1;">
                ${p.specifications.slice(0, 4).map(s => `<li><strong>${s.key}:</strong> ${s.value}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="display:flex;gap:0.75rem;">
            <button class="btn btn-primary" style="flex:1;" onclick="handleAddToCart('${p._id}'); closeGlassModal();" ${p.stock <= 0 ? 'disabled' : ''}>
              🛒 ${p.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <a href="/product.html?id=${p._id}" class="btn btn-secondary">
              Full Page →
            </a>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div style="text-align:center;color:#f87171;padding:2rem;">Failed to load gadget details: ${err.message}</div>`;
  }
};

const closeGlassModal = () => {
  const modal = document.getElementById('glass-modal-backdrop');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
};

// ─── Product Comparison Engine ────────────────────────────────
const toggleCompareProduct = (productId, btn) => {
  const idx = compareList.indexOf(productId);
  if (idx > -1) {
    compareList.splice(idx, 1);
    if (btn) {
      btn.classList.remove('compare-active');
      btn.innerHTML = '⇄ Compare';
    }
  } else {
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 gadgets at a time.', 'info');
      return;
    }
    compareList.push(productId);
    if (btn) {
      btn.classList.add('compare-active');
      btn.innerHTML = '⇄ Comparing';
    }
    showToast('Added to comparison tray!', 'success');
  }
  renderCompareTray();
};

const renderCompareTray = () => {
  const tray = document.getElementById('compare-floating-tray');
  const countEl = document.getElementById('compare-count');
  const thumbsContainer = document.getElementById('compare-tray-thumbs');
  if (!tray || !countEl || !thumbsContainer) return;

  countEl.textContent = compareList.length;

  if (compareList.length === 0) {
    tray.classList.remove('visible');
    return;
  }

  const comparedProducts = state.allProducts.filter(p => compareList.includes(p._id));
  thumbsContainer.innerHTML = comparedProducts.map(p => `
    <div class="compare-thumb-box" title="${p.title}">
      <img src="${p.image}" alt="${p.title}" />
      <button class="compare-remove-btn" onclick="removeFromCompare('${p._id}')" aria-label="Remove from compare">✕</button>
    </div>
  `).join('');

  tray.classList.add('visible');
};

const removeFromCompare = (productId) => {
  const idx = compareList.indexOf(productId);
  if (idx > -1) compareList.splice(idx, 1);
  renderCompareTray();
  renderProductGrid();
};

const clearComparison = () => {
  compareList = [];
  renderCompareTray();
  renderProductGrid();
};

const openCompareModal = async () => {
  if (compareList.length < 2) {
    showToast('Please select at least 2 gadgets to compare.', 'info');
    return;
  }

  const modal = document.getElementById('glass-modal-backdrop');
  const body = document.getElementById('glass-modal-body');
  if (!modal || !body) return;

  const prods = state.allProducts.filter(p => compareList.includes(p._id));

  body.innerHTML = `
    <div style="margin-bottom:1.25rem;">
      <span class="recruiter-brand-badge">GADGET COMPARISON</span>
      <h2 style="color:#f1f5f9;font-size:1.4rem;">Side-by-Side Specifications</h2>
    </div>

    <div style="overflow-x:auto;">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            ${prods.map(p => `
              <th>
                <div style="width:70px;height:70px;margin:0 auto 0.5rem;border-radius:var(--radius-xs);overflow:hidden;">
                  <img src="${p.image}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <div style="font-size:0.85rem;font-weight:700;color:#f1f5f9;margin-bottom:0.25rem;">${p.title}</div>
                <div style="font-size:0.95rem;color:#38bdf8;font-weight:700;">${formatINR(p.price)}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Category</th>
            ${prods.map(p => `<td>${p.category}</td>`).join('')}
          </tr>
          <tr>
            <th>Brand</th>
            ${prods.map(p => `<td>${p.brand || 'AroraCart'}</td>`).join('')}
          </tr>
          <tr>
            <th>Customer Rating</th>
            ${prods.map(p => `<td>⭐ ${p.rating.toFixed(1)} (${p.numReviews} reviews)</td>`).join('')}
          </tr>
          <tr>
            <th>Stock Status</th>
            ${prods.map(p => `<td><span class="stock-badge ${p.stock > 0 ? 'stock-in' : 'stock-out'}">${p.stock > 0 ? p.stock + ' in stock' : 'Out of Stock'}</span></td>`).join('')}
          </tr>
          <tr>
            <th>Action</th>
            ${prods.map(p => `
              <td>
                <button class="btn btn-primary btn-sm" onclick="handleAddToCart('${p._id}'); closeGlassModal();" ${p.stock <= 0 ? 'disabled' : ''}>
                  🛒 Add to Cart
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
};

// ─── Keyboard Shortcuts & Accessibility ───────────────────────
const initGlobalKeyboard = () => {
  document.addEventListener('keydown', (e) => {
    // '/' key focuses search bar when not already typing
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const search = document.getElementById('search-input');
      if (search) {
        search.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    // Escape key closes modals
    if (e.key === 'Escape') {
      closeGlassModal();
      document.getElementById('search-suggestions-dropdown')?.classList.remove('open');
    }
  });
};

// ─── Mobile Dock Badges ───────────────────────────────────────
const updateMobileDockBadges = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('aroracart_cart') || '[]');
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartBadge = document.getElementById('dock-cart-badge');
    if (cartBadge) {
      cartBadge.textContent = totalQty;
      cartBadge.style.display = totalQty > 0 ? 'block' : 'none';
    }

    const wishlist = JSON.parse(localStorage.getItem('arora_wishlist') || '[]');
    const wishBadge = document.getElementById('dock-wishlist-badge');
    if (wishBadge) {
      wishBadge.textContent = wishlist.length;
      wishBadge.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
  } catch (_) {}
};

// ─── Price Preset Helper ───────────────────────────────────────
const setPricePreset = (min, max) => {
  const minInput = document.getElementById('min-price');
  const maxInput = document.getElementById('max-price');

  const effectiveMin = min !== null && min !== undefined ? min : null;
  const effectiveMax = max !== null && max !== undefined ? max : null;

  if (minInput) minInput.value = effectiveMin !== null && effectiveMin !== 0 ? effectiveMin : (effectiveMin === 0 ? '0' : '');
  if (maxInput) maxInput.value = effectiveMax !== null ? effectiveMax : '';

  state.minPrice = effectiveMin;
  state.maxPrice = effectiveMax;
  applyClientFilters();

  if (typeof showToast === 'function') {
    const minStr = effectiveMin !== null ? (typeof formatINR === 'function' ? formatINR(effectiveMin) : `₹${effectiveMin}`) : '₹0';
    const maxStr = effectiveMax !== null ? (typeof formatINR === 'function' ? formatINR(effectiveMax) : `₹${effectiveMax}`) : 'Above';
    showToast(`💰 Price preset: ${minStr} – ${maxStr}`, 'info');
  }
};

// ─── Global Exports ────────────────────────────────────────────
window.selectCategory = selectCategory;
window.handleAddToCart = handleAddToCart;
window.resetAllFilters = resetAllFilters;
window.clearSearchFilter = clearSearchFilter;
window.clearPriceFilter = clearPriceFilter;
window.setPricePreset = setPricePreset;
window.openQuickView = openQuickView;
window.closeGlassModal = closeGlassModal;
window.toggleCompareProduct = toggleCompareProduct;
window.removeFromCompare = removeFromCompare;
window.clearComparison = clearComparison;
window.openCompareModal = openCompareModal;
window.updateMobileDockBadges = updateMobileDockBadges;



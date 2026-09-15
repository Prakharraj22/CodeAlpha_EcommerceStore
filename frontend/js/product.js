/**
 * AroraCart — Product Detail Controller (product.js)
 * Handles product details view, quantity selector,
 * customer reviews, and related products section.
 */

let currentProduct = null;
let detailQty = 1;

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadProductDetails);

// ─── Data Fetching ────────────────────────────────────────────

/** Load full product details and reviews from API */
const loadProductDetails = async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = '/index.html';
    return;
  }

  showDetailSkeleton();

  try {
    const data = await fetchAPI(`/products/${productId}`);
    currentProduct = data.product;
    renderProductDetail(data.product, data.reviews || []);
    initStickyBuyBar(data.product);
    loadRelatedProducts(data.product.category, productId);
    updatePageMeta(data.product);

    // Track this product view and show recently viewed row
    if (typeof trackProductView === 'function') {
      trackProductView(productId);
      renderRecentlyViewed('recently-viewed-container', productId);
    }
  } catch (err) {
    renderDetailError(err.message);
  }
};

/** Load related products from the same category */
const loadRelatedProducts = async (category, excludeId) => {
  try {
    const data = await fetchAPI(`/products?category=${encodeURIComponent(category)}`);
    const related = (data.products || []).filter(p => p._id !== excludeId).slice(0, 4);
    if (related.length > 0) renderRelatedProducts(related);
  } catch {
    // silently fail — related products are non-critical
  }
};

// ─── Render Functions ─────────────────────────────────────────

/** Render the full product detail view */
const renderProductDetail = (product, reviews) => {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const wishlist = getWishlistItems();
  const isWishlisted = wishlist.includes(product._id);
  const discountPct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  let stockClass = 'stock-in', stockText = `In Stock (${product.stock} units available)`;
  if (product.stock <= 0) { stockClass = 'stock-out'; stockText = 'Out of Stock'; }
  else if (product.stock < 6) { stockClass = 'stock-low'; stockText = `⚠️ Low Stock — Only ${product.stock} left!`; }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating.toFixed(1);

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/index.html">Store</a>
      <span aria-hidden="true"> › </span>
      <a href="/index.html?category=${encodeURIComponent(product.category)}">${product.category}</a>
      <span aria-hidden="true"> › </span>
      <span aria-current="page">${product.title}</span>
    </nav>

    <!-- Product Detail Grid -->
    <div class="product-detail-grid">

      <!-- Left: Image Column -->
      <div class="product-detail-image-col">
        <div class="product-detail-img-wrapper">
          <img
            src="${product.image}"
            alt="${product.title}"
            class="product-detail-img"
            onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'"
          />
          ${discountPct > 0 ? `<span class="discount-badge large">${discountPct}% OFF</span>` : ''}
          <button
            class="wishlist-btn detail-wishlist-btn ${isWishlisted ? 'active' : ''}"
            data-product-id="${product._id}"
            onclick="toggleWishlistItem('${product._id}')"
            aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
            aria-pressed="${isWishlisted}"
          >♥</button>
        </div>
      </div>

      <!-- Right: Details Column -->
      <div class="product-detail-info-col">
        <div class="product-meta-row">
          <span class="product-category">${product.category} · ${product.brand}</span>
          ${product.isFeatured ? '<span class="featured-badge">Featured</span>' : ''}
        </div>

        <div style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.75rem;font-weight:600;color:var(--semantic-warning);background:var(--bg-surface-2);border:1px solid var(--border-subtle);padding:0.25rem 0.65rem;border-radius:var(--radius-full);margin-bottom:0.5rem;">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--semantic-warning);box-shadow:0 0 8px var(--semantic-warning);"></span>
          <strong>High Demand:</strong> 8 tech enthusiasts viewing right now
        </div>

        <h1 class="product-detail-title">${product.title}</h1>

        <!-- Rating Summary -->
        <div class="detail-rating-row" aria-label="Average rating: ${avgRating} out of 5">
          <span class="detail-stars" aria-hidden="true">${renderStarsFull(parseFloat(avgRating))}</span>
          <span class="detail-rating-value">${avgRating}</span>
          <span class="detail-rating-count">(${reviews.length} verified review${reviews.length !== 1 ? 's' : ''})</span>
          <span class="stock-badge ${stockClass}" style="margin-left: 1rem;">${stockText}</span>
        </div>

        <!-- Pricing -->
        <div class="price-row detail-price-row">
          <span class="current-price detail-current-price">${formatINR(product.price)}</span>
          ${product.originalPrice > product.price
            ? `<span class="original-price">${formatINR(product.originalPrice)}</span>
               <span class="save-badge">Save ${formatINR(product.originalPrice - product.price)}</span>`
            : ''}
        </div>

        <div style="margin: 0.5rem 0 0.8rem;">
          <button type="button" class="btn-emi-link" onclick="openEmiModal(${product.price})">
            EMI from ₹${Math.round(product.price / 12).toLocaleString('en-IN')}/mo · Bank Offers &amp; Cashbacks →
          </button>
        </div>

        <!-- Description -->
        <p class="product-detail-desc">${product.description}</p>

        <!-- Delivery Pincode Estimator -->
        <div class="pincode-estimator-card">
          <div class="pincode-estimator-title">
            Check Express Delivery Availability
          </div>
          <div class="pincode-input-row">
            <input type="text" id="pincode-input" class="form-control pincode-input" placeholder="Enter 6-digit Pincode" maxlength="6" />
            <button class="btn btn-outline btn-sm" onclick="checkPincodeDelivery()">Check</button>
          </div>
          <div id="pincode-result" class="pincode-result"></div>
        </div>

        <!-- Specifications -->
        ${product.specifications && product.specifications.length > 0 ? `
          <div class="specs-card">
            <h3 class="specs-title">Key Specifications</h3>
            <ul class="specs-list">
              ${product.specifications.map(spec => `
                <li class="spec-row">
                  <span class="spec-key">${spec.key}</span>
                  <span class="spec-value">${spec.value}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Quantity Selector + Actions -->
        <div class="detail-actions">
          <div class="qty-selector" aria-label="Quantity selector">
            <button
              class="qty-btn"
              onclick="changeDetailQty(-1)"
              aria-label="Decrease quantity"
              ${detailQty <= 1 ? 'disabled' : ''}
            >−</button>
            <span id="detail-qty" class="qty-value" aria-live="polite">${detailQty}</span>
            <button
              class="qty-btn"
              onclick="changeDetailQty(1)"
              aria-label="Increase quantity"
              ${product.stock <= 0 || detailQty >= product.stock ? 'disabled' : ''}
            >+</button>
          </div>

          <div class="action-buttons">
            <button
              class="btn btn-primary btn-add-cart-detail"
              id="add-to-cart-detail-btn"
              onclick="addDetailToCart()"
              ${product.stock <= 0 ? 'disabled' : ''}
              aria-label="Add to cart"
            >
              Add to Cart
            </button>
            <button
              class="btn btn-outline"
              onclick="toggleWishlistItem('${product._id}')"
              aria-label="Add to wishlist"
            >
              ♥ Wishlist
            </button>
            <button
              type="button"
              class="btn btn-outline"
              onclick="shareProduct('${product.title.replace(/'/g, "\\'")}')"
              aria-label="Share product"
            >
              Share
            </button>
          </div>
        </div>

        <!-- Shipping & Guarantee Info -->
        <div class="shipping-info-card">
          <div class="shipping-row" onclick="openInfoModal('dispatch')" style="cursor:pointer;" title="Click for Shipping details">
            <span class="shipping-icon">🚚</span> <strong>Free Shipping</strong> on orders over ₹1,999 <span style="color:var(--text-secondary);font-size:0.75rem;margin-left:auto;">Details →</span>
          </div>
          <div class="shipping-row" onclick="openInfoModal('replacement')" style="cursor:pointer;" title="Click for Returns details">
            <span class="shipping-icon">🔄</span> <strong>7-Day Returns</strong> — No questions asked <span style="color:var(--text-secondary);font-size:0.75rem;margin-left:auto;">Details →</span>
          </div>
          <div class="shipping-row" onclick="openInfoModal('warranty')" style="cursor:pointer;" title="Click for Warranty details">
            <span class="shipping-icon">🛡️</span> <strong>1-Year Brand Warranty</strong> — 100% authentic <span style="color:var(--text-secondary);font-size:0.75rem;margin-left:auto;">Details →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Reviews Section ─── -->
    <section class="reviews-section" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" class="section-heading">Customer Reviews & Ratings</h2>

      <div class="reviews-grid">
        <!-- Review Form -->
        <div class="review-form-card">
          <h3 class="review-form-title">Write Your Review</h3>
          <form id="review-form" onsubmit="submitReview(event)" novalidate>
            <div class="form-group">
              <label class="form-label" for="review-rating">Your Rating</label>
              <div class="star-select-row" id="star-select-row" role="radiogroup" aria-label="Select rating">
                ${[5,4,3,2,1].map(n => `
                  <label class="star-select-option ${n === 5 ? 'selected' : ''}" data-value="${n}" title="${n} star${n !== 1 ? 's' : ''}">
                    <input type="radio" name="review-rating-radio" value="${n}" ${n === 5 ? 'checked' : ''} class="sr-only" />
                    ★
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="review-comment">Your Review</label>
              <textarea
                id="review-comment"
                class="form-control"
                rows="4"
                placeholder="What did you love or dislike about this product? (minimum 20 characters)"
                required
                minlength="20"
              ></textarea>
              <span class="char-count" id="review-char-count">0 / 500 characters</span>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;" id="submit-review-btn">
              Submit Review
            </button>
          </form>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list-col">
          ${reviews.length === 0
            ? `<div class="empty-state small-empty">
                <div class="empty-state-icon">💬</div>
                <p>No reviews yet. Be the first to share your thoughts!</p>
              </div>`
            : reviews.map(rev => `
              <article class="review-card">
                <div class="review-header">
                  <div class="reviewer-avatar">${rev.userName.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong class="reviewer-name">${rev.userName}</strong>
                    <div class="review-rating" aria-label="Rated ${rev.rating} out of 5">
                      <span class="review-stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</span>
                      <span class="review-score">${rev.rating}.0</span>
                    </div>
                  </div>
                  <time class="review-date" datetime="${rev.createdAt}">
                    ${new Date(rev.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </time>
                </div>
                <p class="review-body">${rev.comment}</p>
              </article>
            `).join('')}
        </div>
      </div>
    </section>

    <!-- Related Products Section (populated separately) -->
    <section id="related-products-section" class="related-section" aria-labelledby="related-heading" hidden>
      <h2 id="related-heading" class="section-heading">You Might Also Like</h2>
      <div id="related-products-grid" class="product-grid related-grid"></div>
    </section>
  `;

  // Wire up character counter and star select UI
  wireReviewForm();
  updateWishlistUI();
};

/** Render related products */
const renderRelatedProducts = (products) => {
  const section = document.getElementById('related-products-section');
  const grid = document.getElementById('related-products-grid');
  if (!section || !grid) return;

  const wishlist = getWishlistItems();
  grid.innerHTML = products.map(p => buildRelatedCard(p, wishlist)).join('');
  section.hidden = false;
};

/** Build a compact related product card */
const buildRelatedCard = (product, wishlist) => {
  const isWishlisted = wishlist.includes(product._id);
  return `
    <article class="product-card">
      <div class="product-img-wrapper">
        <a href="/product.html?id=${product._id}">
          <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy" />
        </a>
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-product-id="${product._id}"
                onclick="toggleWishlistItem('${product._id}')" aria-label="Wishlist">♥</button>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-title"><a href="/product.html?id=${product._id}">${product.title}</a></h3>
        <div class="price-row">
          <span class="current-price">${formatINR(product.price)}</span>
          ${product.originalPrice > product.price ? `<span class="original-price">${formatINR(product.originalPrice)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-add-cart" onclick="handleRelatedAddToCart('${product._id}')"
                ${product.stock <= 0 ? 'disabled' : ''}>
          🛒 Add to Cart
        </button>
      </div>
    </article>
  `;
};

/** Render star icons for a given rating value */
const renderStarsFull = (rating) => {
  let result = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) result += '<span class="star full">★</span>';
    else if (rating >= i - 0.5) result += '<span class="star half">★</span>';
    else result += '<span class="star empty">☆</span>';
  }
  return result;
};

/** Show skeleton loader for product detail page */
const showDetailSkeleton = () => {
  const container = document.getElementById('product-detail-container');
  if (!container) return;
  container.innerHTML = `
    <div class="product-detail-grid" aria-hidden="true">
      <div class="skeleton skeleton-detail-img"></div>
      <div>
        <div class="skeleton skeleton-text short" style="margin-bottom:1rem;"></div>
        <div class="skeleton skeleton-text full" style="height:2rem;margin-bottom:1rem;"></div>
        <div class="skeleton skeleton-text medium" style="margin-bottom:0.75rem;"></div>
        <div class="skeleton skeleton-text short" style="height:2.5rem;margin-bottom:1rem;"></div>
        <div class="skeleton skeleton-text full" style="margin-bottom:0.5rem;"></div>
        <div class="skeleton skeleton-text full" style="margin-bottom:0.5rem;"></div>
        <div class="skeleton skeleton-btn" style="margin-top:2rem;"></div>
      </div>
    </div>
  `;
};

/** Render error state for product detail */
const renderDetailError = (message) => {
  const container = document.getElementById('product-detail-container');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state" role="alert">
      <div class="empty-state-icon">⚠️</div>
      <h2>Product Not Found</h2>
      <p>${message}</p>
      <a href="/index.html" class="btn btn-primary">← Back to Catalog</a>
    </div>
  `;
};

/** Update page title and meta for the current product */
const updatePageMeta = (product) => {
  document.title = `${product.title} — AroraCart`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = `Buy ${product.title} at ${formatINR(product.price)}. ${product.description.substring(0, 120)}`;
};

// ─── Interactions ──────────────────────────────────────────────

/** Increase or decrease product quantity */
const changeDetailQty = (delta) => {
  if (!currentProduct) return;
  detailQty = Math.max(1, Math.min(currentProduct.stock, detailQty + delta));
  const el = document.getElementById('detail-qty');
  if (el) el.textContent = detailQty;
};

/** Add current product to cart */
const addDetailToCart = () => {
  if (!currentProduct || currentProduct.stock <= 0) return;
  const user = typeof getAuthUser === 'function' ? getAuthUser() : JSON.parse(localStorage.getItem('arora_user') || 'null');
  if (!user) {
    if (typeof showAuthPromptModal === 'function') {
      showAuthPromptModal(currentProduct);
    } else {
      showToast('🔒 Please sign in before adding items to your cart!', 'warning');
      setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 900);
    }
    return;
  }
  addToCart(currentProduct, detailQty);
};

/** Add a related product to cart */
const handleRelatedAddToCart = async (productId) => {
  const user = typeof getAuthUser === 'function' ? getAuthUser() : JSON.parse(localStorage.getItem('arora_user') || 'null');
  if (!user) {
    if (typeof showAuthPromptModal === 'function') {
      showAuthPromptModal({ _id: productId, title: 'this item' });
    } else {
      showToast('🔒 Please sign in before adding items to your cart!', 'warning');
      setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 900);
    }
    return;
  }
  try {
    const res = await fetchAPI(`/products/${productId}`);
    if (res.product) addToCart(res.product, 1);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/** Submit a product review */
const submitReview = async (e) => {
  e.preventDefault();
  const user = getAuthUser();
  if (!user) {
    showToast('Please log in to submit a review.', 'info');
    setTimeout(() => (window.location.href = '/login.html'), 1000);
    return;
  }

  const selectedRating = document.querySelector('input[name="review-rating-radio"]:checked');
  const comment = document.getElementById('review-comment');
  const submitBtn = document.getElementById('submit-review-btn');

  if (!selectedRating || !comment?.value?.trim()) {
    showToast('Please provide a rating and a review comment.', 'error');
    return;
  }

  if (comment.value.trim().length < 20) {
    showToast('Review must be at least 20 characters long.', 'error');
    return;
  }

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

  try {
    await fetchAPI(`/products/${currentProduct._id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: Number(selectedRating.value), comment: comment.value.trim() })
    });
    showToast('✅ Review submitted successfully! Thank you.', 'success');
    loadProductDetails();
  } catch (err) {
    showToast(err.message, 'error');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Review'; }
  }
};

/** Wire up review form interactive elements */
const wireReviewForm = () => {
  // Star selector
  const starLabels = document.querySelectorAll('.star-select-option');
  starLabels.forEach(label => {
    label.addEventListener('click', () => {
      starLabels.forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
    });
  });

  // Character counter
  const textarea = document.getElementById('review-comment');
  const counter = document.getElementById('review-char-count');
  if (textarea && counter) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = `${len} / 500 characters`;
      counter.style.color = len > 450 ? 'var(--accent-danger)' : 'var(--text-muted)';
    });
  }
};

// ─── Pincode Delivery Estimator ───────────────────────────────
const checkPincodeDelivery = () => {
  const input = document.getElementById('pincode-input');
  const result = document.getElementById('pincode-result');
  if (!input || !result) return;

  const pin = input.value.trim();
  if (!pin || pin.length < 6 || isNaN(pin)) {
    result.className = 'pincode-result';
    result.style.display = 'block';
    result.style.color = '#f87171';
    result.textContent = '❌ Please enter a valid 6-digit Indian pincode.';
    return;
  }

  // Simulated express delivery estimate
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  result.className = 'pincode-result success';
  result.innerHTML = `⚡ <strong>Express Delivery Available:</strong> Order within 4 hrs to get it by <strong>${formattedDate}, 5:00 PM</strong>. COD available.`;
};

// ─── Sticky Buy Bar Initialization ────────────────────────────
const initStickyBuyBar = (product) => {
  const bar = document.getElementById('sticky-buy-bar');
  const thumb = document.getElementById('sticky-thumb');
  const title = document.getElementById('sticky-title');
  const price = document.getElementById('sticky-price');
  const btn = document.getElementById('sticky-cart-btn');
  if (!bar || !thumb || !title || !price) return;

  thumb.src = product.image;
  thumb.alt = product.title;
  title.textContent = product.title;
  price.textContent = formatINR(product.price);
  if (btn && product.stock <= 0) {
    btn.disabled = true;
    btn.textContent = '❌ Out of Stock';
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 480) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  });
};

// Hook sticky bar init into loadProductDetails
const originalRenderProductDetail = renderProductDetail;
// Exports
window.changeDetailQty = changeDetailQty;
window.addDetailToCart = addDetailToCart;
window.submitReview = submitReview;
window.handleRelatedAddToCart = handleRelatedAddToCart;
window.checkPincodeDelivery = checkPincodeDelivery;
window.initStickyBuyBar = initStickyBuyBar;

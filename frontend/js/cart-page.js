/**
 * AroraCart — Cart Page Controller (cart-page.js)
 * Manages cart display, quantity updates, coupon validation,
 * and checkout navigation — all with toast notifications.
 */

let appliedCoupon = null;

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restore any previously applied coupon from session
  const saved = sessionStorage.getItem('arora_coupon');
  if (saved) {
    try { appliedCoupon = JSON.parse(saved); } catch { appliedCoupon = null; }
  }
  renderCartPage();
});

// ─── Render ────────────────────────────────────────────────────

/** Render the full cart page */
const renderCartPage = () => {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  const items = getCartItems();

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="status">
        <div class="empty-state-icon">🛒</div>
        <h1 class="empty-state-title">Your Cart is Empty</h1>
        <p class="empty-state-desc">
          Looks like you haven't added anything yet. Browse our catalog and discover amazing tech deals!
        </p>
        <a href="/index.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    return;
  }

  const itemsPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingPrice = itemsPrice >= 1999 ? 0 : 99;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = Math.max(0, itemsPrice + shippingPrice - discountAmount);

  container.innerHTML = `
    <h1 class="page-heading">Shopping Cart <span class="heading-count">(${items.reduce((a, i) => a + i.quantity, 0)} items)</span></h1>

    <div class="cart-layout">
      <!-- ── Cart Items ── -->
      <div class="cart-items-col">
        ${items.map(item => buildCartItem(item)).join('')}

        <div class="cart-meta-row">
          <button class="btn btn-outline btn-sm" onclick="clearCartConfirm()">🗑️ Clear Cart</button>
          <a href="/index.html" class="btn btn-secondary btn-sm">← Continue Shopping</a>
        </div>
      </div>

      <!-- ── Summary Column ── -->
      <aside class="cart-summary-col">

        <!-- Coupon Code Box -->
        <div class="coupon-card">
          <h3 class="coupon-heading">🏷️ Apply Promo Code</h3>
          <div class="coupon-row">
            <input
              type="text"
              id="coupon-input"
              class="form-control coupon-input"
              placeholder="e.g. ARORA10"
              value="${appliedCoupon ? appliedCoupon.code : ''}"
              autocomplete="off"
              style="text-transform:uppercase;"
              aria-label="Promo code"
            />
            <button class="btn btn-outline" onclick="handleApplyCoupon()" id="coupon-apply-btn">
              Apply
            </button>
          </div>

          ${appliedCoupon
            ? `<div class="coupon-success" role="status">
                ✅ ${appliedCoupon.message}
                <button class="coupon-remove-btn" onclick="removeCoupon()" aria-label="Remove coupon">✕</button>
              </div>`
            : `<p class="coupon-hint">Try: <strong>ARORA10</strong> (10% off ≥₹2,000) · <strong>WELCOME500</strong> (₹500 off ≥₹3,000) · <strong>TECH20</strong> (20% off ≥₹5,000)</p>`}
        </div>

        <!-- Price Breakdown -->
        <div class="order-summary-card">
          <h3 class="summary-heading">Order Summary</h3>

          <div class="summary-row">
            <span>Subtotal (${items.reduce((a,i)=>a+i.quantity,0)} items)</span>
            <span>${formatINR(itemsPrice)}</span>
          </div>

          <div class="summary-row">
            <span>Estimated Shipping</span>
            <span>
              ${shippingPrice === 0
                ? '<strong class="free-badge">FREE</strong>'
                : formatINR(shippingPrice)}
            </span>
          </div>

          ${shippingPrice > 0
            ? `<div class="free-shipping-progress">
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${Math.min(100, (itemsPrice / 1999) * 100).toFixed(0)}%;"></div>
                </div>
                <p class="progress-text">Add ${formatINR(1999 - itemsPrice)} more for free shipping!</p>
              </div>`
            : ''}

          ${discountAmount > 0 ? `
            <div class="summary-row discount-row">
              <span>Discount (${appliedCoupon.code})</span>
              <span class="discount-amount">− ${formatINR(discountAmount)}</span>
            </div>
          ` : ''}

          <div class="summary-total-row">
            <strong>Total Payable</strong>
            <strong class="total-amount">${formatINR(totalAmount)}</strong>
          </div>

          <button class="btn btn-primary checkout-btn" onclick="proceedToCheckout()">
            Proceed to Checkout →
          </button>

          <div class="secure-note">🔒 Secure checkout · All prices in INR (₹)</div>
        </div>
      </aside>
    </div>
  `;
};

/** Build a single cart item row */
const buildCartItem = (item) => `
  <div class="cart-item-row" id="cart-item-${item.product}">
    <a href="/product.html?id=${item.product}" class="cart-item-img-link">
      <img src="${item.image}" alt="${item.title}" class="cart-item-img"
           onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80'" />
    </a>

    <div class="cart-item-details">
      <h4 class="cart-item-title">
        <a href="/product.html?id=${item.product}">${item.title}</a>
      </h4>
      <div class="cart-item-unit-price">${formatINR(item.price)} each</div>
    </div>

    <div class="cart-item-controls">
      <div class="qty-selector" aria-label="Quantity selector for ${item.title}">
        <button class="qty-btn" onclick="handleCartQtyChange('${item.product}', ${item.quantity - 1})"
                aria-label="Decrease quantity" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" onclick="handleCartQtyChange('${item.product}', ${item.quantity + 1})"
                aria-label="Increase quantity" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
      </div>

      <div class="cart-item-line-total">${formatINR(item.price * item.quantity)}</div>

      <button class="remove-item-btn" onclick="handleRemoveItem('${item.product}')"
              aria-label="Remove ${item.title} from cart">🗑️</button>
    </div>
  </div>
`;

// ─── Interactions ──────────────────────────────────────────────

/** Handle quantity change for a cart item */
const handleCartQtyChange = (productId, newQty) => {
  updateCartQuantity(productId, newQty);
  renderCartPage();
};

/** Handle item removal from cart */
const handleRemoveItem = (productId) => {
  removeFromCart(productId);
  renderCartPage();
};

/** Confirm and clear the entire cart */
const clearCartConfirm = () => {
  if (getCartItems().length === 0) return;
  // Use a modal-less confirm via toast with action button
  const container = document.getElementById('cart-page-container');
  const confirmBar = document.createElement('div');
  confirmBar.className = 'confirm-bar';
  confirmBar.innerHTML = `
    <span>Clear all items from your cart?</span>
    <div>
      <button class="btn btn-danger btn-sm" onclick="doClearCart()">Yes, Clear</button>
      <button class="btn btn-secondary btn-sm" onclick="this.closest('.confirm-bar').remove()">Cancel</button>
    </div>
  `;
  container.insertBefore(confirmBar, container.firstChild);
};

const doClearCart = () => {
  clearCart();
  appliedCoupon = null;
  sessionStorage.removeItem('arora_coupon');
  showToast('Cart cleared successfully.', 'info');
  renderCartPage();
};

/** Apply a promo/coupon code */
const handleApplyCoupon = async () => {
  const input = document.getElementById('coupon-input');
  const applyBtn = document.getElementById('coupon-apply-btn');
  const code = input?.value?.trim().toUpperCase();

  if (!code) {
    showToast('Please enter a promo code.', 'info');
    return;
  }

  const items = getCartItems();
  const itemsPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = '⏳'; }

  try {
    const res = await fetchAPI('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount: itemsPrice })
    });
    appliedCoupon = res;
    sessionStorage.setItem('arora_coupon', JSON.stringify(res));
    showToast(`🎉 ${res.message}`, 'success');
    renderCartPage();
  } catch (err) {
    showToast(err.message, 'error');
    if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply'; }
  }
};

/** Remove the applied coupon */
const removeCoupon = () => {
  appliedCoupon = null;
  sessionStorage.removeItem('arora_coupon');
  showToast('Promo code removed.', 'info');
  renderCartPage();
};

/** Navigate to checkout (with auth guard) */
const proceedToCheckout = () => {
  const user = getAuthUser();
  if (!user) {
    showToast('Please log in to proceed to checkout.', 'info');
    setTimeout(() => (window.location.href = '/login.html?redirect=checkout'), 900);
    return;
  }
  window.location.href = '/checkout.html';
};

// Exports
window.handleCartQtyChange = handleCartQtyChange;
window.handleRemoveItem = handleRemoveItem;
window.clearCartConfirm = clearCartConfirm;
window.doClearCart = doClearCart;
window.handleApplyCoupon = handleApplyCoupon;
window.removeCoupon = removeCoupon;
window.proceedToCheckout = proceedToCheckout;

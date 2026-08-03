/**
 * AroraCart — Checkout Controller (checkout.js)
 * Handles shipping form, order summary, and order placement.
 */

document.addEventListener('DOMContentLoaded', renderCheckoutPage);

// ─── Render ────────────────────────────────────────────────────

const renderCheckoutPage = () => {
  const container = document.getElementById('checkout-page-container');
  if (!container) return;

  const user = getAuthUser();
  if (!user) {
    window.location.href = '/login.html?redirect=checkout';
    return;
  }

  const items = getCartItems();
  if (items.length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  const savedCoupon = sessionStorage.getItem('arora_coupon');
  const appliedCoupon = savedCoupon ? JSON.parse(savedCoupon) : null;

  const itemsPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingPrice = itemsPrice >= 1999 ? 0 : 99;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = Math.max(0, itemsPrice + shippingPrice - discountAmount);

  container.innerHTML = `
    <h1 class="page-heading">Checkout</h1>

    <!-- Progress Steps -->
    <div class="checkout-steps" aria-label="Checkout progress">
      <div class="checkout-step completed"><span class="step-num">✓</span> Cart</div>
      <div class="checkout-step-divider"></div>
      <div class="checkout-step active"><span class="step-num">2</span> Shipping</div>
      <div class="checkout-step-divider"></div>
      <div class="checkout-step"><span class="step-num">3</span> Confirmation</div>
    </div>

    <div class="checkout-layout">
      <!-- ── Shipping Form ── -->
      <div class="checkout-form-col">
        <div class="form-card">
          <h2 class="form-card-heading">🚚 Shipping Information</h2>

          <form id="checkout-form" onsubmit="handlePlaceOrder(event)" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="ship-name">Full Name *</label>
                <input type="text" id="ship-name" class="form-control" value="${user.name}" required
                       autocomplete="name" placeholder="As on ID" />
              </div>
              <div class="form-group">
                <label class="form-label" for="ship-phone">Mobile Number *</label>
                <input type="tel" id="ship-phone" class="form-control" required
                       autocomplete="tel" placeholder="+91 98765 43210"
                       pattern="[0-9+\\-\\s]{10,15}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="ship-address">Street Address *</label>
              <input type="text" id="ship-address" class="form-control" required
                     autocomplete="street-address" placeholder="Flat / House No, Street, Landmark" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="ship-city">City *</label>
                <input type="text" id="ship-city" class="form-control" required
                       autocomplete="address-level2" placeholder="e.g. New Delhi" />
              </div>
              <div class="form-group">
                <label class="form-label" for="ship-state">State *</label>
                <input type="text" id="ship-state" class="form-control" required
                       autocomplete="address-level1" placeholder="e.g. Delhi" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="ship-postal">Postal Code (PIN) *</label>
                <input type="text" id="ship-postal" class="form-control" required
                       autocomplete="postal-code" placeholder="110001"
                       pattern="[0-9]{6}" maxlength="6" />
              </div>
              <div class="form-group">
                <label class="form-label" for="payment-method">Payment Method</label>
                <select id="payment-method" class="form-control">
                  <option value="Cash on Delivery">💵 Cash on Delivery (COD)</option>
                  <option value="UPI Payment">📱 UPI / Online (Simulated)</option>
                  <option value="Debit/Credit Card">💳 Debit / Credit Card (Simulated)</option>
                </select>
              </div>
            </div>

            <!-- Validation error display -->
            <div id="checkout-error" class="form-error" role="alert" hidden></div>

            <button type="submit" class="btn btn-primary checkout-btn" id="place-order-btn">
              🛍️ Place Order — ${formatINR(totalAmount)}
            </button>
          </form>
        </div>
      </div>

      <!-- ── Order Summary Column ── -->
      <aside class="checkout-summary-col">
        <div class="order-summary-card">
          <h3 class="summary-heading">Your Order (${items.reduce((a,i)=>a+i.quantity,0)} items)</h3>

          <div class="checkout-items-list">
            ${items.map(item => `
              <div class="checkout-item-row">
                <div class="checkout-item-img-wrapper">
                  <img src="${item.image}" alt="${item.title}" class="checkout-item-img"
                       onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&q=80'" />
                  <span class="checkout-item-qty-badge">${item.quantity}</span>
                </div>
                <div class="checkout-item-info">
                  <p class="checkout-item-title">${item.title}</p>
                  <p class="checkout-item-price">${formatINR(item.price)} × ${item.quantity}</p>
                </div>
                <div class="checkout-item-total">${formatINR(item.price * item.quantity)}</div>
              </div>
            `).join('')}
          </div>

          <div class="summary-divider"></div>

          <div class="summary-row"><span>Subtotal</span><span>${formatINR(itemsPrice)}</span></div>
          <div class="summary-row">
            <span>Shipping</span>
            <span>${shippingPrice === 0 ? '<strong class="free-badge">FREE</strong>' : formatINR(shippingPrice)}</span>
          </div>

          ${discountAmount > 0 ? `
            <div class="summary-row discount-row">
              <span>Coupon (${JSON.parse(sessionStorage.getItem('arora_coupon') || '{}').code || ''})</span>
              <span class="discount-amount">− ${formatINR(discountAmount)}</span>
            </div>
          ` : ''}

          <div class="summary-total-row">
            <strong>Grand Total</strong>
            <strong class="total-amount">${formatINR(totalAmount)}</strong>
          </div>

          <div class="secure-note">🔒 Safe & secure payment · All amounts in ₹ INR</div>
        </div>
      </aside>
    </div>
  `;
};

// ─── Order Placement ───────────────────────────────────────────

/** Validate shipping form and place the order */
const handlePlaceOrder = async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('checkout-error');
  const placeBtn = document.getElementById('place-order-btn');

  // Collect form values
  const fullName = document.getElementById('ship-name')?.value.trim();
  const phone = document.getElementById('ship-phone')?.value.trim();
  const address = document.getElementById('ship-address')?.value.trim();
  const city = document.getElementById('ship-city')?.value.trim();
  const state = document.getElementById('ship-state')?.value.trim();
  const postalCode = document.getElementById('ship-postal')?.value.trim();
  const paymentMethod = document.getElementById('payment-method')?.value;

  // Client-side validation
  if (!fullName || !phone || !address || !city || !state || !postalCode) {
    showError(errorEl, 'Please fill in all required shipping fields.');
    return;
  }
  if (!/^[0-9]{6}$/.test(postalCode)) {
    showError(errorEl, 'Please enter a valid 6-digit PIN code.');
    return;
  }
  if (!/^[+0-9\-\s]{10,15}$/.test(phone)) {
    showError(errorEl, 'Please enter a valid mobile number (10–15 digits).');
    return;
  }

  if (errorEl) errorEl.hidden = true;

  const items = getCartItems();
  const savedCoupon = sessionStorage.getItem('arora_coupon');
  const appliedCoupon = savedCoupon ? JSON.parse(savedCoupon) : null;

  if (placeBtn) {
    placeBtn.disabled = true;
    placeBtn.textContent = '⏳ Placing your order…';
  }

  try {
    const newOrder = await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify({
        orderItems: items,
        shippingAddress: { fullName, phone, address, city, state, postalCode },
        paymentMethod,
        couponCode: appliedCoupon?.code || ''
      })
    });

    clearCart();
    sessionStorage.removeItem('arora_coupon');
    showToast('🎉 Order placed successfully! Thank you for shopping with AroraCart.', 'success');

    setTimeout(() => {
      window.location.href = `/orders.html?newOrderId=${newOrder._id}`;
    }, 1200);
  } catch (err) {
    showError(errorEl, err.message || 'Failed to place order. Please try again.');
    if (placeBtn) {
      placeBtn.disabled = false;
      const items = getCartItems();
      const savedCoupon = sessionStorage.getItem('arora_coupon');
      const ac = savedCoupon ? JSON.parse(savedCoupon) : null;
      const ip = items.reduce((a,i) => a+i.price*i.quantity, 0);
      const sp = ip>=1999?0:99;
      const disc = ac?ac.discountAmount:0;
      placeBtn.textContent = `🛍️ Place Order — ${formatINR(Math.max(0,ip+sp-disc))}`;
    }
  }
};

/** Show inline form error */
const showError = (el, message) => {
  if (!el) { showToast(message, 'error'); return; }
  el.textContent = message;
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.handlePlaceOrder = handlePlaceOrder;

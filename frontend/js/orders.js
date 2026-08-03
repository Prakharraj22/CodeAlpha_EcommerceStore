/**
 * AroraCart — Order History Controller (orders.js)
 * Renders order history with interactive fulfillment timelines.
 */

document.addEventListener('DOMContentLoaded', loadOrderHistory);

// ─── Data Fetching ────────────────────────────────────────────

const loadOrderHistory = async () => {
  const container = document.getElementById('orders-page-container');
  if (!container) return;

  const user = getAuthUser();
  if (!user) {
    window.location.href = '/login.html?redirect=orders';
    return;
  }

  showOrderSkeleton(container);

  try {
    const orders = await fetchAPI('/orders/myorders');
    renderOrderHistory(container, orders);

    // Highlight a new order if redirected from checkout
    const params = new URLSearchParams(window.location.search);
    const newOrderId = params.get('newOrderId');
    if (newOrderId) {
      setTimeout(() => {
        const el = document.getElementById(`order-${newOrderId}`);
        if (el) {
          el.classList.add('order-card-new');
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" role="alert">
        <div class="empty-state-icon">⚠️</div>
        <h2>Unable to Load Orders</h2>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="loadOrderHistory()">Try Again</button>
      </div>
    `;
  }
};

// ─── Render ────────────────────────────────────────────────────

const renderOrderHistory = (container, orders) => {
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="status">
        <div class="empty-state-icon">📦</div>
        <h1 class="empty-state-title">No Orders Yet</h1>
        <p class="empty-state-desc">You haven't placed any orders with AroraCart yet. Start shopping to see your order history here.</p>
        <a href="/index.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="orders-page-header">
      <h1 class="page-heading">Order History</h1>
      <p class="orders-subtitle">${orders.length} order${orders.length !== 1 ? 's' : ''} placed</p>
    </div>
    <div class="orders-list" aria-label="List of your orders">
      ${orders.map(order => renderOrderCard(order)).join('')}
    </div>
  `;
};

/** Render a single order card with fulfillment timeline */
const renderOrderCard = (order) => {
  const statusSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  const orderShortId = order._id.slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  return `
    <article class="order-card" id="order-${order._id}" aria-label="Order #${orderShortId}">
      <!-- Order Header -->
      <header class="order-card-header">
        <div class="order-header-left">
          <div class="order-id-row">
            <span class="order-id-label">Order ID</span>
            <span class="order-id-value">#${orderShortId}</span>
          </div>
          <div class="order-date">${orderDate} at ${orderTime}</div>
        </div>

        <div class="order-header-right">
          <span class="order-status-badge status-${order.status.toLowerCase()}">${order.status}</span>
          <div class="order-total-display">${formatINR(order.totalAmount)}</div>
          <div class="order-payment-method">${order.paymentMethod}</div>
        </div>
      </header>

      <!-- Fulfillment Timeline -->
      ${!isCancelled ? `
        <div class="order-timeline" role="list" aria-label="Order status timeline">
          ${statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const stepIcons = ['📋', '⚙️', '🚚', '✅'];
            return `
              <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}"
                   role="listitem"
                   aria-label="${step}: ${isCompleted ? 'completed' : 'pending'}">
                <div class="timeline-node">${isCompleted ? stepIcons[idx] : ''}</div>
                <div class="timeline-label">${step}</div>
              </div>
              ${idx < statusSteps.length - 1
                ? `<div class="timeline-connector ${idx < currentStepIndex ? 'filled' : ''}"></div>`
                : ''}
            `;
          }).join('')}
        </div>
      ` : `
        <div class="cancelled-notice" role="status">❌ This order was cancelled.</div>
      `}

      <!-- Order Items -->
      <div class="order-items-section">
        <h3 class="order-items-heading">Items Ordered</h3>
        <div class="order-items-list">
          ${order.orderItems.map(item => `
            <div class="order-item-row">
              <img src="${item.image}" alt="${item.title}" class="order-item-img"
                   onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=80&q=80'" />
              <div class="order-item-info">
                <p class="order-item-title">${item.title}</p>
                <p class="order-item-meta">
                  Qty: ${item.quantity} · ${formatINR(item.price)} each
                </p>
              </div>
              <div class="order-item-subtotal">${formatINR(item.price * item.quantity)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Order Footer: Shipping & Price breakdown -->
      <footer class="order-card-footer">
        <div class="order-shipping-info">
          <h4 class="order-footer-label">📦 Shipping To</h4>
          <address class="order-address">
            <strong>${order.shippingAddress.fullName}</strong><br/>
            ${order.shippingAddress.address}, ${order.shippingAddress.city},<br/>
            ${order.shippingAddress.state} — ${order.shippingAddress.postalCode}<br/>
            📞 ${order.shippingAddress.phone}
          </address>
        </div>

        <div class="order-price-summary">
          <div class="summary-row"><span>Items Total</span><span>${formatINR(order.itemsPrice)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${order.shippingPrice === 0 ? '<span class="free-badge">FREE</span>' : formatINR(order.shippingPrice)}</span></div>
          ${order.discountAmount > 0
            ? `<div class="summary-row discount-row"><span>Discount (${order.couponCode})</span><span class="discount-amount">−${formatINR(order.discountAmount)}</span></div>`
            : ''}
          <div class="summary-total-row"><strong>Total Paid</strong><strong class="total-amount">${formatINR(order.totalAmount)}</strong></div>
        </div>
      </footer>
    </article>
  `;
};

/** Show skeleton loaders while orders are loading */
const showOrderSkeleton = (container) => {
  container.innerHTML = Array(3).fill(0).map(() => `
    <div class="order-card skeleton-order-card" aria-hidden="true">
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-text medium" style="margin-top:0.5rem;"></div>
      <div class="skeleton skeleton-text full" style="margin-top:1.5rem;height:3rem;"></div>
      <div class="skeleton skeleton-text full" style="margin-top:1rem;height:80px;"></div>
    </div>
  `).join('');
};

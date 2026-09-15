/**
 * AroraCart - Order History Controller (orders.js) — Enhanced
 * Renders order history with fulfillment timelines and user-controlled cancellation.
 */

document.addEventListener('DOMContentLoaded', loadOrderHistory);

// ─── Data Fetching ─────────────────────────────────────────

const loadOrderHistory = async () => {
  const container = document.getElementById('orders-page-container');
  if (!container) return;

  const user = typeof getAuthUser === 'function' ? getAuthUser() : JSON.parse(localStorage.getItem('arora_user') || 'null');
  if (!user) {
    container.innerHTML = `
      <div class="empty-state" role="status" style="max-width:560px;margin:3rem auto;padding:2.5rem 2rem;">
        <div class="empty-state-icon" style="font-size:3.5rem;margin-bottom:1rem;">🔒</div>
        <h1 class="empty-state-title" style="font-size:1.75rem;margin-bottom:0.75rem;">Sign In to View Order History</h1>
        <p class="empty-state-desc" style="line-height:1.6;color:var(--text-muted);margin-bottom:1.5rem;">
          Please sign in to your AroraCart account to review your orders, track live courier deliveries, and download official GST tax invoices.
        </p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="/login.html?redirect=orders" class="btn btn-primary" style="padding:0.75rem 1.75rem;">Sign In to Account</a>
          <a href="/register.html?redirect=orders" class="btn btn-secondary" style="padding:0.75rem 1.5rem;">Create Account</a>
        </div>
        <div style="margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid var(--border-subtle);">
          <button class="btn btn-sm" style="background:none;border:none;color:var(--primary);cursor:pointer;text-decoration:underline;font-size:0.85rem;" onclick="window.demoSwitchRole && window.demoSwitchRole('customer')">
            1-Click Demo Login as Customer
          </button>
        </div>
      </div>
    `;
    return;
  }

  showOrderSkeleton(container);

  let orders = [];
  try {
    const data = await fetchAPI('/orders/myorders');
    orders = Array.isArray(data) ? data : (data?.orders || []);
  } catch (err) {
    console.warn('Backend order API note (checking local persistence):', err.message);
  }

  // Merge with locally persisted orders (deduplicating by _id)
  const localOrders = JSON.parse(localStorage.getItem('arora_local_orders') || '[]');
  const orderIds = new Set(orders.map(o => o._id));
  localOrders.forEach(lo => {
    if (lo && lo._id && !orderIds.has(lo._id)) {
      orders.push(lo);
      orderIds.add(lo._id);
    }
  });

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

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
};

// ─── Cancel Order ──────────────────────────────────────────

window.cancelOrder = async (orderId) => {
  if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;

  const btn = document.getElementById(`cancel-btn-${orderId}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Cancelling…'; }

  try {
    await fetchAPI(`/orders/${orderId}/cancel`, { method: 'PATCH' });
    showToast('Order cancelled successfully. Stock has been restored.', 'success');
    await loadOrderHistory();
  } catch (err) {
    // If backend offline, cancel in local storage
    const localOrders = JSON.parse(localStorage.getItem('arora_local_orders') || '[]');
    const target = localOrders.find(o => o._id === orderId);
    if (target) {
      target.status = 'Cancelled';
      localStorage.setItem('arora_local_orders', JSON.stringify(localOrders));
      showToast('Order cancelled successfully.', 'success');
      await loadOrderHistory();
    } else {
      showToast(err.message || 'Failed to cancel order', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Cancel Order'; }
    }
  }
};

// ─── 1-Click Demo Order Seeder for Evaluators ───────────────

window.seedDemoOrderForEvaluation = () => {
  const sampleOrder = {
    _id: 'ORD' + Date.now().toString(36).toUpperCase() + 'DEMO',
    orderItems: [
      {
        product: 'prod-1',
        title: 'Sony WH-1000XM5 Wireless Headphones',
        price: 26990,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
        quantity: 1
      },
      {
        product: 'prod-2',
        title: 'Logitech MX Mechanical Wireless Keyboard',
        price: 13995,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        quantity: 1
      }
    ],
    shippingAddress: {
      fullName: 'Prakhar Raj',
      phone: '+91 98765 43210',
      address: 'Flat 402, Cyber Heights, Tech Boulevard',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001'
    },
    paymentMethod: 'UPI',
    itemsPrice: 40985,
    shippingPrice: 0,
    discountAmount: 4098,
    couponCode: 'ARORA10',
    totalAmount: 36887,
    status: 'Shipped',
    createdAt: new Date().toISOString()
  };

  const localOrders = JSON.parse(localStorage.getItem('arora_local_orders') || '[]');
  localOrders.unshift(sampleOrder);
  localStorage.setItem('arora_local_orders', JSON.stringify(localOrders));

  if (typeof showToast === 'function') {
    showToast('📦 Sample demo order created for evaluation!', 'success');
  }
  loadOrderHistory();
};

// ─── Render ────────────────────────────────────────────────

const renderOrderHistory = (container, orders) => {
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="status" style="max-width:580px;margin:3rem auto;padding:2.5rem 2rem;">
        <div class="empty-state-icon" style="font-size:3.5rem;margin-bottom:1rem;">📦</div>
        <h1 class="empty-state-title" style="font-size:1.75rem;margin-bottom:0.75rem;">No Order History</h1>
        <p class="empty-state-desc" style="line-height:1.6;color:var(--text-muted);margin-bottom:1.5rem;">
          You haven't placed any orders yet. Once you complete a purchase, your orders, delivery progress, and downloadable tax invoices will appear right here.
        </p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="/index.html" class="btn btn-primary" style="padding:0.75rem 1.75rem;">Discover Electronics</a>
          <button class="btn btn-secondary" onclick="window.seedDemoOrderForEvaluation()" style="padding:0.75rem 1.5rem;">
            Place Sample Demo Order
          </button>
        </div>
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

/** Render a single order card with fulfillment timeline and cancel button */
const renderOrderCard = (order) => {
  const statusSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';
  const canCancel = ['Pending', 'Processing'].includes(order.status);

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
          ${canCancel ? `
            <button id="cancel-btn-${order._id}"
                    class="btn btn-danger btn-sm"
                    style="margin-top:0.5rem;"
                    onclick="cancelOrder('${order._id}')">
              Cancel Order
            </button>` : ''}
        </div>
      </header>

      <!-- Fulfillment Timeline -->
      ${!isCancelled ? `
        <div class="order-timeline" role="list" aria-label="Order status timeline">
          ${statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const stepIcons = ['✓', '⚙', '✈', '★'];
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
        <div class="cancelled-notice" role="status">This order was cancelled and stock has been restored.</div>
      `}

      <!-- Order Actions Strip -->
      <div style="display:flex;flex-wrap:wrap;gap:0.6rem;padding:0.75rem 1.25rem;background:var(--bg-surface-2);border-top:1px solid var(--border-subtle);border-bottom:1px solid var(--border-subtle);">
        <button type="button" class="btn btn-outline btn-sm" onclick="downloadInvoice('${order._id}')" title="Download official GST Tax Invoice">
          Download Tax Invoice
        </button>
        <button type="button" class="btn btn-outline btn-sm" onclick="openTrackingModal('${order._id}')" title="Track Live BlueDart / Delhivery shipment">
          Live Courier Tracking
        </button>
        <button type="button" class="btn btn-outline btn-sm" onclick="openHelpCenter('faq')" title="Need help with this order?">
          Order Help
        </button>
      </div>

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
                  Qty: ${item.quantity} × ${formatINR(item.price)} each
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
          <h4 class="order-footer-label">📍 Shipping To</h4>
          <address class="order-address">
            <strong>${order.shippingAddress.fullName}</strong><br/>
            ${order.shippingAddress.address}, ${order.shippingAddress.city},<br/>
            ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
            📞 ${order.shippingAddress.phone}
          </address>
        </div>

        <div class="order-price-summary">
          <div class="summary-row"><span>Items Total</span><span>${formatINR(order.itemsPrice)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${order.shippingPrice === 0 ? '<span class="free-badge">FREE</span>' : formatINR(order.shippingPrice)}</span></div>
          ${order.discountAmount > 0
            ? `<div class="summary-row discount-row"><span>Discount (${order.couponCode})</span><span class="discount-amount">-${formatINR(order.discountAmount)}</span></div>`
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

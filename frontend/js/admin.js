// Admin Dashboard JS — AroraCart
// All data comes from real API calls. No fabricated numbers.

(async () => {
  // Wait for auth.js to expose the token
  await new Promise(r => setTimeout(r, 100));

  const token = localStorage.getItem('arora_token');
  const userStr = localStorage.getItem('arora_user');
  let user = null;
  try { user = JSON.parse(userStr); } catch (_) {}

  const authGuard = document.getElementById('auth-guard');
  const adminContent = document.getElementById('admin-content');

  if (!token || !user || user.role !== 'admin') {
    authGuard.style.display = 'block';
    return;
  }
  adminContent.style.display = 'block';

  // Helpers
  const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const apiRequest = async (url, method = 'GET', body = null) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
  };

  const toast = window.showToast || ((m, t) => alert(`[${t}] ${m}`));

  // ─── Panel Navigation ───────────────────────────────
  const navBtns = document.querySelectorAll('.admin-nav button');
  const panels = document.querySelectorAll('.panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById('panel-' + btn.dataset.panel);
      if (target) {
        target.classList.add('active');
        loadPanel(btn.dataset.panel);
      }
    });
  });

  // ─── Panel Loaders ──────────────────────────────────
  const loadPanel = (panel) => {
    if (panel === 'analytics') loadAnalytics();
    else if (panel === 'orders') loadOrders();
    else if (panel === 'products') loadProducts();
    else if (panel === 'coupons') loadCoupons();
    else if (panel === 'users') loadUsers();
  };

  // ─── ANALYTICS ──────────────────────────────────────
  const loadAnalytics = async () => {
    try {
      const data = await apiRequest('/api/admin/analytics');

      document.getElementById('stat-orders').textContent = data.totalOrders.toLocaleString('en-IN');
      document.getElementById('stat-revenue').textContent = formatINR(data.totalRevenue);
      document.getElementById('stat-users').textContent = data.totalUsers.toLocaleString('en-IN');
      document.getElementById('stat-products').textContent = data.totalProducts.toLocaleString('en-IN');

      // Low stock
      const lstBody = document.getElementById('low-stock-table');
      if (data.lowStockProducts.length === 0) {
        lstBody.innerHTML = '<tr><td colspan="3" style="color:#34d399;text-align:center;">✅ No low-stock products</td></tr>';
      } else {
        lstBody.innerHTML = data.lowStockProducts.map(p => `
          <tr>
            <td>${p.title}</td>
            <td><span class="low-stock-badge">${p.stock} left</span></td>
            <td>${formatINR(p.price)}</td>
          </tr>`).join('');
      }

      // Status breakdown
      const breakdown = document.getElementById('status-breakdown');
      breakdown.innerHTML = data.ordersByStatus.map(s => `
        <div class="stat-card" style="min-width:130px;flex:1">
          <div class="stat-label">${s._id}</div>
          <div class="stat-value"><span class="status-badge ${s._id}">${s.count}</span></div>
        </div>`).join('');

      // Top products
      const tpBody = document.getElementById('top-products-table');
      if (data.topProducts.length === 0) {
        tpBody.innerHTML = '<tr><td colspan="3" style="color:#94a3b8;text-align:center;">No order data yet</td></tr>';
      } else {
        tpBody.innerHTML = data.topProducts.map(p => `
          <tr>
            <td>${p.title || '—'}</td>
            <td>${p.orderCount} units</td>
            <td>${formatINR(p.revenue)}</td>
          </tr>`).join('');
      }

      // Recent orders
      const roBody = document.getElementById('recent-orders-table');
      if (data.recentOrders.length === 0) {
        roBody.innerHTML = '<tr><td colspan="5" style="color:#94a3b8;text-align:center;">No orders yet</td></tr>';
      } else {
        roBody.innerHTML = data.recentOrders.map(o => `
          <tr>
            <td style="font-family:monospace;font-size:0.75rem;">${o._id.toString().slice(-8)}</td>
            <td>${o.user?.name || '—'}</td>
            <td>${formatINR(o.totalAmount)}</td>
            <td><span class="status-badge ${o.status}">${o.status}</span></td>
            <td>${formatDate(o.createdAt)}</td>
          </tr>`).join('');
      }
    } catch (err) {
      toast('Failed to load analytics: ' + err.message, 'error');
    }
  };

  // ─── ORDERS ──────────────────────────────────────────
  let ordersPage = 1;
  const loadOrders = async () => {
    const statusFilter = document.getElementById('order-status-filter').value;
    const url = `/api/admin/orders?page=${ordersPage}&limit=20${statusFilter ? '&status=' + statusFilter : ''}`;
    try {
      const data = await apiRequest(url);
      const tbody = document.getElementById('orders-table');
      if (!data.orders.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:#94a3b8;text-align:center;">No orders found</td></tr>';
        return;
      }
      tbody.innerHTML = data.orders.map(o => `
        <tr>
          <td style="font-family:monospace;font-size:0.75rem;">${o._id.toString().slice(-8)}</td>
          <td>${o.user?.name || '—'}<br><span style="color:#64748b;font-size:0.75rem;">${o.user?.email || ''}</span></td>
          <td>${formatINR(o.totalAmount)}</td>
          <td>
            <select class="select-status" data-order-id="${o._id}" onchange="updateStatus(this)">
              ${['Pending','Processing','Shipped','Delivered','Cancelled'].map(s =>
                `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td>${formatDate(o.createdAt)}</td>
          <td>
            <a href="/orders.html" class="btn-admin" style="text-decoration:none;font-size:0.75rem;">View</a>
          </td>
        </tr>`).join('');

      // Pagination
      const pag = document.getElementById('orders-pagination');
      pag.innerHTML = `
        <button class="btn-admin" ${ordersPage <= 1 ? 'disabled style="opacity:0.4"' : ''} onclick="prevOrderPage()">← Prev</button>
        <span style="color:#94a3b8;font-size:0.875rem;">Page ${data.page} of ${data.totalPages}</span>
        <button class="btn-admin" ${ordersPage >= data.totalPages ? 'disabled style="opacity:0.4"' : ''} onclick="nextOrderPage()">Next →</button>`;
    } catch (err) {
      toast('Failed to load orders: ' + err.message, 'error');
    }
  };

  window.prevOrderPage = () => { if (ordersPage > 1) { ordersPage--; loadOrders(); } };
  window.nextOrderPage = () => { ordersPage++; loadOrders(); };

  window.updateStatus = async (select) => {
    const orderId = select.dataset.orderId;
    const newStatus = select.value;
    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, 'PATCH', { status: newStatus });
      toast(`Order status updated to "${newStatus}"`, 'success');
    } catch (err) {
      toast('Update failed: ' + err.message, 'error');
      select.value = select.dataset.prev || select.value; // revert
    }
    select.dataset.prev = newStatus;
  };

  document.getElementById('order-status-filter').addEventListener('change', () => { ordersPage = 1; loadOrders(); });
  document.getElementById('btn-refresh-orders').addEventListener('click', loadOrders);

  // ─── PRODUCTS ─────────────────────────────────────────
  const loadProducts = async () => {
    try {
      const data = await apiRequest('/api/products?limit=100');
      const products = data.products || [];
      const tbody = document.getElementById('products-table');
      if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:#94a3b8;text-align:center;">No products found in database</td></tr>';
        return;
      }
      tbody.innerHTML = products.map(p => `
        <tr id="prod-row-${p._id}">
          <td>${p.title}</td>
          <td>${p.category}</td>
          <td><input class="select-status" style="width:90px" id="price-${p._id}" value="${p.price}" type="number" /></td>
          <td><input class="select-status" style="width:70px" id="stock-${p._id}" value="${p.stock}" type="number" /></td>
          <td>
            <select class="select-status" id="featured-${p._id}">
              <option value="true" ${p.isFeatured ? 'selected' : ''}>Yes</option>
              <option value="false" ${!p.isFeatured ? 'selected' : ''}>No</option>
            </select>
          </td>
          <td>
            <button class="btn-admin" onclick="saveProduct('${p._id}')">💾 Save</button>
            <button class="btn-admin danger" onclick="deleteProduct('${p._id}','${p.title.replace(/'/g,"\\'")}')">🗑️</button>
          </td>
        </tr>`).join('');
    } catch (err) {
      toast('Failed to load products: ' + err.message, 'error');
    }
  };

  window.saveProduct = async (id) => {
    const price = Number(document.getElementById('price-' + id).value);
    const stock = Number(document.getElementById('stock-' + id).value);
    const isFeatured = document.getElementById('featured-' + id).value === 'true';
    try {
      await apiRequest(`/api/admin/products/${id}`, 'PUT', { price, stock, isFeatured });
      toast('Product updated successfully', 'success');
    } catch (err) {
      toast('Update failed: ' + err.message, 'error');
    }
  };

  window.deleteProduct = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiRequest(`/api/admin/products/${id}`, 'DELETE');
      document.getElementById('prod-row-' + id)?.remove();
      toast(`"${title}" deleted`, 'success');
    } catch (err) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  // ─── COUPONS ─────────────────────────────────────────
  const loadCoupons = async () => {
    try {
      const data = await apiRequest('/api/admin/coupons');
      const tbody = document.getElementById('coupons-table');
      if (!data.coupons.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="color:#94a3b8;text-align:center;">No coupons found</td></tr>';
        return;
      }
      tbody.innerHTML = data.coupons.map(c => {
        const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
        return `<tr>
          <td style="font-weight:700;color:#38bdf8;">${c.code}</td>
          <td>${c.discountType}</td>
          <td>${c.discountType === 'percentage' ? c.discountValue + '%' : formatINR(c.discountValue)}</td>
          <td>${formatINR(c.minOrderAmount)}</td>
          <td>${c.usedCount} / ${c.usageLimit !== null ? c.usageLimit : '∞'}</td>
          <td style="color:${expired ? '#f87171' : '#94a3b8'}">${c.expiryDate ? formatDate(c.expiryDate) + (expired ? ' ⚠️' : '') : '—'}</td>
          <td><span class="status-badge ${c.isActive && !expired ? 'Delivered' : 'Cancelled'}">${c.isActive && !expired ? 'Active' : 'Inactive'}</span></td>
          <td><button class="btn-admin ${c.isActive ? 'danger' : 'success'}" onclick="toggleCoupon('${c._id}')">
            ${c.isActive ? '⏸ Deactivate' : '▶ Activate'}</button></td>
        </tr>`;
      }).join('');
    } catch (err) {
      toast('Failed to load coupons: ' + err.message, 'error');
    }
  };

  window.toggleCoupon = async (id) => {
    try {
      const data = await apiRequest(`/api/admin/coupons/${id}/toggle`, 'PATCH');
      toast(data.message, 'success');
      loadCoupons();
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    }
  };

  document.getElementById('btn-create-coupon').addEventListener('click', async () => {
    const code = document.getElementById('c-code').value.trim();
    const discountType = document.getElementById('c-type').value;
    const discountValue = document.getElementById('c-value').value;
    const minOrderAmount = document.getElementById('c-min').value;
    const maxDiscount = document.getElementById('c-max').value;
    const expiryDate = document.getElementById('c-expiry').value;
    const usageLimit = document.getElementById('c-limit').value;

    if (!code || !discountValue) {
      toast('Code and discount value are required', 'error');
      return;
    }
    try {
      await apiRequest('/api/admin/coupons', 'POST', {
        code, discountType, discountValue, minOrderAmount, maxDiscount,
        expiryDate: expiryDate || undefined,
        usageLimit: usageLimit || undefined
      });
      toast(`Coupon "${code}" created!`, 'success');
      loadCoupons();
      // Clear form
      ['c-code','c-value','c-min','c-max','c-expiry','c-limit'].forEach(id => {
        document.getElementById(id).value = '';
      });
    } catch (err) {
      toast('Create failed: ' + err.message, 'error');
    }
  });

  // ─── USERS ───────────────────────────────────────────
  const loadUsers = async () => {
    try {
      const data = await apiRequest('/api/admin/users');
      const tbody = document.getElementById('users-table');
      if (!data.users.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:#94a3b8;text-align:center;">No users</td></tr>';
        return;
      }
      tbody.innerHTML = data.users.map(u => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="status-badge ${u.role === 'admin' ? 'Shipped' : 'Processing'}">${u.role}</span></td>
          <td>${formatDate(u.createdAt)}</td>
        </tr>`).join('');
    } catch (err) {
      toast('Failed to load users: ' + err.message, 'error');
    }
  };

  // Load initial panel
  loadAnalytics();
})();

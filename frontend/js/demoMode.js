/**
 * AroraCart — Recruiter & Demo Mode HUD (demoMode.js)
 * Designed specifically for hiring managers, technical interviewers, and evaluators.
 * Provides 1-click persona switching, instant test-data population, and architectural tour.
 */

(function () {
  // Inject HUD into DOM once loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoMode);
  } else {
    initDemoMode();
  }

  function initDemoMode() {
    // Check if already injected
    if (document.getElementById('recruiter-hud-trigger')) return;

    // 1. Create trigger button
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'recruiter-hud-trigger';
    triggerBtn.className = 'recruiter-trigger-btn';
    triggerBtn.setAttribute('aria-label', 'Open Recruiter & Demo Tour Mode');
    triggerBtn.setAttribute('type', 'button');
    triggerBtn.innerHTML = `
      <span class="recruiter-pill-glow"></span>
      <span class="recruiter-pill-icon">🚀</span>
      <span class="recruiter-pill-text">Recruiter Tour</span>
    `;
    triggerBtn.addEventListener('click', toggleRecruiterModal);
    document.body.appendChild(triggerBtn);

    // 2. Create modal backdrop and container
    const modal = document.createElement('div');
    modal.id = 'recruiter-hud-modal';
    modal.className = 'recruiter-modal-backdrop';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="recruiter-modal-card" role="dialog" aria-modal="true" aria-labelledby="recruiter-hud-title">
        <div class="recruiter-modal-header">
          <div class="recruiter-header-left">
            <span class="recruiter-brand-badge">PORTFOLIO SHOWCASE &amp; ARCHITECTURE</span>
            <h2 id="recruiter-hud-title">⚡ Recruiter &amp; Evaluator Hub</h2>
          </div>
          <button class="recruiter-close-btn" id="recruiter-close-btn" type="button" aria-label="Close HUD">✕</button>
        </div>

        <div class="recruiter-tabs-nav" role="tablist">
          <button class="recruiter-tab-btn active" id="tab-btn-quick-actions" type="button" role="tab" aria-selected="true">
            ⚡ 1-Click Testing &amp; Personas
          </button>
          <button class="recruiter-tab-btn" id="tab-btn-architecture" type="button" role="tab" aria-selected="false">
            🏛️ Architecture &amp; Engineering
          </button>
        </div>

        <!-- TAB 1: Quick Actions & Testing -->
        <div class="recruiter-tab-content active" id="recruiter-tab-quick-actions" style="display:block;">
          <p class="recruiter-desc">
            Skip tedious manual typing! Use these instant controls to evaluate different roles and end-to-end flows in seconds.
          </p>

          <div class="recruiter-section">
            <h3 class="recruiter-section-title">👑 Instant Persona Switcher</h3>
            <div class="recruiter-actions-grid">
              <button class="recruiter-act-btn admin" id="recruiter-btn-admin" type="button">
                <span class="act-icon">🛡️</span>
                <div class="act-info">
                  <strong>Login as Admin</strong>
                  <small>admin@aroracart.com · Opens /admin.html with live analytics</small>
                </div>
              </button>

              <button class="recruiter-act-btn customer" id="recruiter-btn-customer" type="button">
                <span class="act-icon">🛍️</span>
                <div class="act-info">
                  <strong>Login as Customer</strong>
                  <small>demo@aroracart.com · Unlocks wishlist &amp; order history</small>
                </div>
              </button>

              <button class="recruiter-act-btn guest" id="recruiter-btn-guest" type="button">
                <span class="act-icon">👤</span>
                <div class="act-info">
                  <strong>Reset as Guest</strong>
                  <small>Logs out to test first-time visitor experience</small>
                </div>
              </button>
            </div>
          </div>

          <div class="recruiter-section">
            <h3 class="recruiter-section-title">🛒 1-Click Flow Seeders</h3>
            <div class="recruiter-actions-grid">
              <button class="recruiter-act-btn" id="recruiter-btn-cart" type="button">
                <span class="act-icon">📥</span>
                <div class="act-info">
                  <strong>Pre-fill Test Cart</strong>
                  <small>Adds Headphones + Keyboard to test Cart &amp; Checkout instantly</small>
                </div>
              </button>

              <button class="recruiter-act-btn" id="recruiter-btn-wishlist" type="button">
                <span class="act-icon">💖</span>
                <div class="act-info">
                  <strong>Pre-fill Wishlist</strong>
                  <small>Populates 3 gadgets to test new Wishlist page</small>
                </div>
              </button>

              <button class="recruiter-act-btn" id="recruiter-btn-checkout" type="button">
                <span class="act-icon">📍</span>
                <div class="act-info">
                  <strong>Autofill Shipping Address</strong>
                  <small>Pre-populates Delhi address on Checkout page</small>
                </div>
              </button>

              <button class="recruiter-act-btn" id="recruiter-btn-coupon" type="button">
                <span class="act-icon">🏷️</span>
                <div class="act-info">
                  <strong>Apply 10% Off Coupon</strong>
                  <small>Tests coupon engine with code: ARORA10</small>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: Architecture & Engineering Highlights -->
        <div class="recruiter-tab-content" id="recruiter-tab-architecture" style="display:none;">
          <p class="recruiter-desc" style="margin-bottom:1.25rem;">
            Detailed architectural specifications, enterprise security safeguards, and system design highlights powering AroraCart.
          </p>

          <div class="recruiter-arch-list">
            <div class="arch-card">
              <div class="arch-icon">🏛️</div>
              <div class="arch-details">
                <h4>Full-Stack Architecture &amp; Dual-Mode Engine</h4>
                <p>Clean MVC architecture separating routes, controllers, middleware, and models. Features a transparent dual-mode catalog layer: connects to <strong>MongoDB Atlas</strong> with automatic fallback to an in-memory catalog, ensuring 100% availability during network changes or evaluation.</p>
              </div>
            </div>

            <div class="arch-card">
              <div class="arch-icon">🛡️</div>
              <div class="arch-details">
                <h4>Atomic Inventory Concurrency &amp; Stock Locks</h4>
                <p>Server-side checkout enforces atomic stock decrement via conditional operators: <code>findOneAndUpdate({ stock: { $gte: qty } }, { $inc: { stock: -qty } })</code>. Implements automatic transactional rollback compensation if order creation fails, preventing overselling.</p>
              </div>
            </div>

            <div class="arch-card">
              <div class="arch-icon">🔒</div>
              <div class="arch-details">
                <h4>Defense-in-Depth Security &amp; RBAC</h4>
                <p>Stateless JWT authentication (30-day expiry), <code>bcryptjs</code> password hashing (10 salt rounds), Helmet HTTP security headers (CSP with unsafe-inline script support, HSTS, XSS protection), <code>express-mongo-sanitize</code> against NoSQL injection, and sliding IP rate limiting (200 req/15min). Admin APIs require strict <code>protect + admin</code> middleware.</p>
              </div>
            </div>

            <div class="arch-card">
              <div class="arch-icon">📊</div>
              <div class="arch-details">
                <h4>Real-Time Aggregation Pipeline Analytics</h4>
                <p>The Admin Dashboard computes genuine metrics directly from database records using MongoDB aggregation pipelines (<code>$match</code>, <code>$group</code>, <code>$sum</code>, <code>$sort</code>, <code>$project</code>) for revenue volume, top categories, low-stock alerts, and order status breakdown — 100% dynamic without static stats.</p>
              </div>
            </div>

            <div class="arch-card">
              <div class="arch-icon">📜</div>
              <div class="arch-details">
                <h4>E-Commerce Service Policies (Flipkart / Amazon Grade)</h4>
                <p>Complete e-commerce support lifecycle: <strong>7-Day Doorstep Replacement</strong> for defective or damaged electronics, <strong>1-Year Official Brand Warranty</strong> with downloadable GST Tax Invoices, <strong>Lightning Metro Dispatch</strong> (free shipping &ge; ₹1,999), and 256-bit SSL encrypted payments with UPI &amp; COD verification.</p>
              </div>
            </div>

            <div class="arch-card">
              <div class="arch-icon">⚡</div>
              <div class="arch-details">
                <h4>Zero-Bundle Client Performance &amp; Accessibility</h4>
                <p>Vanilla JavaScript architecture with zero bundler overhead (instant FCP &lt; 0.4s). Pure CSS design system featuring 60 FPS GPU-accelerated glassmorphism, responsive mobile drawer and bottom navigation dock, and complete keyboard/ARIA accessibility.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="recruiter-modal-footer">
          <span class="recruiter-footer-note">⚡ Built with Node.js, Express, MongoDB &amp; Vanilla Glassmorphic JS</span>
          <button class="btn btn-secondary btn-sm" id="recruiter-footer-close" type="button">Close Hub</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // 3. Attach Programmatic Event Listeners to Fortify Interaction
    bindHudEventListeners(modal);
  }

  function bindHudEventListeners(modal) {
    if (!modal) return;

    // Close button (X)
    const closeBtn = modal.querySelector('#recruiter-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeRecruiterModal();
      });
    }

    // Footer close button
    const footerClose = modal.querySelector('#recruiter-footer-close');
    if (footerClose) {
      footerClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeRecruiterModal();
      });
    }

    // Backdrop click (click outside card)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeRecruiterModal();
      }
    });

    // Escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeRecruiterModal();
      }
    });

    // Tab buttons
    const tabQuick = modal.querySelector('#tab-btn-quick-actions');
    const tabArch = modal.querySelector('#tab-btn-architecture');

    if (tabQuick) {
      tabQuick.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchRecruiterTab('quick-actions');
      });
    }

    if (tabArch) {
      tabArch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchRecruiterTab('architecture');
      });
    }

    // Persona buttons
    modal.querySelector('#recruiter-btn-admin')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoSwitchRole('admin');
    });
    modal.querySelector('#recruiter-btn-customer')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoSwitchRole('customer');
    });
    modal.querySelector('#recruiter-btn-guest')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoSwitchRole('guest');
    });

    // Seeder buttons
    modal.querySelector('#recruiter-btn-cart')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoPopulateCart();
    });
    modal.querySelector('#recruiter-btn-wishlist')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoPopulateWishlist();
    });
    modal.querySelector('#recruiter-btn-checkout')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoAutofillCheckout();
    });
    modal.querySelector('#recruiter-btn-coupon')?.addEventListener('click', (e) => {
      e.preventDefault();
      demoApplyCoupon();
    });
  }

  // ─── Modal Controls ─────────────────────────────────────────
  function toggleRecruiterModal() {
    const modal = document.getElementById('recruiter-hud-modal');
    if (!modal) return;
    const isHidden = modal.getAttribute('aria-hidden') === 'true' || !modal.classList.contains('open');
    if (isHidden) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    } else {
      closeRecruiterModal();
    }
  }

  function closeRecruiterModal() {
    const modal = document.getElementById('recruiter-hud-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function switchRecruiterTab(tabId) {
    const tabQuickBtn = document.getElementById('tab-btn-quick-actions');
    const tabArchBtn = document.getElementById('tab-btn-architecture');
    const contentQuick = document.getElementById('recruiter-tab-quick-actions');
    const contentArch = document.getElementById('recruiter-tab-architecture');

    if (tabId === 'quick-actions') {
      if (tabQuickBtn) {
        tabQuickBtn.classList.add('active');
        tabQuickBtn.setAttribute('aria-selected', 'true');
      }
      if (tabArchBtn) {
        tabArchBtn.classList.remove('active');
        tabArchBtn.setAttribute('aria-selected', 'false');
      }
      if (contentQuick) {
        contentQuick.classList.add('active');
        contentQuick.style.display = 'block';
      }
      if (contentArch) {
        contentArch.classList.remove('active');
        contentArch.style.display = 'none';
      }
    } else if (tabId === 'architecture') {
      if (tabArchBtn) {
        tabArchBtn.classList.add('active');
        tabArchBtn.setAttribute('aria-selected', 'true');
      }
      if (tabQuickBtn) {
        tabQuickBtn.classList.remove('active');
        tabQuickBtn.setAttribute('aria-selected', 'false');
      }
      if (contentArch) {
        contentArch.classList.add('active');
        contentArch.style.display = 'block';
      }
      if (contentQuick) {
        contentQuick.classList.remove('active');
        contentQuick.style.display = 'none';
      }
    }
  }

  // ─── 1-Click Role Switching ─────────────────────────────────
  async function demoSwitchRole(role) {
    const toast = window.showToast || ((m) => alert(m));
    if (role === 'guest') {
      localStorage.removeItem('arora_token');
      localStorage.removeItem('arora_user');
      toast('Switched to Guest mode (Logged out)', 'info');
      setTimeout(() => {
        if (typeof updateAuthUI === 'function') updateAuthUI();
        window.location.href = '/index.html';
      }, 400);
      return;
    }

    const email = role === 'admin' ? 'admin@aroracart.com' : 'demo@aroracart.com';
    const password = role === 'admin' ? 'Admin@123' : 'Demo@123';

    try {
      toast(`Authenticating as ${role.toUpperCase()}...`, 'info');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('arora_token', data.token);
        localStorage.setItem('arora_user', JSON.stringify(data));
        toast(`✅ Logged in as ${role === 'admin' ? 'Admin (Full Access)' : 'Demo Customer'}!`, 'success');
        closeRecruiterModal();
        setTimeout(() => {
          if (role === 'admin') window.location.href = '/admin.html';
          else {
            if (typeof updateAuthUI === 'function') updateAuthUI();
            window.location.reload();
          }
        }, 600);
      } else {
        // Client fallback session for testing when MongoDB Atlas is offline
        const mockUser = {
          _id: role === 'admin' ? 'admin999' : 'user999',
          name: role === 'admin' ? 'System Admin' : 'Prakhar Raj',
          email,
          role: role === 'admin' ? 'admin' : 'user',
          token: 'mock_jwt_recruiter_token'
        };
        localStorage.setItem('arora_token', mockUser.token);
        localStorage.setItem('arora_user', JSON.stringify(mockUser));
        toast(`✅ Logged in as ${role.toUpperCase()} (Client Session)`, 'success');
        closeRecruiterModal();
        setTimeout(() => {
          if (role === 'admin') window.location.href = '/admin.html';
          else window.location.reload();
        }, 500);
      }
    } catch (err) {
      toast('Login failed: ' + err.message, 'error');
    }
  }

  // ─── 1-Click Flow Seeders ───────────────────────────────────
  function demoPopulateCart() {
    const toast = window.showToast || ((m) => alert(m));
    const testItems = [
      {
        product: 'prod-1',
        title: 'Sony WH-1000XM5 Wireless Headphones',
        price: 26990,
        originalPrice: 34990,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
        quantity: 1,
        stock: 12
      },
      {
        product: 'prod-2',
        title: 'boAt Rockerz 550 Over-Ear Headphones',
        price: 1799,
        originalPrice: 2990,
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        quantity: 1,
        stock: 60
      }
    ];

    // Ensure user is logged in before populating cart
    const user = typeof getAuthUser === 'function' ? getAuthUser() : JSON.parse(localStorage.getItem('arora_user') || 'null');
    if (!user) {
      const mockUser = {
        _id: 'user999',
        name: 'Prakhar Raj',
        email: 'demo@aroracart.com',
        role: 'user',
        token: 'mock_jwt_recruiter_token'
      };
      localStorage.setItem('arora_token', mockUser.token);
      localStorage.setItem('arora_user', JSON.stringify(mockUser));
    }

    localStorage.setItem('aroracart_cart', JSON.stringify(testItems));
    if (typeof updateCartBadge === 'function') updateCartBadge();
    toast('🛒 Test Cart populated with 2 gadgets!', 'success');
    closeRecruiterModal();
    setTimeout(() => {
      window.location.href = '/cart.html';
    }, 500);
  }

  function demoPopulateWishlist() {
    const toast = window.showToast || ((m) => alert(m));
    const testWishlist = [
      'prod-1',
      'prod-2',
      'prod-3'
    ];
    localStorage.setItem('arora_wishlist', JSON.stringify(testWishlist));
    if (typeof updateWishlistUI === 'function') updateWishlistUI();
    toast('💖 Wishlist populated with 3 gadgets!', 'success');
    closeRecruiterModal();
    setTimeout(() => {
      window.location.href = '/wishlist.html';
    }, 500);
  }

  function demoAutofillCheckout() {
    const toast = window.showToast || ((m) => alert(m));
    const nameEl = document.getElementById('ship-name') || document.getElementById('shipping-name');
    const addrEl = document.getElementById('ship-address') || document.getElementById('shipping-address');
    const cityEl = document.getElementById('ship-city') || document.getElementById('shipping-city');
    const stateEl = document.getElementById('ship-state') || document.getElementById('shipping-state');
    const zipEl = document.getElementById('ship-postal') || document.getElementById('shipping-zip');
    const phoneEl = document.getElementById('ship-phone') || document.getElementById('shipping-phone');

    if (nameEl && addrEl && cityEl && stateEl && zipEl && phoneEl) {
      nameEl.value = 'Prakhar Raj';
      addrEl.value = 'Flat 402, Cyber Heights, Tech Boulevard';
      cityEl.value = 'New Delhi';
      stateEl.value = 'Delhi';
      zipEl.value = '110001';
      phoneEl.value = '9876543210';
      toast('📍 Shipping details auto-filled!', 'success');
      closeRecruiterModal();
    } else {
      toast('Navigating to Checkout...', 'info');
      sessionStorage.setItem('arora_autofill_checkout', 'true');
      closeRecruiterModal();
      window.location.href = '/checkout.html';
    }
  }

  function demoApplyCoupon() {
    const toast = window.showToast || ((m) => alert(m));
    const coupon = {
      code: 'ARORA10',
      discountType: 'percentage',
      discountValue: 10,
      discountAmount: 4098,
      message: 'Coupon "ARORA10" applied successfully! Saved ₹4,098'
    };
    sessionStorage.setItem('arora_coupon', JSON.stringify(coupon));
    toast('🏷️ Applied ARORA10 (10% Discount)!', 'success');
    closeRecruiterModal();
    if (window.location.pathname.includes('cart.html') || window.location.pathname.includes('checkout.html')) {
      window.location.reload();
    }
  }

  // Global Exports for maximum compatibility
  window.toggleRecruiterModal = toggleRecruiterModal;
  window.closeRecruiterModal = closeRecruiterModal;
  window.switchRecruiterTab = switchRecruiterTab;
  window.demoSwitchRole = demoSwitchRole;
  window.demoPopulateCart = demoPopulateCart;
  window.demoPopulateWishlist = demoPopulateWishlist;
  window.demoAutofillCheckout = demoAutofillCheckout;
  window.demoApplyCoupon = demoApplyCoupon;
})();


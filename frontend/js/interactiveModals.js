/**
 * AroraCart — Interactive Modals, Info Sheets & Customer Service Engine (interactiveModals.js)
 * Powers all interactive informational buttons:
 * - Trust matrix details (Shipping, Warranty, Replacement, Security)
 * - Hero promotional actions
 * - Bank EMI calculator & offers sheet
 * - Printable GST Tax Invoice generator for orders
 * - Live Courier Tracking modal
 * - Comprehensive Help Center (FAQ, Policies, Contact Support)
 */

(function () {
  // Ensure glass modal backdrop exists & bind listeners
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureModalBackdrop();
      initInteractiveListeners();
    });
  } else {
    ensureModalBackdrop();
    initInteractiveListeners();
  }

  function ensureModalBackdrop() {
    let modal = document.getElementById('glass-modal-backdrop');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'glass-modal-backdrop';
      modal.className = 'glass-modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="glass-modal-card" id="glass-modal-card">
          <button class="glass-modal-close" id="glass-modal-close-btn" type="button" aria-label="Close modal">✕</button>
          <div id="glass-modal-body"></div>
        </div>
      `;
      document.body.appendChild(modal);

      // Close when clicking outside card (backdrop click)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeGlassModal();
        }
      });

      // Escape key closes modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeGlassModal();
      });

      // Close button listener
      const closeBtn = modal.querySelector('#glass-modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeGlassModal();
        });
      }
    }
  }

  // Programmatic event listener binding for all pills and trust items
  function initInteractiveListeners() {
    // Promo pills in Hero
    document.querySelectorAll('.promo-pill').forEach(pill => {
      if (pill.dataset.bound) return;
      pill.dataset.bound = 'true';
      pill.style.cursor = 'pointer';
      const text = (pill.textContent || '').toLowerCase();
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        if (text.includes('shipping')) handleHeroPill('shipping');
        else if (text.includes('arora10') || text.includes('coupon') || text.includes('10%')) handleHeroPill('coupon');
        else if (text.includes('gaming')) handleHeroPill('gaming');
      });
    });

    // Trust items in Matrix
    document.querySelectorAll('.trust-item').forEach(item => {
      if (item.dataset.bound) return;
      item.dataset.bound = 'true';
      item.style.cursor = 'pointer';
      const text = (item.textContent || '').toLowerCase();
      item.addEventListener('click', (e) => {
        e.preventDefault();
        if (text.includes('dispatch')) openInfoModal('dispatch');
        else if (text.includes('warranty')) openInfoModal('warranty');
        else if (text.includes('replacement')) openInfoModal('replacement');
        else if (text.includes('secure') || text.includes('payment')) openInfoModal('security');
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  // ─── Modal Open/Close Helpers ───────────────────────────────
  function showModalContent(html, maxWidth = '720px') {
    ensureModalBackdrop();
    const modal = document.getElementById('glass-modal-backdrop');
    const card = document.getElementById('glass-modal-card');
    const body = document.getElementById('glass-modal-body');
    if (!modal || !body) return;

    if (card) card.style.maxWidth = maxWidth;
    body.innerHTML = html;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeGlassModal() {
    const modal = document.getElementById('glass-modal-backdrop');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // ─── 1. Trust Matrix & Customer Service Topics ──────────────
  function openInfoModal(topic) {
    const toast = window.showToast || ((m) => alert(m));

    const topics = {
      dispatch: {
        badge: 'DELIVERY SLA',
        title: '⚡ Lightning Dispatch & Express Shipping',
        icon: '🚚',
        content: `
          <div class="info-modal-content">
            <p style="color:#cbd5e1;line-height:1.6;margin-bottom:1.25rem;">
              At AroraCart, every order is packed and dispatched from our primary fulfillment centers in <strong>Delhi NCR, Mumbai, and Bangalore</strong>.
            </p>

            <div class="info-feature-grid">
              <div class="info-card">
                <span class="info-card-icon">⏱️</span>
                <h4>Same-Day Cutoff</h4>
                <p>Orders placed before <strong>2:00 PM IST</strong> on business days are dispatched the exact same day.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">⚡</span>
                <h4>Metro Express (24-48h)</h4>
                <p>Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, and Kolkata receive express next-day or 48-hour delivery.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">📦</span>
                <h4>Free Shipping Threshold</h4>
                <p>All orders with cart total ≥ <strong>₹1,999</strong> receive 100% Free Express Shipping. Flat ₹99 for orders below.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">🛡️</span>
                <h4>Verified Logistics</h4>
                <p>Partnered with <strong>BlueDart, Delhivery, and DTDC</strong> with real-time SMS &amp; WhatsApp tracking.</p>
              </div>
            </div>

            <div style="margin-top:1.5rem;padding:1rem;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:var(--radius-md);">
              <strong style="color:#38bdf8;">📍 Need live status?</strong>
              <span style="color:#cbd5e1;font-size:0.85rem;margin-left:0.5rem;">Check your order timeline anytime under <a href="/orders.html" style="color:#38bdf8;text-decoration:underline;">My Orders</a>.</span>
            </div>
          </div>
        `
      },
      warranty: {
        badge: 'GENUINE PROTECTION',
        title: '🛡️ 1-Year Comprehensive Brand Warranty',
        icon: '🛡️',
        content: `
          <div class="info-modal-content">
            <p style="color:#cbd5e1;line-height:1.6;margin-bottom:1.25rem;">
              Every smart gadget, headphone, keyboard, and wearable sold on AroraCart is <strong>100% original, brand-new, and sealed</strong>.
            </p>

            <div class="info-feature-grid">
              <div class="info-card">
                <span class="info-card-icon">🧾</span>
                <h4>Official GST Invoice</h4>
                <p>Every purchase includes a digital GST Tax Invoice valid at all official brand service centers across India.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">🏢</span>
                <h4>Authorized Coverage</h4>
                <p>Direct manufacturer warranty coverage (Sony, Logitech, Apple, Bose, Keychron, etc.) for 365 days.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">🚗</span>
                <h4>Doorstep Pickup</h4>
                <p>In major metro areas, our logistics team assists in arranging doorstep pickup for warranty inspection.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">📞</span>
                <h4>Warranty Claim Desk</h4>
                <p>Email our dedicated warranty desk at <code>warranty@aroracart.com</code> for instant claim letters and support.</p>
              </div>
            </div>
          </div>
        `
      },
      replacement: {
        badge: 'HASSLE-FREE ASSURANCE',
        title: '🔄 7-Day Doorstep Replacement Policy',
        icon: '🔄',
        content: `
          <div class="info-modal-content">
            <p style="color:#cbd5e1;line-height:1.6;margin-bottom:1.25rem;">
              Enjoy complete peace of mind with our <strong>7-Day No-Hassle Replacement Window</strong> on all electronics.
            </p>

            <div class="info-feature-grid">
              <div class="info-card">
                <span class="info-card-icon">✅</span>
                <h4>Eligible Conditions</h4>
                <p>Covers dead-on-arrival (DOA) units, manufacturing defects, missing accessories, or transit packaging damage.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">⚡</span>
                <h4>1-Click Return Request</h4>
                <p>Directly request replacement from your Order History page within 7 days of verified delivery.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">🚚</span>
                <h4>Reverse Logistics</h4>
                <p>Our courier agent picks up the unit from your doorstep with zero return shipping fees.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">💰</span>
                <h4>Express Refund Option</h4>
                <p>If identical replacement stock is unavailable, 100% full refund is credited back to your original payment method.</p>
              </div>
            </div>
          </div>
        `
      },
      security: {
        badge: 'BANK-GRADE SECURITY',
        title: '💳 100% Encrypted & Safe Transactions',
        icon: '🔒',
        content: `
          <div class="info-modal-content">
            <p style="color:#cbd5e1;line-height:1.6;margin-bottom:1.25rem;">
              Your security and privacy are top priority. We employ banking-grade protocols to protect every single payment.
            </p>

            <div class="info-feature-grid">
              <div class="info-card">
                <span class="info-card-icon">🛡️</span>
                <h4>PCI-DSS Level 1 Certified</h4>
                <p>Card data is tokenized through RBI-compliant secure payment gateways. We never store raw CVVs or PINs.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">📱</span>
                <h4>UPI &amp; Instant QR</h4>
                <p>Native integration with Google Pay, PhonePe, Paytm, and BHIM UPI with 2-factor MPIN approval.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">🔒</span>
                <h4>256-Bit SSL Encryption</h4>
                <p>Every API endpoint is protected by TLS 1.3 encryption, Helmet CSP, and automated rate limiting.</p>
              </div>

              <div class="info-card">
                <span class="info-card-icon">💵</span>
                <h4>Cash on Delivery (COD)</h4>
                <p>Inspect outer tamper-evident packaging before paying the delivery executive at your doorstep.</p>
              </div>
            </div>
          </div>
        `
      }
    };

    const item = topics[topic] || topics['security'];
    const html = `
      <div style="margin-bottom:1rem;">
        <span class="recruiter-brand-badge">${item.badge}</span>
        <h2 style="color:#f1f5f9;font-size:1.4rem;margin-top:0.3rem;">${item.title}</h2>
      </div>
      ${item.content}
      <div style="margin-top:1.5rem;text-align:right;">
        <button class="btn btn-primary btn-sm" onclick="window.closeGlassModal()">Understood, Got it</button>
      </div>
    `;

    showModalContent(html, '680px');
  }

  // ─── 2. Hero Pills Click Handlers ───────────────────────────
  function handleHeroPill(type) {
    const toast = window.showToast || ((m) => alert(m));

    if (type === 'shipping') {
      openInfoModal('dispatch');
    } else if (type === 'coupon') {
      // Auto-copy coupon
      const couponCode = 'ARORA10';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(couponCode);
      }
      sessionStorage.setItem('arora_coupon', JSON.stringify({
        code: couponCode,
        discountType: 'percentage',
        discountValue: 10,
        discountAmount: 2000,
        message: 'Coupon "ARORA10" applied successfully! Saved 10%'
      }));
      toast('🏷️ Coupon ARORA10 copied & applied to your cart!', 'success');
    } else if (type === 'gaming') {
      // Filter catalog to gaming / accessories
      if (typeof selectCategory === 'function') {
        selectCategory('Accessories');
        toast('🎮 Filtered catalog to Gaming & Accessories gear!', 'info');
        const catalogEl = document.getElementById('catalog-section');
        if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/index.html?category=Accessories';
      }
    }
  }

  // ─── 3. Bank EMI Calculator Modal ───────────────────────────
  function openEmiModal(price) {
    const p = Number(price) || 24990;
    const formatINR = window.formatINR || ((n) => '₹' + Number(n).toLocaleString('en-IN'));

    const emiOptions = [
      { months: 3, bank: 'HDFC Bank', rate: '13% p.a.', monthly: Math.round((p * 1.03) / 3), cashback: '₹500 Instant Cashback' },
      { months: 6, bank: 'ICICI Bank', rate: '14% p.a.', monthly: Math.round((p * 1.05) / 6), cashback: 'No-Cost EMI available' },
      { months: 9, bank: 'SBI Card', rate: '14.5% p.a.', monthly: Math.round((p * 1.07) / 9), cashback: 'Extra 5% Rewards' },
      { months: 12, bank: 'Axis Bank / Bajaj', rate: '15% p.a.', monthly: Math.round((p * 1.09) / 12), cashback: 'Zero Downpayment' }
    ];

    const html = `
      <div style="margin-bottom:1.25rem;">
        <span class="recruiter-brand-badge">FINANCING &amp; OFFERS</span>
        <h2 style="color:#f1f5f9;font-size:1.4rem;margin-top:0.3rem;">💳 Easy Monthly EMI Plans</h2>
        <p style="color:#94a3b8;font-size:0.85rem;">Calculated for gadget price: <strong style="color:#38bdf8;">${formatINR(p)}</strong></p>
      </div>

      <div style="overflow-x:auto;">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Duration</th>
              <th>Bank Partner</th>
              <th>Monthly EMI</th>
              <th>Special Offer</th>
            </tr>
          </thead>
          <tbody>
            ${emiOptions.map(opt => `
              <tr>
                <td style="font-weight:700;color:#f1f5f9;">${opt.months} Months</td>
                <td>${opt.bank}</td>
                <td style="color:#38bdf8;font-weight:700;">${formatINR(opt.monthly)}/mo</td>
                <td><span class="stock-badge stock-in">${opt.cashback}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:1.25rem;padding:0.9rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-md);font-size:0.8rem;color:#94a3b8;">
        💡 <strong>How to claim:</strong> Select Credit Card or Debit Card EMI during checkout. Your bank will automatically convert the transaction into chosen monthly installments within 48 hours.
      </div>

      <div style="margin-top:1.25rem;text-align:right;">
        <button class="btn btn-primary btn-sm" onclick="window.closeGlassModal()">Close EMI Table</button>
      </div>
    `;

    showModalContent(html, '680px');
  }

  // ─── 4. Live Courier Tracking Modal ─────────────────────────
  function openTrackingModal(orderId) {
    const shortId = (orderId || 'ORD98472').toString().slice(-8).toUpperCase();
    const today = new Date();
    const formatDate = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const html = `
      <div style="margin-bottom:1.25rem;">
        <span class="recruiter-brand-badge">LIVE COURIER TRACKING</span>
        <h2 style="color:#f1f5f9;font-size:1.35rem;margin-top:0.3rem;">🚚 Shipment Status — #${shortId}</h2>
        <div style="display:flex;gap:1rem;color:#94a3b8;font-size:0.82rem;margin-top:0.25rem;">
          <span>Courier: <strong>BlueDart Express</strong></span>
          <span>·</span>
          <span>AWB: <strong>BLU${shortId}90IN</strong></span>
        </div>
      </div>

      <div class="tracking-timeline-wrap">
        <div class="tracking-step completed">
          <div class="tracking-dot">✓</div>
          <div class="tracking-text">
            <strong>Order Placed &amp; Payment Confirmed</strong>
            <small>${formatDate(3)} · Prepaid via UPI</small>
          </div>
        </div>

        <div class="tracking-step completed">
          <div class="tracking-dot">✓</div>
          <div class="tracking-text">
            <strong>Packed &amp; Dispatched from Delhi Warehouse</strong>
            <small>${formatDate(2)} · Security Sealed &amp; Quality Checked</small>
          </div>
        </div>

        <div class="tracking-step completed">
          <div class="tracking-dot">✓</div>
          <div class="tracking-text">
            <strong>Arrived at Destination Transit Hub</strong>
            <small>${formatDate(1)} · Sorting Facility, Primary Hub</small>
          </div>
        </div>

        <div class="tracking-step active">
          <div class="tracking-dot">🚚</div>
          <div class="tracking-text">
            <strong style="color:#38bdf8;">Out for Delivery to Doorstep</strong>
            <small>Today · Delivery Executive: <strong>Ramesh Kumar (+91 9876543210)</strong></small>
          </div>
        </div>
      </div>

      <div style="margin-top:1.5rem;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.78rem;color:#94a3b8;">Expected delivery: Today by 6:00 PM</span>
        <button class="btn btn-secondary btn-sm" onclick="window.closeGlassModal()">Close</button>
      </div>
    `;

    showModalContent(html, '620px');
  }

  // ─── 5. Printable Tax Invoice Generator ─────────────────────
  async function downloadInvoice(orderId) {
    const toast = window.showToast || ((m) => alert(m));
    toast('Generating official GST invoice...', 'info');

    try {
      let order = null;
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('arora_token')}`
          }
        });
        if (res.ok) order = await res.json();
      } catch (netErr) {
        console.warn('Invoice API fetch error, checking local store:', netErr);
      }

      if (!order) {
        // Fallback to local placed orders
        const localOrders = JSON.parse(localStorage.getItem('arora_local_orders') || '[]');
        order = localOrders.find(o => o._id === orderId);
      }

      if (!order) {
        throw new Error('Order details not found.');
      }

      const shortId = order._id.slice(-8).toUpperCase();
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>AroraCart Invoice #${shortId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
            .meta { text-align: right; font-size: 13px; color: #666; }
            .addresses { display: flex; justify-content: space-between; margin: 30px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f8f9fa; font-weight: bold; }
            .totals { margin-top: 20px; float: right; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .grand-total { font-weight: bold; font-size: 18px; color: #7c3aed; border-top: 2px solid #7c3aed; padding-top: 8px; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:20px;text-align:right;">
            <button onclick="window.print()" style="padding:8px 16px;background:#7c3aed;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">🖨️ Print / Save as PDF</button>
          </div>

          <div class="header">
            <div>
              <div class="logo">⚡ AroraCart Inc.</div>
              <p style="font-size:12px;color:#666;margin-top:4px;">GSTIN: 07AAAAA0000A1Z5 · CIN: U72200DL2026PTC123456</p>
              <p style="font-size:12px;color:#666;">Tech Park, Cyber Hub, New Delhi - 110001</p>
            </div>
            <div class="meta">
              <h2>TAX INVOICE</h2>
              <p><strong>Invoice No:</strong> ARC-${shortId}</p>
              <p><strong>Invoice Date:</strong> ${dateStr}</p>
              <p><strong>Order ID:</strong> #${shortId}</p>
            </div>
          </div>

          <div class="addresses">
            <div>
              <strong>Billed &amp; Shipped To:</strong><br/>
              ${order.shippingAddress.fullName}<br/>
              ${order.shippingAddress.address}<br/>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
              Phone: ${order.shippingAddress.phone}
            </div>
            <div style="text-align:right;">
              <strong>Payment Method:</strong> ${order.paymentMethod}<br/>
              <strong>Status:</strong> ${order.status} (Paid)<br/>
              <strong>Place of Supply:</strong> ${order.shippingAddress.state}, India
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Taxable Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map((it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${it.title}</strong></td>
                  <td>85183000</td>
                  <td>${it.quantity}</td>
                  <td>₹${it.price.toLocaleString('en-IN')}</td>
                  <td>₹${(it.price * it.quantity).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row"><span>Items Subtotal:</span><span>₹${order.itemsPrice.toLocaleString('en-IN')}</span></div>
            <div class="totals-row"><span>Shipping Charges:</span><span>${order.shippingPrice === 0 ? 'FREE' : '₹' + order.shippingPrice}</span></div>
            ${order.discountAmount > 0 ? `<div class="totals-row" style="color:#10b981;"><span>Discount (${order.couponCode || 'PROMO'}):</span><span>-₹${order.discountAmount.toLocaleString('en-IN')}</span></div>` : ''}
            <div class="totals-row grand-total"><span>Total Paid:</span><span>₹${order.totalAmount.toLocaleString('en-IN')}</span></div>
          </div>

          <div style="clear:both;"></div>

          <div class="footer">
            <p>This is a computer-generated tax invoice. No signature is required.</p>
            <p>Thank you for shopping with AroraCart · For warranty &amp; support visit https://aroracart.com</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
      } else {
        toast('Popup blocked. Please allow popups to view printable invoice.', 'error');
      }
    } catch (err) {
      toast('Could not generate invoice: ' + err.message, 'error');
    }
  }

  // ─── 6. Customer Help Center & Policy Center ────────────────
  function openHelpCenter(tab = 'faq') {
    const html = `
      <div style="margin-bottom:1.25rem;">
        <span class="recruiter-brand-badge">CUSTOMER CARE</span>
        <h2 style="color:#f1f5f9;font-size:1.4rem;margin-top:0.3rem;">❓ AroraCart Help &amp; Policy Center</h2>
      </div>

      <div class="recruiter-tabs-nav" style="margin-bottom:1rem;">
        <button class="recruiter-tab-btn ${tab === 'faq' ? 'active' : ''}" onclick="window.switchHelpTab('faq')" id="help-btn-faq">
          Frequently Asked Questions
        </button>
        <button class="recruiter-tab-btn ${tab === 'contact' ? 'active' : ''}" onclick="window.switchHelpTab('contact')" id="help-btn-contact">
          Contact Support Desk
        </button>
      </div>

      <div id="help-content-faq" style="${tab === 'faq' ? '' : 'display:none;'}">
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <details style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);padding:0.75rem 1rem;" open>
            <summary style="font-weight:700;color:#f1f5f9;cursor:pointer;">How do I track my order in real time?</summary>
            <p style="color:#cbd5e1;font-size:0.85rem;margin-top:0.5rem;line-height:1.5;">
              Navigate to the <strong>Orders</strong> page. Each order card features an active fulfillment progress timeline and a <strong>"Track Courier"</strong> button showing real-time milestone checkpoints.
            </p>
          </details>

          <details style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);padding:0.75rem 1rem;">
            <summary style="font-weight:700;color:#f1f5f9;cursor:pointer;">Can I cancel an order after placing it?</summary>
            <p style="color:#cbd5e1;font-size:0.85rem;margin-top:0.5rem;line-height:1.5;">
              Yes! Orders in <strong>Pending</strong> or <strong>Processing</strong> status have a 1-click <strong>"Cancel Order"</strong> button. The inventory stock is atomically restored to the catalog instantly.
            </p>
          </details>

          <details style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);padding:0.75rem 1rem;">
            <summary style="font-weight:700;color:#f1f5f9;cursor:pointer;">What payment modes are accepted?</summary>
            <p style="color:#cbd5e1;font-size:0.85rem;margin-top:0.5rem;line-height:1.5;">
              We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), and major Credit/Debit cards (Visa, MasterCard, RuPay).
            </p>
          </details>
        </div>
      </div>

      <div id="help-content-contact" style="${tab === 'contact' ? '' : 'display:none;'}">
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-md);padding:1.25rem;">
          <h4 style="color:#38bdf8;margin-bottom:0.5rem;">📞 Priority Customer Support</h4>
          <p style="color:#cbd5e1;font-size:0.85rem;line-height:1.6;margin-bottom:1rem;">
            Our customer champions are available 7 days a week, 9:00 AM – 9:00 PM IST.
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.75rem;font-size:0.85rem;">
            <div style="background:rgba(0,0,0,0.3);padding:0.75rem;border-radius:6px;">
              <span style="color:#94a3b8;display:block;font-size:0.75rem;">Email Support</span>
              <strong style="color:#f1f5f9;">support@aroracart.com</strong>
            </div>
            <div style="background:rgba(0,0,0,0.3);padding:0.75rem;border-radius:6px;">
              <span style="color:#94a3b8;display:block;font-size:0.75rem;">Toll-Free Helpline</span>
              <strong style="color:#f1f5f9;">1800-123-ARORA (27672)</strong>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:1.5rem;text-align:right;">
        <button class="btn btn-primary btn-sm" onclick="window.closeGlassModal()">Close Help Center</button>
      </div>
    `;

    showModalContent(html, '700px');
  }

  function switchHelpTab(tab) {
    document.querySelectorAll('.recruiter-tab-btn').forEach(b => b.classList.remove('active'));
    const faqTab = document.getElementById('help-content-faq');
    const contactTab = document.getElementById('help-content-contact');
    const btnFaq = document.getElementById('help-btn-faq');
    const btnContact = document.getElementById('help-btn-contact');

    if (tab === 'faq') {
      if (faqTab) faqTab.style.display = 'block';
      if (contactTab) contactTab.style.display = 'none';
      if (btnFaq) btnFaq.classList.add('active');
    } else {
      if (faqTab) faqTab.style.display = 'none';
      if (contactTab) contactTab.style.display = 'block';
      if (btnContact) btnContact.classList.add('active');
    }
  }

  // ─── 7. Product Share Helper ────────────────────────────────
  function shareProduct(title) {
    const toast = window.showToast || ((m) => alert(m));
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      toast(`🔗 Link for "${title}" copied to clipboard!`, 'success');
    } else {
      toast(`Share: ${url}`, 'info');
    }
  }

  // ─── 8. Auth Required Prompt Modal ──────────────────────────
  function showAuthPromptModal(product) {
    const toast = window.showToast || ((m) => alert(m));
    toast('🔒 Please sign in before adding items to your cart!', 'warning');

    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
    const prodTitle = product ? (product.title || 'this item') : 'this item';
    const prodImg = product && product.image ? `<img src="${product.image}" alt="${prodTitle}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,0.15);" />` : '';

    const html = `
      <div style="text-align:center;padding:0.75rem 0.25rem;">
        <div style="width:58px;height:58px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.8rem;">
          🔒
        </div>
        <span class="recruiter-brand-badge">AUTHENTICATION REQUIRED</span>
        <h2 style="color:#f1f5f9;font-size:1.4rem;margin:0.5rem 0 0.75rem;">Sign In to Add to Cart</h2>
        <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.55;max-width:440px;margin:0 auto 1.25rem;">
          You must be signed in to add <strong>${prodTitle}</strong> to your cart and proceed to checkout.
        </p>

        ${prodImg ? `
          <div style="display:inline-flex;align-items:center;gap:0.9rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:0.65rem 1rem;border-radius:var(--radius-md);margin-bottom:1.5rem;text-align:left;max-width:90%;">
            ${prodImg}
            <div>
              <div style="color:#f1f5f9;font-size:0.88rem;font-weight:600;line-height:1.3;">${prodTitle}</div>
              ${product && product.price ? `<div style="color:#38bdf8;font-size:0.9rem;font-weight:700;margin-top:0.25rem;">${typeof formatINR === 'function' ? formatINR(product.price) : '₹' + product.price}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <a href="/login.html?redirect=${redirectUrl}" class="btn btn-primary" style="padding:0.75rem 1.75rem;">
            🔑 Sign In to Account
          </a>
          <a href="/register.html?redirect=${redirectUrl}" class="btn btn-secondary" style="padding:0.75rem 1.5rem;">
            ✨ Create Account
          </a>
        </div>

        <div style="margin-top:1.5rem;border-top:1px solid rgba(255,255,255,0.08);padding-top:1rem;display:flex;justify-content:center;align-items:center;gap:0.5rem;">
          <button class="btn btn-sm" style="background:none;border:none;color:#38bdf8;cursor:pointer;text-decoration:underline;font-size:0.82rem;" onclick="window.demoSwitchRole && window.demoSwitchRole('customer')">
            ⚡ 1-Click Demo Login as Customer
          </button>
        </div>
      </div>
    `;

    showModalContent(html, '520px');
  }

  // Global Exports
  window.openInfoModal = openInfoModal;
  window.handleHeroPill = handleHeroPill;
  window.openEmiModal = openEmiModal;
  window.openTrackingModal = openTrackingModal;
  window.downloadInvoice = downloadInvoice;
  window.openHelpCenter = openHelpCenter;
  window.switchHelpTab = switchHelpTab;
  window.shareProduct = shareProduct;
  window.showAuthPromptModal = showAuthPromptModal;
  window.initInteractiveListeners = initInteractiveListeners;
  window.showModalContent = showModalContent;
  window.closeGlassModal = closeGlassModal;
})();

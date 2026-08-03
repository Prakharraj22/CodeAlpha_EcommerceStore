/**
 * AroraCart — Auth State Manager (auth.js)
 * Provides auth helpers: get/set user, logout, and dynamic nav update.
 */

/** @returns {Object|null} The current authenticated user from localStorage */
const getAuthUser = () => {
  try {
    const raw = localStorage.getItem('arora_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Persist auth data after login/register.
 * @param {Object} user - User object from API.
 * @param {string} token - JWT token.
 */
const setAuthData = (user, token) => {
  localStorage.setItem('arora_user', JSON.stringify(user));
  localStorage.setItem('arora_token', token);
  updateAuthUI();
};

/** Clear auth data and redirect to login */
const logoutUser = () => {
  localStorage.removeItem('arora_user');
  localStorage.removeItem('arora_token');
  localStorage.removeItem('arora_wishlist');
  showToast('Logged out successfully. See you soon!', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 700);
};

/**
 * Update the auth-nav-container and mobile login link based on auth state.
 * Call this after login, logout, or page load.
 */
const updateAuthUI = () => {
  const user = getAuthUser();
  const authNav = document.getElementById('auth-nav-container');
  const mobileLogin = document.getElementById('mobile-login-link');

  if (authNav) {
    if (user) {
      const firstName = user.name ? user.name.split(' ')[0] : 'User';
      authNav.innerHTML = `
        <div class="user-menu" id="user-menu">
          <button class="user-menu-trigger" id="user-menu-trigger" aria-haspopup="true" aria-expanded="false">
            <span class="user-avatar-circle">${firstName.charAt(0).toUpperCase()}</span>
            <span class="user-name-label">${firstName}</span>
            <span class="user-menu-chevron">▾</span>
          </button>
          <div class="user-dropdown" id="user-dropdown" role="menu" aria-label="User menu">
            <div class="user-dropdown-header">
              <strong>${user.name}</strong>
              <span>${user.email}</span>
            </div>
            <a href="/orders.html" class="dropdown-item" role="menuitem">📦 My Orders</a>
            <a href="/wishlist.html" class="dropdown-item" role="menuitem">♥ Wishlist</a>
            ${user.role === 'admin' ? '<a href="/admin.html" class="dropdown-item" role="menuitem">🛠️ Admin Panel</a>' : ''}
            <button onclick="logoutUser()" class="dropdown-item dropdown-logout" role="menuitem">🚪 Logout</button>
          </div>
        </div>
      `;

      // Toggle dropdown
      const trigger = document.getElementById('user-menu-trigger');
      const dropdown = document.getElementById('user-dropdown');
      if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = trigger.getAttribute('aria-expanded') === 'true';
          trigger.setAttribute('aria-expanded', String(!isOpen));
          dropdown.classList.toggle('open', !isOpen);
        });

        document.addEventListener('click', () => {
          trigger.setAttribute('aria-expanded', 'false');
          dropdown.classList.remove('open');
        });
      }
    } else {
      authNav.innerHTML = `
        <a href="/login.html" class="nav-link">Login</a>
        <a href="/register.html" class="btn btn-primary nav-cta-btn">Register Free</a>
      `;
    }
  }

  // Update mobile nav link
  if (mobileLogin) {
    if (user) {
      mobileLogin.textContent = '🚪 Logout';
      mobileLogin.href = '#';
      mobileLogin.onclick = (e) => { e.preventDefault(); logoutUser(); };
    } else {
      mobileLogin.textContent = '🔑 Login';
      mobileLogin.href = '/login.html';
      mobileLogin.onclick = null;
    }
  }
};

// Auto-run on every page load
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Exports
window.getAuthUser = getAuthUser;
window.setAuthData = setAuthData;
window.logoutUser = logoutUser;
window.updateAuthUI = updateAuthUI;

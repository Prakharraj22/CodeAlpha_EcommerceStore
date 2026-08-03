/**
 * AroraCart — Login Controller (login.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getAuthUser();
  if (user) {
    window.location.href = '/index.html';
    return;
  }

  const form = document.getElementById('login-form');
  if (form) form.addEventListener('submit', handleLoginSubmit);

  // Pre-fill email if redirected after session expiry
  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get('email');
  if (emailParam) {
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.value = emailParam;
  }
});

/** Handle login form submission */
const handleLoginSubmit = async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const submitBtn = document.getElementById('login-submit-btn');
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    showFieldError(errorEl, 'Please enter both email and password.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError(errorEl, 'Please enter a valid email address.');
    return;
  }

  if (errorEl) errorEl.hidden = true;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Signing in…'; }

  try {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthData(data, data.token);
    showToast(`👋 Welcome back, ${data.name}!`, 'success');

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    setTimeout(() => {
      window.location.href = redirect === 'checkout' ? '/checkout.html' : '/index.html';
    }, 800);
  } catch (err) {
    showFieldError(errorEl, err.message || 'Login failed. Please check your credentials.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
  }
};

const showFieldError = (el, message) => {
  if (el) { el.textContent = message; el.hidden = false; }
  else showToast(message, 'error');
};

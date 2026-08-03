/**
 * AroraCart — Register Controller (register.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getAuthUser();
  if (user) {
    window.location.href = '/index.html';
    return;
  }

  const form = document.getElementById('register-form');
  if (form) form.addEventListener('submit', handleRegisterSubmit);
});

/** Handle registration form submission */
const handleRegisterSubmit = async (e) => {
  e.preventDefault();

  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirmPassword = document.getElementById('reg-confirm-password')?.value;
  const submitBtn = document.getElementById('register-submit-btn');
  const errorEl = document.getElementById('register-error');

  // Validation
  if (!name || name.length < 2) {
    return showFieldError(errorEl, 'Please enter your full name (minimum 2 characters).');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showFieldError(errorEl, 'Please enter a valid email address.');
  }

  if (password.length < 6) {
    return showFieldError(errorEl, 'Password must be at least 6 characters long.');
  }

  if (password !== confirmPassword) {
    return showFieldError(errorEl, 'Passwords do not match. Please re-enter.');
  }

  if (errorEl) errorEl.hidden = true;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Creating account…'; }

  try {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    setAuthData(data, data.token);
    showToast(`🎉 Welcome to AroraCart, ${data.name}!`, 'success');
    setTimeout(() => (window.location.href = '/index.html'), 900);
  } catch (err) {
    showFieldError(errorEl, err.message || 'Registration failed. Please try again.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; }
  }
};

const showFieldError = (el, message) => {
  if (el) { el.textContent = message; el.hidden = false; }
  else showToast(message, 'error');
};

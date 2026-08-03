/**
 * AroraCart — Enhanced Toast Notification System (toast.js)
 * Supports: success, error, info, warning types
 * Auto-dismisses, stackable, with progress bar.
 */

const TOAST_DURATION = 3500;

/**
 * Display a toast notification.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'|'warning'} type - Toast type.
 * @param {number} [duration=3500] - Auto-dismiss duration in ms.
 */
const showToast = (message, type = 'info', duration = TOAST_DURATION) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'assertive');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${iconMap[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn" aria-label="Dismiss notification">✕</button>
    <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
  `;

  // Manual dismiss
  toast.querySelector('.toast-close-btn').addEventListener('click', () => dismissToast(toast));

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => toast.classList.add('visible'));

  // Auto-dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);

  // Pause progress on hover
  toast.addEventListener('mouseenter', () => {
    clearTimeout(timer);
    toast.querySelector('.toast-progress-bar').style.animationPlayState = 'paused';
  });
  toast.addEventListener('mouseleave', () => {
    toast.querySelector('.toast-progress-bar').style.animationPlayState = 'running';
    setTimeout(() => dismissToast(toast), 1500);
  });
};

/** Animate and remove a toast */
const dismissToast = (toast) => {
  if (!toast || !toast.parentNode) return;
  toast.classList.remove('visible');
  toast.classList.add('hiding');
  setTimeout(() => toast.remove(), 350);
};

window.showToast = showToast;

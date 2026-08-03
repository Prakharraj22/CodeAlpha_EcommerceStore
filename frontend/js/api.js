/**
 * AroraCart — Central API Client (api.js)
 * Handles all HTTP requests to the backend REST API.
 * Includes INR currency formatter.
 */

const API_BASE = '/api';

/**
 * Make an authenticated API request.
 * @param {string} endpoint - API endpoint (relative, starting with /)
 * @param {RequestInit} [options={}] - Fetch options (method, body, headers)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} With user-friendly message on HTTP or network errors
 */
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('arora_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle auth expiry gracefully
      if (response.status === 401) {
        localStorage.removeItem('arora_user');
        localStorage.removeItem('arora_token');
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Network error — please check your internet connection.');
    }
    throw err;
  }
};

/**
 * Format a number as Indian Rupees (₹ INR).
 * Example: formatINR(14999) → "₹14,999.00"
 * @param {number} amount - The amount to format.
 * @returns {string} Formatted INR string.
 */
const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

// Exports
window.fetchAPI = fetchAPI;
window.formatINR = formatINR;

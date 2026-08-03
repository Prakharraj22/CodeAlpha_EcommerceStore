/**
 * AroraCart — Shopping Cart Engine (cart.js)
 * Cart data persisted in localStorage.
 * All updates trigger badge refresh via updateCartBadge().
 */

const CART_KEY = 'arora_cart';

/** @returns {Array} Array of cart item objects from localStorage */
const getCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** Persist cart items to localStorage and update badge */
const saveCartItems = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
};

/**
 * Add a product to the cart (or increment quantity if already present).
 * @param {Object} product - Product object from API.
 * @param {number} [quantity=1] - Quantity to add.
 */
const addToCart = (product, quantity = 1) => {
  const items = getCartItems();
  const existingIndex = items.findIndex(item => item.product === product._id);

  if (existingIndex > -1) {
    const item = items[existingIndex];
    const newQty = item.quantity + quantity;

    if (newQty > product.stock) {
      showToast(`Max stock reached for "${product.title}" (${product.stock} available).`, 'warning');
      items[existingIndex].quantity = product.stock;
    } else {
      items[existingIndex].quantity = newQty;
      showToast(`Updated "${product.title}" quantity to ${newQty}.`, 'success');
    }
  } else {
    if (product.stock <= 0) {
      showToast(`"${product.title}" is currently out of stock.`, 'error');
      return;
    }
    items.push({
      product: product._id,
      title: product.title,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity: Math.min(quantity, product.stock),
    });
    showToast(`✅ "${product.title}" added to cart!`, 'success');
  }

  saveCartItems(items);
};

/**
 * Update the quantity of a specific cart item.
 * Pass quantity <= 0 to remove the item.
 * @param {string} productId - The product's _id.
 * @param {number} newQuantity - New quantity value.
 */
const updateCartQuantity = (productId, newQuantity) => {
  let items = getCartItems();
  const itemIndex = items.findIndex(i => i.product === productId);

  if (itemIndex === -1) return;

  if (newQuantity <= 0) {
    items.splice(itemIndex, 1);
    showToast('Item removed from cart.', 'info');
  } else {
    const item = items[itemIndex];
    items[itemIndex].quantity = Math.min(newQuantity, item.stock);
  }

  saveCartItems(items);
};

/**
 * Remove a specific item from the cart.
 * @param {string} productId - The product's _id.
 */
const removeFromCart = (productId) => {
  const items = getCartItems().filter(item => item.product !== productId);
  saveCartItems(items);
  showToast('Item removed from cart.', 'info');
};

/** Clear all items from the cart */
const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
};

/** Update the cart item-count badge in the navbar */
const updateCartBadge = () => {
  const items = getCartItems();
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
  }
};

// Run badge update on every page load
document.addEventListener('DOMContentLoaded', updateCartBadge);

// Exports
window.getCartItems = getCartItems;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.updateCartBadge = updateCartBadge;

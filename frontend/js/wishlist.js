// AroraCart Wishlist Manager
const getWishlistItems = () => {
  try {
    const list = localStorage.getItem('arora_wishlist');
    let items = list ? JSON.parse(list) : [];
    // Automatically purge legacy invalid IDs
    if (Array.isArray(items) && items.some(id => typeof id === 'string' && id.startsWith('66a1a1a1'))) {
      items = items.filter(id => typeof id === 'string' && !id.startsWith('66a1a1a1'));
      localStorage.setItem('arora_wishlist', JSON.stringify(items));
    }
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const toggleWishlistItem = async (productId) => {
  const user = getAuthUser();
  let wishlist = getWishlistItems();
  const index = wishlist.indexOf(productId);

  if (user) {
    try {
      const res = await fetchAPI('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
      wishlist = res.wishlist.map(item => typeof item === 'object' ? item._id : item);
      showToast(res.message, 'success');
    } catch (err) {
      // Graceful fallback to local storage if backend is in fallback mode or token is offline
      if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'info');
      } else {
        wishlist.push(productId);
        showToast('Added to wishlist!', 'success');
      }
    }
  } else {
    // Local fallback for non-logged in users
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push(productId);
      showToast('Added to wishlist!', 'success');
    }
  }

  localStorage.setItem('arora_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
};

const updateWishlistUI = () => {
  const wishlist = getWishlistItems();
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'inline-flex' : 'none';
  }
  const dockBadge = document.getElementById('dock-wishlist-badge');
  if (dockBadge) {
    dockBadge.textContent = wishlist.length;
    dockBadge.style.display = wishlist.length > 0 ? 'block' : 'none';
  }

  document.querySelectorAll('.wishlist-btn').forEach((btn) => {
    const pId = btn.dataset.productId;
    if (wishlist.includes(pId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};

document.addEventListener('DOMContentLoaded', updateWishlistUI);

window.getWishlistItems = getWishlistItems;
window.toggleWishlistItem = toggleWishlistItem;
window.updateWishlistUI = updateWishlistUI;

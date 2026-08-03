// AroraCart Wishlist Manager
const getWishlistItems = () => {
  const list = localStorage.getItem('arora_wishlist');
  return list ? JSON.parse(list) : [];
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
      showToast(err.message, 'error');
      return;
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

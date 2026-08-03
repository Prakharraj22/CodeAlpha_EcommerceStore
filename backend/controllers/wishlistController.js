const User = require('../models/User');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching wishlist' });
  }
};

// @desc    Add or remove product from wishlist (Toggle)
// @route   POST /api/wishlist/toggle
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(productId);

    let isAdded = false;
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
      isAdded = true;
    }

    await user.save();
    const updatedUser = await User.findById(req.user._id).populate('wishlist');

    res.json({
      message: isAdded ? 'Added to wishlist' : 'Removed from wishlist',
      isAdded,
      wishlist: updatedUser.wishlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating wishlist' });
  }
};

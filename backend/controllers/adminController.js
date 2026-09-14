const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

// @desc    Get admin analytics (real data only, no fabricated stats)
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      lowStockProducts,
      ordersByStatus,
      recentOrders,
      topProducts
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Product.find({ stock: { $gt: 0, $lte: 5 } }).select('title stock price').limit(10),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
      // Top products by order frequency
      Order.aggregate([
        { $unwind: '$orderItems' },
        { $group: { _id: '$orderItems.product', title: { $first: '$orderItems.title' }, orderCount: { $sum: '$orderItems.quantity' }, revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } } } },
        { $sort: { orderCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    // Calculate total revenue from delivered orders only
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['Delivered', 'Shipped', 'Processing'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      lowStockProducts,
      ordersByStatus,
      recentOrders,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching analytics' });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const statusFilter = req.query.status;

    const query = statusFilter ? { status: statusFilter } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('user', 'name email');

    res.json({ orders, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching orders' });
  }
};

// @desc    Update order status (admin)
// @route   PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: `Order status updated to "${status}"`, order });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating order status' });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching users' });
  }
};

// @desc    Update a product (admin) — edit price, stock, etc.
// @route   PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { price, originalPrice, stock, isFeatured, description, title } = req.body;

    // Validate values
    if (price !== undefined && price < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (originalPrice !== undefined && originalPrice < 0) return res.status(400).json({ message: 'Original price cannot be negative' });
    if (stock !== undefined && stock < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

    const allowedUpdates = {};
    if (title !== undefined) allowedUpdates.title = String(title).trim();
    if (description !== undefined) allowedUpdates.description = String(description).trim();
    if (price !== undefined) allowedUpdates.price = Number(price);
    if (originalPrice !== undefined) allowedUpdates.originalPrice = Number(originalPrice);
    if (stock !== undefined) allowedUpdates.stock = Number(stock);
    if (isFeatured !== undefined) allowedUpdates.isFeatured = Boolean(isFeatured);

    const product = await Product.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
};

// @desc    Delete a product (admin)
// @route   DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: `Product "${product.title}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting product' });
  }
};

// @desc    Get all coupons (admin)
// @route   GET /api/admin/coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons, total: coupons.length });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching coupons' });
  }
};

// @desc    Create a new coupon (admin)
// @route   POST /api/admin/coupons
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiryDate, usageLimit } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ message: 'Code, discountType, and discountValue are required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      isActive: true
    });

    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating coupon' });
  }
};

// @desc    Toggle coupon active/inactive (admin)
// @route   PATCH /api/admin/coupons/:id/toggle
exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'active' : 'inactive'}`, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error toggling coupon' });
  }
};

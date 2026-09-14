const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc    Create new order with server-side price & stock verification
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ message: 'Please provide full shipping details' });
    }

    // Server-side calculation & stock check
    let itemsPrice = 0;
    const verifiedItems = [];

    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ message: `Product ${item.title || item.product} no longer exists` });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${dbProduct.title}". Only ${dbProduct.stock} items remaining.`
        });
      }

      // Add to verified items using authoritative DB price
      itemsPrice += dbProduct.price * item.quantity;
      verifiedItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        quantity: item.quantity,
        price: dbProduct.price,
        image: dbProduct.image
      });
    }

    // Calculate coupon discount
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        let validCoupon = true;
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) validCoupon = false;
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) validCoupon = false;
        if (itemsPrice < coupon.minOrderAmount) validCoupon = false;
        
        if (validCoupon) {
          appliedCoupon = coupon;
          if (coupon.discountType === 'percentage') {
            discountAmount = (itemsPrice * coupon.discountValue) / 100;
            if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else if (coupon.discountType === 'flat') {
            discountAmount = coupon.discountValue;
          }
        }
      }
    }

    const shippingPrice = itemsPrice > 1999 ? 0 : 99; // Free shipping over ₹1,999
    const totalAmount = Math.max(0, itemsPrice + shippingPrice - discountAmount);

    // Deduct stock for ordered items (Atomic with manual rollback)
    const reservedItems = [];
    for (const item of verifiedItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback previously reserved items if one fails
        for (const reserved of reservedItems) {
          await Product.findByIdAndUpdate(reserved.product, {
            $inc: { stock: reserved.quantity }
          });
        }
        return res.status(400).json({
          message: `Checkout Error: Insufficient stock for "${item.title}". It may have just been purchased by someone else.`
        });
      }
      reservedItems.push(item);
    }

    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: verifiedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      itemsPrice,
      shippingPrice,
      discountAmount,
      totalAmount,
      couponCode: couponCode ? couponCode.toUpperCase() : '',
      status: 'Processing'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error processing order' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching your orders' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership or admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching order details' });
  }
};

// @desc    Cancel an order (user-controlled, Pending/Processing only)
// @route   PATCH /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only owner can cancel (admins use admin routes)
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You cannot cancel this order' });
    }

    const cancellableStatuses = ['Pending', 'Processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled — it is already "${order.status}". Please contact support.`
      });
    }

    // Restore stock for cancelled order items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Order successfully cancelled and stock restored', order });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error cancelling order' });
  }
};

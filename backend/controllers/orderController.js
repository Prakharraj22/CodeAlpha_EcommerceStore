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
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        if (itemsPrice >= coupon.minOrderAmount) {
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

    // Deduct stock for ordered items
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
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
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
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

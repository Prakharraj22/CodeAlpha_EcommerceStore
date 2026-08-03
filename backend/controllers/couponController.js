const Coupon = require('../models/Coupon');

// @desc    Validate and apply a promo code / coupon
// @route   POST /api/coupons/apply
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Please enter a coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon code' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `This coupon requires a minimum cart total of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    }

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discount),
      message: `Coupon "${coupon.code}" applied successfully! Saved ₹${Math.round(discount).toLocaleString('en-IN')}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error validating coupon' });
  }
};

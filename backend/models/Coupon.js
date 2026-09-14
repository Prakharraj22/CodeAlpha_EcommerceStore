const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    usageLimit: { type: Number, default: null }, // Null means unlimited
    usedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);

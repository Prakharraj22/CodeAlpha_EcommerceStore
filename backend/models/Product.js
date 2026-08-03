const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    brand: { type: String, default: 'AroraCart' },
    stock: { type: Number, required: true, default: 0, min: 0 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    image: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    specifications: [{ key: String, value: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

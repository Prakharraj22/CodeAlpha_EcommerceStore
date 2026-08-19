const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const fallbackProducts = require('../config/fallbackProducts');

// Helper to filter in-memory fallback items
const filterFallbackProducts = ({ category, search, sort, minPrice, maxPrice }) => {
  let list = [...fallbackProducts];

  if (category && category !== 'All') {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s)
    );
  }

  if (minPrice) {
    list = list.filter((p) => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    list = list.filter((p) => p.price <= Number(maxPrice));
  }

  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'rating-desc') list.sort((a, b) => b.rating - a.rating);

  const categories = [...new Set(fallbackProducts.map((p) => p.category))];
  return { products: list, categories };
};

// @desc    Fetch all products with search, category filter, and sorting
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    // If DB connection is not fully open (1 = CONNECTED), use instant fallback
    if (mongoose.connection.readyState !== 1) {
      const fallbackData = filterFallbackProducts(req.query);
      return res.json(fallbackData);
    }

    const { category, search, sort, minPrice, maxPrice } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc') sortOptions = { price: 1 };
    else if (sort === 'price-desc') sortOptions = { price: -1 };
    else if (sort === 'rating-desc') sortOptions = { rating: -1 };

    const dbProducts = await Product.find(query).sort(sortOptions);
    const dbCategories = await Product.distinct('category');

    if (dbProducts && dbProducts.length > 0) {
      return res.json({ products: dbProducts, categories: dbCategories });
    }

    // Fallback if DB returns 0 items
    const fallbackData = filterFallbackProducts(req.query);
    res.json(fallbackData);
  } catch (error) {
    console.warn('⚠️ Product DB query fallback triggered:', error.message);
    const fallbackData = filterFallbackProducts(req.query);
    res.json(fallbackData);
  }
};

// @desc    Fetch single product details & reviews
// @route   GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (product) {
        const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
        return res.json({ product, reviews });
      }
    }

    // Search in fallback list
    const fallbackProduct = fallbackProducts.find((p) => String(p._id) === String(req.params.id));
    if (fallbackProduct) {
      return res.json({ product: fallbackProduct, reviews: [] });
    }

    res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    console.warn('⚠️ Product Detail DB query fallback triggered:', error.message);
    const fallbackProduct = fallbackProducts.find((p) => String(p._id) === String(req.params.id));
    if (fallbackProduct) {
      return res.json({ product: fallbackProduct, reviews: [] });
    }
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Create new product review
// @route   POST /api/products/:id/reviews
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please provide both rating (1-5) and review comment' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({ product: productId, user: req.user._id });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already submitted a review for this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    });

    const reviews = await Review.find({ product: productId });
    product.numReviews = reviews.length;
    product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await product.save();

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating product review' });
  }
};

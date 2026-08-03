require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const Review = require('./models/Review');
const Order = require('./models/Order');

// ─── Connection ──────────────────────────────────────────────────────────────
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');
};

// ─── Users ───────────────────────────────────────────────────────────────────
const usersData = [
  {
    name: 'Admin User',
    email: 'admin@aroracart.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Demo User',
    email: 'demo@aroracart.com',
    password: 'Demo@123',
    role: 'user',
  },
];

// ─── Products (24 Verified Products Retained) ───────────────────────────────
const productsData = [
  // ── 1. AUDIO (5 products) ──────────────────────────────────────────────────
  {
    title: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    category: 'Audio',
    description:
      'Industry-leading noise cancellation technology with 30-hour battery life and crystal-clear call quality. Lightweight foldable design with premium cushioning makes it perfect for long listening sessions on flights and daily commutes.',
    price: 26999,
    originalPrice: 34990,
    stock: 35,
    rating: 4.8,
    numReviews: 142,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Driver Size', value: '30mm' },
      { key: 'Battery Life', value: '30 Hours' },
      { key: 'Connectivity', value: 'Bluetooth 5.2' },
    ],
  },
  {
    title: 'boAt Rockerz 550 Over-Ear Headphones',
    brand: 'boAt',
    category: 'Audio',
    description:
      'Powerful 50mm dynamic drivers deliver immersive bass-heavy sound with up to 20 hours of playtime. The padded ear cushions and adjustable headband ensure a snug, fatigue-free fit during extended listening.',
    price: 1799,
    originalPrice: 2990,
    stock: 60,
    rating: 4.2,
    numReviews: 98,
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Driver Size', value: '50mm' },
      { key: 'Battery Life', value: '20 Hours' },
      { key: 'Connectivity', value: 'Bluetooth 5.0' },
    ],
  },
  {
    title: 'Apple AirPods Pro (2nd Gen)',
    brand: 'Apple',
    category: 'Audio',
    description:
      'Next-generation Active Noise Cancellation blocks out the world so you can focus on what matters most. Adaptive Audio dynamically blends ANC and Transparency mode for the best listening experience in any environment.',
    price: 19990,
    originalPrice: 24900,
    stock: 25,
    rating: 4.9,
    numReviews: 135,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Chip', value: 'Apple H2' },
      { key: 'Battery Life', value: '6 Hours (30 with case)' },
      { key: 'Water Resistance', value: 'IPX4' },
    ],
  },
  {
    title: 'JBL Flip 6 Portable Bluetooth Speaker',
    brand: 'JBL',
    category: 'Audio',
    description:
      'Powerful JBL Original Pro Sound with a racetrack-shaped woofer and separate tweeter for clear highs and punchy bass. IP67 waterproof and dustproof rating makes it your ideal companion for outdoor adventures.',
    price: 9499,
    originalPrice: 11999,
    stock: 45,
    rating: 4.6,
    numReviews: 88,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Output Power', value: '30W' },
      { key: 'Battery Life', value: '12 Hours' },
      { key: 'Water Resistance', value: 'IP67' },
    ],
  },
  {
    title: 'boAt Airdopes 141 True Wireless Earbuds',
    brand: 'boAt',
    category: 'Audio',
    description:
      'Lightweight ergonomic earbuds with 42-hour total playtime and BEAST™ Mode for ultra-low latency gaming. The ENx technology ensures crystal-clear voice calls by filtering out background noise effectively.',
    price: 999,
    originalPrice: 1499,
    stock: 55,
    rating: 4.1,
    numReviews: 120,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Total Playtime', value: '42 Hours' },
      { key: 'Driver Size', value: '6mm' },
      { key: 'Water Resistance', value: 'IPX4' },
    ],
  },

  // ── 2. WEARABLES (5 products) ──────────────────────────────────────────────
  {
    title: 'Apple Watch Series 9 (GPS, 45mm)',
    brand: 'Apple',
    category: 'Wearables',
    description:
      'The most powerful Apple Watch ever features a new S9 chip, a brighter Always-On Retina display, and the innovative Double Tap gesture. Advanced health sensors track blood oxygen, ECG, and temperature around the clock.',
    price: 41900,
    originalPrice: 44900,
    stock: 18,
    rating: 4.9,
    numReviews: 95,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Display', value: '45mm Always-On Retina' },
      { key: 'Battery Life', value: '18 Hours' },
      { key: 'Water Resistance', value: 'WR50M' },
    ],
  },
  {
    title: 'Samsung Galaxy Watch 6 Classic 47mm',
    brand: 'Samsung',
    category: 'Wearables',
    description:
      'Premium stainless steel body with the iconic rotating bezel for intuitive navigation and a polished look. Advanced BioActive Sensor tracks over 90+ exercises, sleep stages, and body composition for comprehensive health insights.',
    price: 32999,
    originalPrice: 42999,
    stock: 22,
    rating: 4.6,
    numReviews: 74,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Display', value: '1.5" Super AMOLED' },
      { key: 'Battery', value: '425mAh' },
      { key: 'OS', value: 'Wear OS 4' },
    ],
  },
  {
    title: 'Fitbit Charge 6 Fitness Tracker',
    brand: 'Fitbit',
    category: 'Wearables',
    description:
      'Built-in GPS and Google Maps integration help you navigate your runs without your phone, while the ECG app can assess heart rhythm for AFib. The 7-day battery life and comprehensive sleep tracking make it a 24/7 health companion.',
    price: 12999,
    originalPrice: 16999,
    stock: 30,
    rating: 4.4,
    numReviews: 56,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'GPS', value: 'Built-in' },
      { key: 'Battery Life', value: '7 Days' },
      { key: 'Water Resistance', value: '50M' },
    ],
  },
  {
    title: 'Noise ColorFit Pro 4 Smartwatch',
    brand: 'Noise',
    category: 'Wearables',
    description:
      'A stunning 1.72-inch TFT LCD display paired with BT calling capability lets you make and receive calls directly from your wrist. Over 150 watch faces, SpO2 monitoring, and 7-day battery life make it a complete budget smartwatch.',
    price: 2499,
    originalPrice: 3999,
    stock: 50,
    rating: 4.0,
    numReviews: 130,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Display', value: '1.72" TFT LCD' },
      { key: 'Battery Life', value: '7 Days' },
      { key: 'Calling', value: 'Bluetooth Calling' },
    ],
  },
  {
    title: 'Garmin Forerunner 265 Running Watch',
    brand: 'Garmin',
    category: 'Wearables',
    description:
      'Vibrant AMOLED display with advanced running metrics including training readiness, HRV status, and daily suggested workouts. Multi-band GPS technology delivers accurate positioning in challenging environments like dense urban canyons.',
    price: 44999,
    originalPrice: 49999,
    stock: 12,
    rating: 4.8,
    numReviews: 38,
    image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Display', value: '1.3" AMOLED' },
      { key: 'Battery Life', value: '13 Days (smartwatch mode)' },
      { key: 'GPS', value: 'Multi-band GPS' },
    ],
  },

  // ── 3. PERIPHERALS (5 products) ────────────────────────────────────────────
  {
    title: 'Logitech MX Keys Advanced Wireless Keyboard',
    brand: 'Logitech',
    category: 'Peripherals',
    description:
      'Spherically-dished keys with perfect keystroke depth, stability, and feedback for an accurate, comfortable typing experience. Smart Illumination with hand proximity detection conserves power while keeping backlight available when you need it.',
    price: 8495,
    originalPrice: 9995,
    stock: 28,
    rating: 4.7,
    numReviews: 67,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Switch Type', value: 'Scissor' },
      { key: 'Connectivity', value: 'Bluetooth / USB-C' },
      { key: 'Battery Life', value: '10 Days (backlit)' },
    ],
  },
  {
    title: 'Razer BlackWidow V4 Mechanical Keyboard',
    brand: 'Razer',
    category: 'Peripherals',
    description:
      'Razer Yellow linear switches deliver lightning-fast actuation at 1.2mm with silent keystrokes for competitive gaming. Fully programmable with per-key Razer Chroma RGB lighting featuring 16.8 million colour options and multi-layer effects.',
    price: 12999,
    originalPrice: 15999,
    stock: 20,
    rating: 4.6,
    numReviews: 44,
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Switch', value: 'Razer Yellow Linear' },
      { key: 'Actuation', value: '1.2mm' },
      { key: 'RGB', value: 'Per-key Chroma RGB' },
    ],
  },
  {
    title: 'Logitech MX Master 3S Wireless Mouse',
    brand: 'Logitech',
    category: 'Peripherals',
    description:
      'Ultra-precise 8000 DPI optical sensor works flawlessly on any surface, including glass, for pixel-perfect tracking. MagSpeed electromagnetic scrolling lets you scroll 1000 lines per second silently and with pinpoint precision.',
    price: 9495,
    originalPrice: 11495,
    stock: 32,
    rating: 4.8,
    numReviews: 89,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'DPI', value: '200–8000' },
      { key: 'Battery Life', value: '70 Days' },
      { key: 'Connectivity', value: 'Bluetooth / USB-A' },
    ],
  },
  {
    title: 'Razer DeathAdder V3 HyperSpeed Gaming Mouse',
    brand: 'Razer',
    category: 'Peripherals',
    description:
      'Featuring Razer HyperSpeed wireless technology, it is up to 25% faster than other wireless technologies for zero-compromise gaming. The Focus X optical sensor delivers flawless tracking at up to 14000 DPI in an ultra-lightweight 55g frame.',
    price: 5999,
    originalPrice: 6999,
    stock: 38,
    rating: 4.5,
    numReviews: 52,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'DPI', value: 'Up to 14000' },
      { key: 'Weight', value: '55g' },
      { key: 'Battery Life', value: '100 Hours' },
    ],
  },
  {
    title: 'Zebronics Zeb-Transformer Mechanical Keyboard',
    brand: 'Zebronics',
    category: 'Peripherals',
    description:
      'Full-size mechanical keyboard with Blue switches provides a satisfying tactile click for both gaming and office productivity. Multi-colour RGB backlight with 9 lighting effects adds a vibrant aesthetic to any desktop setup.',
    price: 1299,
    originalPrice: 1699,
    stock: 45,
    rating: 3.9,
    numReviews: 110,
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Switch', value: 'Blue Mechanical' },
      { key: 'Layout', value: 'Full Size 104 Keys' },
      { key: 'Backlight', value: 'RGB 9 Modes' },
    ],
  },

  // ── 4. TABLETS (4 products) ────────────────────────────────────────────────
  {
    title: 'Apple iPad Air (M2, 11-inch, Wi-Fi, 256GB)',
    brand: 'Apple',
    category: 'Tablets',
    description:
      'Supercharged by the powerhouse M2 chip, the iPad Air delivers incredible performance for creative workflows, gaming, and multitasking. The stunning Liquid Retina display with True Tone and P3 wide colour makes every image look vibrant and true to life.',
    price: 74900,
    originalPrice: 79900,
    stock: 14,
    rating: 4.9,
    numReviews: 72,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Chip', value: 'Apple M2' },
      { key: 'Display', value: '11-inch Liquid Retina' },
      { key: 'Storage', value: '256GB' },
    ],
  },
  {
    title: 'Samsung Galaxy Tab S9 FE 5G (256GB)',
    brand: 'Samsung',
    category: 'Tablets',
    description:
      'Featuring a 10.9-inch WUXGA TFT display and the included S Pen, the Tab S9 FE is your perfect canvas for sketching and note-taking. The IP68 water and dust resistance rating means you can take it anywhere without worry.',
    price: 42999,
    originalPrice: 54999,
    stock: 20,
    rating: 4.5,
    numReviews: 58,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Display', value: '10.9" WUXGA TFT' },
      { key: 'Storage', value: '256GB' },
      { key: 'Connectivity', value: '5G + Wi-Fi 6' },
    ],
  },
  {
    title: 'Lenovo Tab P12 Pro (12.6-inch, 8GB RAM)',
    brand: 'Lenovo',
    category: 'Tablets',
    description:
      'A stunning 12.6-inch 2K AMOLED display with 120Hz refresh rate brings movies, shows, and creative work to vivid life. Quad-speaker system tuned by JBL with Dolby Atmos creates a rich, immersive audio experience wherever you are.',
    price: 44999,
    originalPrice: 54999,
    stock: 10,
    rating: 4.4,
    numReviews: 28,
    image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Display', value: '12.6" 2K AMOLED 120Hz' },
      { key: 'RAM', value: '8GB' },
      { key: 'Audio', value: 'Quad JBL + Dolby Atmos' },
    ],
  },
  {
    title: 'Realme Pad 2 (6GB RAM, 128GB)',
    brand: 'Realme',
    category: 'Tablets',
    description:
      'A large 11.5-inch 2K display with 120Hz adaptive refresh rate at a budget-friendly price point makes it perfect for students and media enthusiasts. The massive 8360mAh battery with 33W fast charging keeps you powered through long study or entertainment sessions.',
    price: 17999,
    originalPrice: 22999,
    stock: 28,
    rating: 4.1,
    numReviews: 85,
    image: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Display', value: '11.5" 2K 120Hz' },
      { key: 'Battery', value: '8360mAh + 33W Fast Charge' },
      { key: 'RAM', value: '6GB' },
    ],
  },

  // ── 5. CAMERAS (2 products) ────────────────────────────────────────────────
  {
    title: 'Sony Alpha ZV-E10 II Mirrorless Camera',
    brand: 'Sony',
    category: 'Cameras',
    description:
      'A 26MP APS-C Exmor RS CMOS sensor and real-time Eye AF make it the ultimate vlogging camera with professional image quality. 4K60p video, a fully articulating LCD touchscreen, and a built-in directional 3-capsule mic ensure you capture every moment perfectly.',
    price: 74990,
    originalPrice: 84990,
    stock: 10,
    rating: 4.8,
    numReviews: 42,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Sensor', value: '26MP APS-C Exmor RS' },
      { key: 'Video', value: '4K60p' },
      { key: 'Stabilisation', value: 'Electronic (Active Mode)' },
    ],
  },
  {
    title: 'Canon EOS R50 Mirrorless Camera (Body Only)',
    brand: 'Canon',
    category: 'Cameras',
    description:
      'Featuring a 24.2MP APS-C CMOS sensor and Canon\'s powerful DIGIC X processor for outstanding image quality and speed for beginners and enthusiasts. Subject Tracking via deep learning AI confidently keeps your subject — people, animals, or vehicles — in sharp focus.',
    price: 59990,
    originalPrice: 69990,
    stock: 12,
    rating: 4.6,
    numReviews: 34,
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Sensor', value: '24.2MP APS-C CMOS' },
      { key: 'Video', value: '4K30p / 1080p120p' },
      { key: 'AF System', value: 'Dual Pixel CMOS AF II' },
    ],
  },

  // ── 6. SMART HOME (1 product) ──────────────────────────────────────────────
  {
    title: 'Amazon Echo (4th Gen) Smart Speaker',
    brand: 'Amazon',
    category: 'Smart Home',
    description:
      'The globe-shaped Echo delivers premium 360° audio with a 3-inch woofer and dual tweeters for full, rich sound that automatically adapts to any room. Built-in Alexa lets you play music, control smart home devices, set reminders, and get answers — all hands-free.',
    price: 7999,
    originalPrice: 9999,
    stock: 42,
    rating: 4.6,
    numReviews: 108,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Speaker', value: '3" Woofer + Dual Tweeters' },
      { key: 'Assistant', value: 'Alexa Built-in' },
      { key: 'Smart Home Hub', value: 'Zigbee + Matter' },
    ],
  },

  // ── 7. GAMING (2 products) ─────────────────────────────────────────────────
  {
    title: 'Xbox Wireless Controller (Robot White)',
    brand: 'Microsoft',
    category: 'Gaming',
    description:
      'The redesigned controller features textured grips on the back and trigger/bumpers and a USB-C port for a modernised, comfortable hold. Share button makes it easy to capture and share your greatest gaming moments directly from the controller.',
    price: 5490,
    originalPrice: 5990,
    stock: 35,
    rating: 4.7,
    numReviews: 96,
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    specifications: [
      { key: 'Connectivity', value: 'Xbox Wireless / Bluetooth / USB-C' },
      { key: 'Battery', value: '2x AA' },
      { key: 'Platform', value: 'Xbox / PC / Mobile' },
    ],
  },
  {
    title: 'HyperX Cloud Alpha Wireless Gaming Headset',
    brand: 'HyperX',
    category: 'Gaming',
    description:
      'Up to 300 hours of battery life on a single charge makes it the longest-lasting wireless gaming headset, so you never have to stop mid-game to recharge. HyperX dual chamber drivers deliver powerful, clear audio with reduced distortion even at high volumes.',
    price: 14999,
    originalPrice: 19999,
    stock: 22,
    rating: 4.7,
    numReviews: 58,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    specifications: [
      { key: 'Battery Life', value: '300 Hours' },
      { key: 'Connectivity', value: '2.4GHz USB Dongle' },
      { key: 'Driver', value: 'Dual Chamber Dynamic' },
    ],
  },
];

// ─── Coupons ──────────────────────────────────────────────────────────────────
const couponsData = [
  {
    code: 'ARORA10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 2000,
    maxDiscountAmount: 1500,
    isActive: true,
    usageLimit: 1000,
    usedCount: 0,
    expiresAt: new Date('2027-12-31'),
  },
  {
    code: 'WELCOME500',
    discountType: 'flat',
    discountValue: 500,
    minOrderAmount: 3000,
    maxDiscountAmount: 500,
    isActive: true,
    usageLimit: 500,
    usedCount: 0,
    expiresAt: new Date('2027-12-31'),
  },
  {
    code: 'TECH20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 5000,
    maxDiscountAmount: 3000,
    isActive: true,
    usageLimit: 300,
    usedCount: 0,
    expiresAt: new Date('2027-12-31'),
  },
  {
    code: 'SAVE1000',
    discountType: 'flat',
    discountValue: 1000,
    minOrderAmount: 8000,
    maxDiscountAmount: 1000,
    isActive: true,
    usageLimit: 200,
    usedCount: 0,
    expiresAt: new Date('2027-12-31'),
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────
const seedDB = async () => {
  try {
    await connectDB();

    // ── Clear all collections ──────────────────────────────────────────────
    console.log('🗑️   Clearing all collections...');
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Coupon.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('✅  All collections cleared');

    // ── Create Users ───────────────────────────────────────────────────────
    console.log('👤  Creating users...');
    const createdUsers = [];
    for (const userData of usersData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const user = await User.create({ ...userData, password: hashedPassword });
      createdUsers.push(user);
    }
    const adminUser = createdUsers[0];
    const demoUser = createdUsers[1];
    console.log(`✅  Created ${createdUsers.length} users`);

    // ── Insert Products ────────────────────────────────────────────────────
    console.log('📦  Inserting products...');
    const createdProducts = await Product.insertMany(productsData);
    console.log(`✅  Inserted ${createdProducts.length} products`);

    // ── Insert Coupons ─────────────────────────────────────────────────────
    console.log('🏷️   Inserting coupons...');
    const createdCoupons = await Coupon.insertMany(couponsData);
    console.log(`✅  Inserted ${createdCoupons.length} coupons`);

    // ── Add Sample Reviews ─────────────────────────────────────────────────
    console.log('⭐  Adding sample reviews...');
    const reviewsData = [
      {
        user: demoUser._id,
        userName: demoUser.name,
        product: createdProducts[0]._id,
        rating: 5,
        comment:
          'Absolutely phenomenal noise cancellation — you can barely hear anything on a crowded metro. The sound quality is rich and detailed, and 30-hour battery life is no joke. Worth every rupee!',
      },
      {
        user: adminUser._id,
        userName: adminUser.name,
        product: createdProducts[2]._id,
        rating: 5,
        comment:
          'The Adaptive Audio feature is genuinely magical — it just works. The fit is secure and comfortable, and call quality is exceptional. Best earbuds I have ever owned by a long margin.',
      },
      {
        user: demoUser._id,
        userName: demoUser.name,
        product: createdProducts[5]._id,
        rating: 5,
        comment:
          'The Double Tap gesture is super convenient and the always-on display looks stunning. Health tracking is accurate and comprehensive. A complete upgrade from my old fitness band.',
      },
    ];
    const createdReviews = await Review.insertMany(reviewsData);
    console.log(`✅  Added ${createdReviews.length} sample reviews`);

    // ── Summary ────────────────────────────────────────────────────────────
    const featuredCount = productsData.filter((p) => p.isFeatured).length;
    const categories = [...new Set(productsData.map((p) => p.category))];

    console.log('\n' + '═'.repeat(55));
    console.log('🎉  AroraCart Database Seeded Successfully!');
    console.log('═'.repeat(55));
    console.log(`📦  Products  : ${createdProducts.length} (${featuredCount} featured)`);
    console.log(`🗂️   Categories: ${categories.join(', ')}`);
    console.log(`🏷️   Coupons   : ${createdCoupons.length}`);
    console.log(`⭐  Reviews   : ${createdReviews.length}`);
    console.log('─'.repeat(55));
    console.log('👑  Admin     : admin@aroracart.com  /  Admin@123');
    console.log('👤  Demo User : demo@aroracart.com   /  Demo@123');
    console.log('═'.repeat(55) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌  Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDB();

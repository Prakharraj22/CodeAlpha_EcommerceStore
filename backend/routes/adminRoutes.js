const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateProduct,
  deleteProduct,
  getAllCoupons,
  createCoupon,
  toggleCoupon
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, admin);

// Analytics
router.get('/analytics', getAnalytics);

// Order management
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// User management
router.get('/users', getAllUsers);

// Product management
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Coupon management
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id/toggle', toggleCoupon);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { register, login, forgotPassword, resetPassword, changePassword, getProfile } = require('../controllers/authController');
const { body } = require('express-validator');
const { createService, getServices, getAllServices, updateService, deleteService, createOffer, getOffers, updateOffer, deleteOffer, validateCoupon, createCoupon, updateCoupon, deleteCoupon, createBooking, createOrder, verifyPayment, getMyBookings, getAllBookings, updateBooking, getOrders, getAllOrders, getAllUsers, deactivateUser, deleteUser, sendNotification, getNotifications, markNotificationRead, getAllNotifications, getAdminDashboard } = require('../controllers/authController');

router.post('/register', [body('fullName').notEmpty().withMessage('Full name is required'), body('email').isEmail().withMessage('Valid email is required'), body('phone').notEmpty().withMessage('Phone is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')], register);
router.post('/login', [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')], login);
router.post('/forgot-password', [body('email').isEmail().withMessage('Valid email is required')], forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), body('email').isEmail(), body('newPassword').isLength({ min: 6 })], resetPassword);
router.put('/change-password', authMiddleware, [body('oldPassword').notEmpty(), body('newPassword').isLength({ min: 6 })], changePassword);
router.get('/profile', authMiddleware, getProfile);

router.get('/services', getServices);
router.get('/services/all', authMiddleware, adminOnly, getAllServices);
router.post('/services', authMiddleware, adminOnly, createService);
router.put('/services/:id', authMiddleware, adminOnly, updateService);
router.delete('/services/:id', authMiddleware, adminOnly, deleteService);

router.get('/offers', getOffers);
router.post('/offers', authMiddleware, adminOnly, createOffer);
router.put('/offers/:id', authMiddleware, adminOnly, updateOffer);
router.delete('/offers/:id', authMiddleware, adminOnly, deleteOffer);

router.post('/coupons/validate', validateCoupon);
router.get('/coupons', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { Coupon } = require('../models');
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching coupons', error: err.message });
  }
});
router.post('/coupons', authMiddleware, adminOnly, createCoupon);
router.put('/coupons/:id', authMiddleware, adminOnly, updateCoupon);
router.delete('/coupons/:id', authMiddleware, adminOnly, deleteCoupon);

router.post('/bookings', authMiddleware, createBooking);
router.get('/bookings', authMiddleware, getAllBookings);
router.get('/bookings/my', authMiddleware, getMyBookings);
router.put('/bookings/:id', authMiddleware, adminOnly, updateBooking);

router.post('/orders/create', authMiddleware, createOrder);
router.post('/orders/verify', authMiddleware, verifyPayment);
router.get('/orders/my', authMiddleware, getOrders);
router.get('/orders', authMiddleware, adminOnly, getAllOrders);

router.get('/users', authMiddleware, adminOnly, getAllUsers);
router.put('/users/:id/deactivate', authMiddleware, adminOnly, deactivateUser);
router.delete('/users/:id', authMiddleware, adminOnly, deleteUser);

router.post('/notifications/send', authMiddleware, adminOnly, sendNotification);
router.get('/notifications', authMiddleware, getNotifications);
router.put('/notifications/:id/read', authMiddleware, markNotificationRead);
router.get('/notifications/all', authMiddleware, adminOnly, getAllNotifications);
router.get('/admin/dashboard', authMiddleware, adminOnly, getAdminDashboard);

module.exports = router;

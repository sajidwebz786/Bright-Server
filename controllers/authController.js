const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Service, Coupon, Offer, Booking, Order, Payment, Notification, Feedback } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'brightsoul-secret-2026';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendNotificationEmail(email, subject, html) {
  try {
    if (!process.env.EMAIL_USER) return;
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject, html });
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

function generateOrderId() {
  return 'BS' + Date.now() + Math.floor(Math.random() * 1000);
}

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { fullName, email, phone, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, phone, password: hashedPassword });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, portal } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ message: 'Account is deactivated' });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });
    if (portal === 'admin' && !user.isAdmin) return res.status(403).json({ message: 'This account is not an administrator. Use Customer Login.' });
    if (portal === 'customer' && user.isAdmin) return res.status(403).json({ message: 'Administrator accounts must use Admin Login.' });
    await user.update({ lastLogin: new Date() });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.update({ resetToken, resetTokenExpiry });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    await sendNotificationEmail(email, 'Reset your Bright Soul password', `Click this link to reset: <a href="${resetLink}">${resetLink}</a>`);
    res.json({ message: 'Password reset link sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    const user = await User.findOne({ where: { email, resetToken: token, resetTokenExpiry: { [require('sequelize').Op.gt]: new Date() } } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword, resetToken: null, resetTokenExpiry: null });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return res.status(401).json({ message: 'Incorrect old password' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: 'Error creating service', error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const services = await Service.findAll({ where: { isActive: true }, order: [['category', 'ASC'], ['duration', 'ASC']] });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching services', error: err.message });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({ order: [['category', 'ASC'], ['duration', 'ASC']] });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching services', error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    await service.update(req.body);
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: 'Error updating service', error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    await service.update({ isActive: false });
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting service', error: err.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.findAll({ where: { isActive: true, validFrom: { [require('sequelize').Op.lte]: new Date() }, validTo: { [require('sequelize').Op.gte]: new Date() } }, order: [['createdAt', 'DESC']] });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching offers', error: err.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const offer = await Offer.create({ ...req.body, createdByAdminId: req.user.id });
    if (req.body.sendNotification) {
      const users = await User.findAll({ where: { isActive: true }, attributes: ['id', 'email'] });
      const notifications = users.map(u => ({ ...req.body, userId: u.id, offerId: offer.id, type: 'offer', sentToAll: true, sentByAdminId: req.user.id }));
      await Notification.bulkCreate(notifications);
      await Promise.all(users.map(u => sendNotificationEmail(u.email, `New Offer: ${req.body.title}`, `<h2>${req.body.title}</h2><p>${req.body.description}</p><p>Offer Price: ₹${req.body.offerPrice}</p>`)));
    }
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Error creating offer', error: err.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    await offer.update(req.body);
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Error updating offer', error: err.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    await offer.update({ isActive: false });
    res.json({ message: 'Offer deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting offer', error: err.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), isActive: true, validFrom: { [require('sequelize').Op.lte]: new Date() }, validTo: { [require('sequelize').Op.gte]: new Date() } } });
    if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (orderAmount < coupon.minOrderAmount) return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    const userId = req.user ? req.user.id : null;
    if (userId) {
      const used = await Order.findAll({ where: { userId, couponCode: coupon.code, status: 'paid' } });
      if (used.length >= (coupon.usagePerUser || 1)) return res.status(400).json({ message: 'You have already used this coupon' });
    }
    const discount = coupon.discountType === 'percentage' ? Math.min(orderAmount * coupon.discountValue / 100, coupon.maxDiscount || Infinity) : coupon.discountValue;
    res.json({ couponId: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrderAmount: coupon.minOrderAmount, calculatedDiscount: discount, message: 'Coupon valid' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase(), createdByAdminId: req.user.id });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Error creating coupon', error: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    if (req.body.code) req.body.code = req.body.code.toUpperCase();
    await coupon.update(req.body);
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Error updating coupon', error: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    await coupon.update({ isActive: false });
    res.json({ message: 'Coupon deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting coupon', error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { serviceId, bookingDate, bookingTime, numberOfPeople, specialRequests, customerName, customerEmail, customerPhone, notes } = req.body;
    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    const existingBooking = await Booking.findOne({ where: { serviceId, bookingDate, bookingTime } });
    if (existingBooking) return res.status(400).json({ message: 'This time slot is already booked' });
    const booking = await Booking.create({
      userId: req.user.id, serviceId, bookingDate, bookingTime, numberOfPeople, specialRequests,
      customerName: customerName || req.user.fullName,
      customerEmail: customerEmail || req.user.email,
      customerPhone: customerPhone || req.user.phone,
      notes, status: 'pending'
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Error creating booking', error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { bookingId, serviceId, couponId, offerId, couponCode, serviceAmount, discountAmount, totalAmount, services } = req.body;
    const servicesData = services || [{ serviceId, serviceAmount }];
    const totalServiceAmount = servicesData.reduce((sum, s) => sum + parseFloat(s.serviceAmount || 0), 0);
    const finalAmount = totalAmount || totalServiceAmount;
    const razorpay = new (require('razorpay'))({ key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_blank', key_secret: process.env.RAZORPAY_KEY_SECRET || 'blank' });
    const options = {
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: generateOrderId(),
      notes: { userId: req.user.id, bookingId: bookingId || '', serviceId, services: JSON.stringify(servicesData) }
    };
    const order = await razorpay.orders.create(options);
    const dbOrder = await Order.create({
      orderId: order.receipt, userId: req.user.id, bookingId, serviceId,
      servicesJson: JSON.stringify(servicesData), serviceAmount: totalServiceAmount,
      discountAmount: discountAmount || 0, couponCode: couponCode || null, offerId: offerId || null,
      totalAmount: finalAmount, razorpayOrderId: order.id, status: 'pending'
    });
    if (couponId) {
      await Coupon.increment('usedCount', { where: { id: couponId } });
    }
    if (offerId) {
      await Offer.increment('usedCount', { where: { id: offerId } });
    }
    res.json({ order, dbOrderId: dbOrder.id, amount: finalAmount });
  } catch (err) {
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, bookingId, bookingIds } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'blank').update(body).digest('hex');
    if (expectedSignature !== razorpay_signature) return res.status(400).json({ message: 'Invalid signature' });
    const dbOrder = await Order.findByPk(orderId, { include: [{ model: Service, as: 'service' }] });
    if (!dbOrder) return res.status(404).json({ message: 'Order not found' });
    if (dbOrder.userId !== req.user.id) return res.status(403).json({ message: 'This order does not belong to your account' });
    if (dbOrder.razorpayOrderId !== razorpay_order_id) return res.status(400).json({ message: 'Order reference does not match' });
    const razorpay = new (require('razorpay'))({ key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_blank', key_secret: process.env.RAZORPAY_KEY_SECRET || 'blank' });
    let gatewayPayment = {};
    try { gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id); } catch (_) { /* IDs and verified signature are still recorded. */ }
    await dbOrder.update({ status: 'paid', paidAt: new Date() });
    const confirmedBookingIds = Array.isArray(bookingIds) && bookingIds.length ? bookingIds : (bookingId ? [bookingId] : []);
    if (confirmedBookingIds.length) {
      await Booking.update({ status: 'confirmed' }, { where: { id: confirmedBookingIds, userId: req.user.id } });
    }
    await Payment.create({
      orderId: dbOrder.id, userId: req.user.id, bookingId: bookingId || null,
      razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, razorpaySignature: razorpay_signature,
      amount: dbOrder.totalAmount, currency: gatewayPayment.currency || dbOrder.currency || 'INR',
      status: 'captured', method: gatewayPayment.method || 'online', bank: gatewayPayment.bank || null,
      wallet: gatewayPayment.wallet || null, vpa: gatewayPayment.vpa || null,
      email: gatewayPayment.email || req.user.email, contact: gatewayPayment.contact || req.user.phone,
      fee: gatewayPayment.fee ? gatewayPayment.fee / 100 : null, tax: gatewayPayment.tax ? gatewayPayment.tax / 100 : null,
      capturedAt: new Date()
    });
    res.json({ message: 'Payment verified successfully', order: dbOrder });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying payment', error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({ where: { userId: req.user.id }, include: [{ model: Service, as: 'service' }, { model: Order, as: 'order', include: [{ model: Payment, as: 'payment' }] }], order: [['createdAt', 'DESC']] });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings', error: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, date } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date) where.bookingDate = date;
    const bookings = await Booking.findAll({ where, include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }, { model: Service, as: 'service' }], order: [['bookingDate', 'DESC'], ['bookingTime', 'DESC']] });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings', error: err.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, { include: [{ model: User, as: 'user', attributes: ['id', 'email', 'fullName'] }, { model: Service, as: 'service', attributes: ['name', 'price'] }] });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const { status, cancellationReason } = req.body;
    await booking.update({ status, cancellationReason: cancellationReason || null, cancelledAt: status === 'cancelled' ? new Date() : null, cancelledBy: req.user.id || null });
    if (status === 'cancelled' && booking.user) {
      await Notification.create({
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.bookingDate} at ${booking.bookingTime} for ${booking.service?.name || 'service'} has been cancelled by admin.`,
        type: 'booking', userId: booking.userId, sentByAdminId: req.user.id
      });
      await sendNotificationEmail(booking.user.email, 'Booking Cancelled', `<h2>Booking Cancelled</h2><p>Your booking for ${booking.bookingDate} at ${booking.bookingTime} has been cancelled by admin.</p>`);
    }
    res.json({ message: 'Booking updated', booking });
  } catch (err) {
    res.status(500).json({ message: 'Error updating booking', error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { userId: req.user.id }, include: [{ model: Service, as: 'service' }, { model: Payment, as: 'payment' }, { model: Coupon, as: 'coupon' }, { model: Offer, as: 'offer' }], order: [['createdAt', 'DESC']] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where = {};
    if (status) where.status = status;
    if (startDate && endDate) where.createdAt = { [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)] };
    const orders = await Order.findAll({ where, include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }, { model: Service, as: 'service' }, { model: Payment, as: 'payment' }], order: [['createdAt', 'DESC']] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ where: { isAdmin: false }, attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }, order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ message: 'Cannot deactivate admin' });
    await user.update({ isActive: !user.isActive });
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: { id: user.id, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ message: 'Cannot delete admin' });
    await user.destroy();
    res.json({ message: 'User deleted permanently' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, userIds, sendToAll, offerId, couponId } = req.body;
    let notifications = [];
    if (sendToAll) {
      const users = await User.findAll({ where: { isActive: true }, attributes: ['id', 'email'] });
      notifications = users.map(u => ({ userId: u.id, title, message, type, offerId: offerId || null, couponId: couponId || null, sentToAll: true, sentByAdminId: req.user.id, status: 'sent' }));
      await Promise.all(users.map(u => sendNotificationEmail(u.email, title, `<h2>${title}</h2><p>${message}</p>`)));
    } else if (userIds && userIds.length > 0) {
      notifications = userIds.map(id => ({ userId: id, title, message, type, offerId: offerId || null, couponId: couponId || null, sentToAll: false, sentByAdminId: req.user.id, status: 'sent' }));
      const users = await User.findAll({ where: { id: userIds, isActive: true }, attributes: ['id', 'email'] });
      await Promise.all(users.map(u => sendNotificationEmail(u.email, title, `<h2>${title}</h2><p>${message}</p>`)));
    } else {
      return res.status(400).json({ message: 'Either userIds or sendToAll must be provided' });
    }
    await Notification.bulkCreate(notifications);
    res.status(201).json({ message: `Notification sent to ${notifications.length} users`, count: notifications.length });
  } catch (err) {
    res.status(500).json({ message: 'Error sending notification', error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { userId: req.user.id }, include: [{ model: Offer, as: 'offer' }, { model: Coupon, as: 'coupon' }], order: [['createdAt', 'DESC']], limit: 50 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.update({ status: 'read' }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification', error: err.message });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }, { model: Offer, as: 'offer' }, { model: Coupon, as: 'coupon' }], order: [['createdAt', 'DESC']], limit: 100 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const { name, email, phone, subject, message, kind } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'Name, email, and message are required' });
    const item = await Feedback.create({ name, email, phone, subject, message, kind: kind === 'feedback' ? 'feedback' : 'request' });
    res.status(201).json({ message: 'Your message has been received', item });
  } catch (err) {
    res.status(500).json({ message: 'Error saving feedback', error: err.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const items = await Feedback.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const item = await Feedback.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Feedback item not found' });
    await item.update({ status: req.body.status || item.status, adminNotes: req.body.adminNotes ?? item.adminNotes });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error updating feedback', error: err.message });
  }
};

exports.getCustomerDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [bookings, orders, notifications] = await Promise.all([
      Booking.findAll({ where: { userId: req.user.id }, include: [{ model: Service, as: 'service' }, { model: Order, as: 'order', include: [{ model: Payment, as: 'payment' }] }], order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']] }),
      Order.findAll({ where: { userId: req.user.id }, include: [{ model: Service, as: 'service' }, { model: Payment, as: 'payment' }], order: [['createdAt', 'DESC']], limit: 20 }),
      Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 10 })
    ]);
    const upcoming = bookings.filter(item => item.bookingDate >= today && !['cancelled', 'completed', 'no_show'].includes(item.status));
    const payments = orders.filter(item => item.payment).map(item => item.payment);
    res.json({
      stats: {
        totalBookings: bookings.length,
        upcomingBookings: upcoming.length,
        completedBookings: bookings.filter(item => item.status === 'completed').length,
        totalPaid: orders.filter(item => item.status === 'paid').reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
      },
      upcoming: upcoming.slice(0, 5),
      recentBookings: bookings.slice(-8).reverse(),
      orders,
      payments,
      notifications
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer dashboard', error: err.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const totalUsers = await User.count({ where: { isAdmin: false } });
    const totalBookings = await Booking.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalAmount', { where: { status: 'paid' } }) || 0;
    const pendingBookings = await Booking.count({ where: { status: 'pending' } });
    const activeOffers = await Offer.count({ where: { isActive: true } });
    const activeCoupons = await Coupon.count({ where: { isActive: true } });
    const todayRevenue = await Order.sum('totalAmount', { where: { status: 'paid', updatedAt: { [Op.gte]: startOfToday } } }) || 0;
    const [todayPayments, recentOrders, newRegistrations, newBookings, alerts, feedback] = await Promise.all([
      Payment.findAll({ where: { createdAt: { [Op.gte]: startOfToday } }, include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }, { model: Order, as: 'order' }], order: [['createdAt', 'DESC']] }),
      Order.findAll({ include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }, { model: Service, as: 'service' }, { model: Payment, as: 'payment' }], order: [['createdAt', 'DESC']], limit: 10 }),
      User.findAll({ where: { isAdmin: false }, attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }, order: [['createdAt', 'DESC']], limit: 10 }),
      Booking.findAll({ include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }, { model: Service, as: 'service' }], order: [['createdAt', 'DESC']], limit: 10 }),
      Notification.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      Feedback.findAll({ order: [['createdAt', 'DESC']], limit: 10 })
    ]);
    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalBookings: totalBookings || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue || 0,
        todayRevenue: todayRevenue || 0,
        pendingBookings: pendingBookings || 0,
        activeOffers: activeOffers || 0,
        activeCoupons: activeCoupons || 0
      }, todayPayments, recentOrders, newRegistrations, newBookings, alerts, feedback
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
  }
};

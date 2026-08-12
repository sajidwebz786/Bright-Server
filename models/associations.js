const { sequelize } = require('../config/database');

const defineAssociations = () => {
  const { User, Service, Booking, Order, Payment, Coupon, Offer, Notification, Feedback, TelegramConnection } = sequelize.models;

  if (!User || !Service || !Booking || !Order || !Coupon || !Offer || !Notification) {
    console.warn('Some models not loaded yet, skipping associations');
    return;
  }

  User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
  Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Order, { foreignKey: 'userId', as: 'userOrders' });
  Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Service.hasMany(Booking, { foreignKey: 'serviceId', as: 'serviceBookings' });
  Booking.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

  Service.hasMany(Order, { foreignKey: 'serviceId', as: 'serviceOrders' });
  Order.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

  Booking.hasOne(Order, { foreignKey: 'bookingId', as: 'order' });
  Order.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

  Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });
  Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });

  User.hasMany(Notification, { foreignKey: 'userId', as: 'userNotifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Coupon, { foreignKey: 'createdByAdminId', as: 'createdCoupons' });
  Coupon.belongsTo(User, { foreignKey: 'createdByAdminId', as: 'createdByAdmin' });

  User.hasMany(Offer, { foreignKey: 'createdByAdminId', as: 'createdOffers' });
  Offer.belongsTo(User, { foreignKey: 'createdByAdminId', as: 'createdByAdmin' });

  User.hasMany(Notification, { foreignKey: 'sentByAdminId', as: 'sentNotifications' });
  Notification.belongsTo(User, { foreignKey: 'sentByAdminId', as: 'sentByAdmin' });

  Offer.hasMany(Notification, { foreignKey: 'offerId', as: 'offerNotifications' });
  Notification.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

  Coupon.hasMany(Notification, { foreignKey: 'couponId', as: 'couponNotifications' });
  Notification.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

  Offer.hasMany(Order, { foreignKey: 'offerId', as: 'offerOrders' });
  Order.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

  Coupon.hasMany(Order, { foreignKey: 'couponId', as: 'couponOrders' });
  Order.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

  User.hasMany(Feedback, { foreignKey: 'userId', as: 'feedbackItems' });
  Feedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasOne(TelegramConnection, { foreignKey: 'userId', as: 'telegramConnection' });
  TelegramConnection.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  console.log('Model associations defined');
};

module.exports = defineAssociations;

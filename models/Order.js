const db = require('../config/database');

const Order = db.sequelize.define('Order', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: db.Sequelize.STRING,
    unique: true
  },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  bookingId: {
    type: db.Sequelize.INTEGER,
    references: { model: 'bookings', key: 'id' }
  },
  couponId: {
    type: db.Sequelize.INTEGER,
    references: { model: 'coupons', key: 'id' }
  },
  offerId: {
    type: db.Sequelize.INTEGER,
    references: { model: 'offers', key: 'id' }
  },
  serviceId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'services', key: 'id' }
  },
  servicesJson: {
    type: db.Sequelize.TEXT
  },
  serviceAmount: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  discountAmount: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0
  },
  couponCode: {
    type: db.Sequelize.STRING
  },
  offerTitle: {
    type: db.Sequelize.STRING
  },
  totalAmount: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  currency: {
    type: db.Sequelize.STRING,
    defaultValue: 'INR'
  },
  razorpayOrderId: {
    type: db.Sequelize.STRING
  },
  status: {
    type: db.Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: db.Sequelize.STRING
  },
  paidAt: {
    type: db.Sequelize.DATE
  },
  failureReason: {
    type: db.Sequelize.TEXT
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;

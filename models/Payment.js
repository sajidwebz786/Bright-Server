const db = require('../config/database');

const Payment = db.sequelize.define('Payment', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'orders', key: 'id' }
  },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false
  },
  bookingId: {
    type: db.Sequelize.INTEGER
  },
  razorpayPaymentId: {
    type: db.Sequelize.STRING
  },
  razorpayOrderId: {
    type: db.Sequelize.STRING
  },
  razorpaySignature: {
    type: db.Sequelize.STRING
  },
  amount: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  currency: {
    type: db.Sequelize.STRING,
    defaultValue: 'INR'
  },
  status: {
    type: db.Sequelize.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'),
    defaultValue: 'created'
  },
  method: {
    type: db.Sequelize.STRING
  },
  bank: {
    type: db.Sequelize.STRING
  },
  wallet: {
    type: db.Sequelize.STRING
  },
  vpa: {
    type: db.Sequelize.STRING
  },
  email: {
    type: db.Sequelize.STRING
  },
  contact: {
    type: db.Sequelize.STRING
  },
  fee: {
    type: db.Sequelize.FLOAT
  },
  tax: {
    type: db.Sequelize.FLOAT
  },
  errorCode: {
    type: db.Sequelize.STRING
  },
  errorDescription: {
    type: db.Sequelize.TEXT
  },
  errorSource: {
    type: db.Sequelize.STRING
  },
  step: {
    type: db.Sequelize.STRING
  },
  capturedAt: {
    type: db.Sequelize.DATE
  },
  refundInitiatedAt: {
    type: db.Sequelize.DATE
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;

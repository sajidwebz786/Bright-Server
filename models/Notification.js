const db = require('../config/database');

const Notification = db.sequelize.define('Notification', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  message: {
    type: db.Sequelize.TEXT,
    allowNull: false
  },
  type: {
    type: db.Sequelize.ENUM('offer', 'coupon', 'booking', 'payment', 'general'),
    defaultValue: 'general'
  },
  userId: {
    type: db.Sequelize.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  sentToAll: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: false
  },
  offerId: {
    type: db.Sequelize.INTEGER,
    references: { model: 'offers', key: 'id' }
  },
  couponId: {
    type: db.Sequelize.INTEGER,
    references: { model: 'coupons', key: 'id' }
  },
  status: {
    type: db.Sequelize.ENUM('sent', 'failed', 'read'),
    defaultValue: 'sent'
  },
  sentByAdminId: {
    type: db.Sequelize.INTEGER
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;

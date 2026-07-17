const db = require('../config/database');

const Coupon = db.sequelize.define('Coupon', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: db.Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: db.Sequelize.TEXT
  },
  discountType: {
    type: db.Sequelize.ENUM('percentage', 'fixed'),
    allowNull: false
  },
  discountValue: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  minOrderAmount: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0
  },
  maxDiscount: {
    type: db.Sequelize.FLOAT
  },
  usageLimit: {
    type: db.Sequelize.INTEGER
  },
  usedCount: {
    type: db.Sequelize.INTEGER,
    defaultValue: 0
  },
  validFrom: {
    type: db.Sequelize.DATEONLY,
    allowNull: false
  },
  validTo: {
    type: db.Sequelize.DATEONLY,
    allowNull: false
  },
  createdByAdminId: {
    type: db.Sequelize.INTEGER
  },
  isActive: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'coupons',
  timestamps: true
});

module.exports = Coupon;

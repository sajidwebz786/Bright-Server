const db = require('../config/database');

const Offer = db.sequelize.define('Offer', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: db.Sequelize.TEXT
  },
  serviceId: {
    type: db.Sequelize.INTEGER
  },
  categoryId: {
    type: db.Sequelize.INTEGER
  },
  discountType: {
    type: db.Sequelize.ENUM('percentage', 'fixed'),
    allowNull: false
  },
  discountValue: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  originalPrice: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  offerPrice: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  image: {
    type: db.Sequelize.STRING
  },
  validFrom: {
    type: db.Sequelize.DATEONLY,
    allowNull: false
  },
  validTo: {
    type: db.Sequelize.DATEONLY,
    allowNull: false
  },
  usageLimit: {
    type: db.Sequelize.INTEGER
  },
  usedCount: {
    type: db.Sequelize.INTEGER,
    defaultValue: 0
  },
  createdByAdminId: {
    type: db.Sequelize.INTEGER
  },
  isActive: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'offers',
  timestamps: true
});

module.exports = Offer;

const db = require('../config/database');

const Service = db.sequelize.define('Service', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: db.Sequelize.TEXT
  },
  category: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  duration: {
    type: db.Sequelize.INTEGER,
    allowNull: false
  },
  price: {
    type: db.Sequelize.FLOAT,
    allowNull: false
  },
  image: {
    type: db.Sequelize.STRING
  },
  isActive: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: true
  },
  isOffer: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: false
  },
  offerPrice: {
    type: db.Sequelize.FLOAT
  }
}, {
  tableName: 'services',
  timestamps: true
});

module.exports = Service;

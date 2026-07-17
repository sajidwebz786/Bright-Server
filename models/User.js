const db = require('../config/database');

const User = db.sequelize.define('User', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: db.Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  resetToken: {
    type: db.Sequelize.STRING
  },
  resetTokenExpiry: {
    type: db.Sequelize.DATE
  },
  isAdmin: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: db.Sequelize.DATE
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;

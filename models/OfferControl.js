const db = require('../config/database');

const OfferControl = db.sequelize.define('OfferControl', {
  id: { type: db.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  offerType: { type: db.Sequelize.STRING, allowNull: false, unique: true },
  title: { type: db.Sequelize.STRING, allowNull: false },
  details: { type: db.Sequelize.TEXT },
  dailyCapacity: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  startHour: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
  endHour: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 17 },
  slotIntervalMinutes: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
  suggestionDays: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 7 },
  isActive: { type: db.Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'offer_controls',
  timestamps: true
});

module.exports = OfferControl;

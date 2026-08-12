const db = require('../config/database');

const TelegramConnection = db.sequelize.define('TelegramConnection', {
  id: { type: db.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: db.Sequelize.INTEGER, allowNull: true, unique: true },
  role: { type: db.Sequelize.ENUM('customer', 'admin'), allowNull: false, defaultValue: 'customer' },
  chatId: { type: db.Sequelize.STRING, allowNull: true, unique: true },
  telegramUserId: { type: db.Sequelize.STRING, allowNull: true },
  telegramUsername: { type: db.Sequelize.STRING },
  connectTokenHash: { type: db.Sequelize.STRING, unique: true },
  connectTokenExpiresAt: { type: db.Sequelize.DATE },
  connectedAt: { type: db.Sequelize.DATE },
  isActive: { type: db.Sequelize.BOOLEAN, defaultValue: true }
}, {
  tableName: 'telegram_connections',
  timestamps: true
});

module.exports = TelegramConnection;

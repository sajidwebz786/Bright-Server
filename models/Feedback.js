const db = require('../config/database');

const Feedback = db.sequelize.define('Feedback', {
  id: { type: db.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: db.Sequelize.INTEGER, references: { model: 'users', key: 'id' } },
  name: { type: db.Sequelize.STRING, allowNull: false },
  email: { type: db.Sequelize.STRING, allowNull: false },
  phone: { type: db.Sequelize.STRING },
  subject: { type: db.Sequelize.STRING },
  message: { type: db.Sequelize.TEXT, allowNull: false },
  kind: { type: db.Sequelize.ENUM('feedback', 'request'), defaultValue: 'request' },
  status: { type: db.Sequelize.ENUM('new', 'in_progress', 'resolved'), defaultValue: 'new' },
  adminNotes: { type: db.Sequelize.TEXT }
}, { tableName: 'feedback', timestamps: true });

module.exports = Feedback;

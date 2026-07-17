const db = require('../config/database');

const Booking = db.sequelize.define('Booking', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  serviceId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'services', key: 'id' }
  },
  bookingDate: {
    type: db.Sequelize.DATEONLY,
    allowNull: false
  },
  bookingTime: {
    type: db.Sequelize.TIME,
    allowNull: false
  },
  numberOfPeople: {
    type: db.Sequelize.INTEGER,
    defaultValue: 1
  },
  specialRequests: {
    type: db.Sequelize.TEXT
  },
  status: {
    type: db.Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
    defaultValue: 'pending'
  },
  customerName: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  customerEmail: {
    type: db.Sequelize.STRING
  },
  customerPhone: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  notes: {
    type: db.Sequelize.TEXT
  },
  cancelledAt: {
    type: db.Sequelize.DATE
  },
  cancelledBy: {
    type: db.Sequelize.INTEGER
  },
  cancellationReason: {
    type: db.Sequelize.TEXT
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

module.exports = Booking;

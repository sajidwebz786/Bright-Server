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
    type: db.Sequelize.STRING(32),
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
  alternatePhone: {
    type: db.Sequelize.STRING
  },
  customerAddress: {
    type: db.Sequelize.TEXT
  },
  caretakerName: {
    type: db.Sequelize.STRING
  },
  caretakerPhone: {
    type: db.Sequelize.STRING
  },
  dateOfBirth: {
    type: db.Sequelize.DATEONLY
  },
  offerType: {
    type: db.Sequelize.STRING(32),
    defaultValue: 'standard'
  },
  originalAmount: {
    type: db.Sequelize.FLOAT
  },
  discountAmount: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0
  },
  payableAmount: {
    type: db.Sequelize.FLOAT
  },
  waitlistPosition: {
    type: db.Sequelize.INTEGER
  },
  aadhaarDocument: {
    type: db.Sequelize.TEXT
  },
  customerPhoto: {
    type: db.Sequelize.TEXT
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

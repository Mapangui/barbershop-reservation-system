/**
 * Reservation Model
 * Follows Google JavaScript Style Guide
 */

const {DataTypes} = require('sequelize');
const dbInstance = require('../config/database');

const sequelize = dbInstance.getConnection();

/**
 * Reservation Model Definition
 */
const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  barberId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  barberName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['haircut', 'shave', 'beard-trim', 'full-service']],
    },
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Duration in minutes',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'completed', 'cancelled']],
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reservations',
  timestamps: true,
  indexes: [
    {
      fields: ['customerEmail'],
    },
    {
      fields: ['barberId'],
    },
    {
      fields: ['appointmentDate'],
    },
    {
      fields: ['status'],
    },
  ],
});

module.exports = Reservation;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isNumeric: true,
      len: [10, 15],
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  totalCredit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  totalPaid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
}, {
  tableName: 'customers',
  timestamps: true,
});

module.exports = Customer;
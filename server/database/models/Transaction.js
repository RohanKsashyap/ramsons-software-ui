const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Customer = require('./Customer');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('SALE', 'PAYMENT'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'CREDIT', 'PARTIAL_PAYMENT'),
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE'),
    defaultValue: 'UNPAID',
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

// Define associations
Customer.hasMany(Transaction, { foreignKey: 'customerId', as: 'transactions' });
Transaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = Transaction;
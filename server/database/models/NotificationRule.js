const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const NotificationRule = sequelize.define('NotificationRule', {
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
  type: {
    type: DataTypes.ENUM('overdue', 'reminder', 'followup'),
    allowNull: false,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  conditions: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  actions: {
    type: DataTypes.JSON,
    defaultValue: { notification: true },
  },
  sound: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      type: 'notification',
      volume: 0.7
    },
  },
  schedule: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  message: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  lastRun: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'notification_rules',
  timestamps: true,
});

module.exports = NotificationRule;
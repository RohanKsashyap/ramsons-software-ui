const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const FollowUpSequence = sequelize.define('FollowUpSequence', {
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
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  trigger: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  steps: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'followup_sequences',
  timestamps: true,
});

module.exports = FollowUpSequence;
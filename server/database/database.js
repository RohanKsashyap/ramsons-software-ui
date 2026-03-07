const { Sequelize } = require('sequelize');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
const dbPath = path.join(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: isDev ? console.log : false,
});

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Import and sync models
    const { Customer, Transaction, NotificationRule, FollowUpSequence } = require('./models');
    await sequelize.sync({ alter: true });
    
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = { sequelize, initializeDatabase };

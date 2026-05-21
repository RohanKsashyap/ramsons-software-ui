const { Sequelize } = require('sequelize');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
let dbPath;

try {
  const { app } = require('electron');
  if (app) {
    // If running in Electron (main or renderer process)
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'database.sqlite');
  } else {
    dbPath = path.join(__dirname, '../database.sqlite');
  }
} catch (e) {
  // Not in Electron environment (e.g. running migrations or server standalone)
  dbPath = path.join(__dirname, '../database.sqlite');
}

console.log('Using database at:', dbPath);

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
    const { Customer, Transaction, NotificationRule, FollowUpSequence, Product } = require('./models');
    await sequelize.sync({ alter: true });
    
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = { sequelize, initializeDatabase };

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { initializeDatabase } = require('./database/database');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const followUpRoutes = require('./routes/followups');
const productRoutes = require('./routes/products');
const reminderService = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Credit Book Server is running' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Start reminder service
    reminderService.startReminderCheck();
    console.log('Reminder service started');
    
    app.listen(PORT, () => {
      console.log(`Credit Book Server running on http://localhost:${PORT}`);
      console.log('Access the application at: http://localhost:3001');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

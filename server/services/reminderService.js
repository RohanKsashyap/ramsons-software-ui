const cron = require('node-cron');
const transactionService = require('./transactionService');
const notificationService = require('./notificationService');
const customerService = require('./customerService');

class ReminderService {
  constructor() {
    this.cronJob = null;
  }

  startReminderCheck() {
    // Run daily at 9 AM
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      await this.checkOverduePayments();
    }, {
      scheduled: false,
    });

    this.cronJob.start();
    console.log('Reminder service started - checking daily at 9 AM');

    // Also run once on startup for testing
    setTimeout(() => {
      this.checkOverduePayments();
    }, 5000);
  }

  async checkOverduePayments() {
    try {
      const overdueTransactions = await transactionService.getOverdueTransactions();
      const customers = await customerService.getAllCustomers();
      const activeRules = await notificationService.getActiveRules();

      // Execute notification rules
      for (const rule of activeRules) {
        try {
          await notificationService.executeRule(rule, customers, overdueTransactions);
        } catch (error) {
          console.error(`Error executing rule "${rule.name}":`, error);
        }
      }
      
      // Log overdue payments (since we can't show desktop notifications in web)
      if (overdueTransactions.length > 0) {
        const customerNames = [...new Set(overdueTransactions.map(t => t.customer.name))];
        console.log(`Found ${overdueTransactions.length} overdue transactions from customers:`, customerNames);
        
        // In a real web app, you might want to:
        // - Send email notifications
        // - Store notifications in database for UI display
        // - Use WebSocket to push notifications to connected clients
      }
    } catch (error) {
      console.error('Error checking overdue payments:', error);
    }
  }

  stopReminderCheck() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Reminder service stopped');
    }
  }
}

module.exports = new ReminderService();
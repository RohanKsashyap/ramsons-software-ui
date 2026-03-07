const { NotificationRule } = require('../database/models');
const { Op } = require('sequelize');

class NotificationService {
  async getAllRules() {
    try {
      return await NotificationRule.findAll({
        order: [['name', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching notification rules: ${error.message}`);
    }
  }

  async createRule(ruleData) {
    try {
      return await NotificationRule.create(ruleData);
    } catch (error) {
      throw new Error(`Error creating notification rule: ${error.message}`);
    }
  }

  async updateRule(id, ruleData) {
    try {
      const [updatedCount] = await NotificationRule.update(ruleData, {
        where: { id },
      });
      
      if (updatedCount === 0) {
        throw new Error('Notification rule not found');
      }
      
      return await NotificationRule.findByPk(id);
    } catch (error) {
      throw new Error(`Error updating notification rule: ${error.message}`);
    }
  }

  async deleteRule(id) {
    try {
      const deletedCount = await NotificationRule.destroy({
        where: { id },
      });
      
      if (deletedCount === 0) {
        throw new Error('Notification rule not found');
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Error deleting notification rule: ${error.message}`);
    }
  }

  async testRule(ruleId) {
    try {
      const rule = await NotificationRule.findByPk(ruleId);
      
      if (!rule) {
        throw new Error('Notification rule not found');
      }

      // Create a test notification payload
      const testNotification = {
        id: `test-${Date.now()}`,
        type: rule.type || 'info',
        title: rule.message.title,
        message: rule.message.body,
        priority: rule.priority || 'medium',
        timestamp: new Date(),
        customerName: 'Test Customer',
        amount: 5000,
        dueDate: new Date().toISOString(),
        soundType: rule.sound?.type || 'notification',
        silent: false // Ensure sound plays
      };

      // Log the test notification
      console.log(`[TEST NOTIFICATION] ${rule.message.title}: ${rule.message.body}`);
      
      // Return the notification payload so the frontend can display it
      return { 
        success: true, 
        message: 'Test notification sent!',
        notification: testNotification
      };
    } catch (error) {
      throw new Error(`Error testing notification rule: ${error.message}`);
    }
  }

  async getActiveRules() {
    try {
      return await NotificationRule.findAll({
        where: { enabled: true },
        order: [['name', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching active notification rules: ${error.message}`);
    }
  }

  async executeRule(rule, customers, transactions) {
    try {
      let matchingCustomers = [];

      // Apply rule conditions
      if (rule.conditions.daysOverdue) {
        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - rule.conditions.daysOverdue);
        
        matchingCustomers = customers.filter(customer => {
          return customer.transactions?.some(t => 
            t.dueDate && 
            new Date(t.dueDate) <= overdueDate && 
            t.status !== 'PAID'
          );
        });
      }

      if (rule.conditions.balanceThreshold) {
        matchingCustomers = matchingCustomers.filter(customer => 
          parseFloat(customer.balance) >= rule.conditions.balanceThreshold
        );
      }

      if (matchingCustomers.length > 0 && rule.actions.notification) {
        // In web version, log notifications instead of showing desktop notifications
        console.log(`[NOTIFICATION] ${rule.message.title}: ${rule.message.body}`);
        console.log(`Affected customers: ${matchingCustomers.length}`);
        
        // Play sound notification if enabled
        if (rule.sound && rule.sound.enabled) {
          try {
            // In web version, we'll use the frontend audio service
            console.log(`[SOUND NOTIFICATION] Playing ${rule.sound.type} sound for rule: ${rule.name}`);
            // The actual sound will be played by the frontend due date notification service
          } catch (error) {
            console.error('Error playing notification sound:', error);
          }
        }
      }

      // Update last run time
      await rule.update({ lastRun: new Date() });

      return { success: true, matchingCustomers: matchingCustomers.length };
    } catch (error) {
      throw new Error(`Error executing notification rule: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();
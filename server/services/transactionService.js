const { Transaction, Customer } = require('../database/models');
const { Op } = require('sequelize');
const customerService = require('./customerService');

class TransactionService {
  async getAllTransactions() {
    try {
      return await Transaction.findAll({
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        }],
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  async getTransactionsByCustomer(customerId) {
    try {
      return await Transaction.findAll({
        where: { customerId },
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      throw new Error(`Error fetching customer transactions: ${error.message}`);
    }
  }

  async createTransaction(transactionData) {
    try {
      // Set default due date for credit transactions if not provided
      let dueDate = transactionData.dueDate;
      if (!dueDate && transactionData.paymentMethod === 'CREDIT') {
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30); // Default 30 days credit period
        dueDate = defaultDueDate;
      }

      const transaction = await Transaction.create({
        ...transactionData,
        dueDate,
        remainingAmount: transactionData.paymentMethod === 'CREDIT' 
          ? transactionData.amount 
          : 0,
        status: transactionData.paymentMethod === 'CASH' 
          ? 'PAID' 
          : 'UNPAID',
      });

      // Update customer balance
      await customerService.updateCustomerBalance(transactionData.customerId);

      return transaction;
    } catch (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }
  }

  async makePayment(transactionId, amount) {
    try {
      const transaction = await Transaction.findByPk(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const newPaidAmount = parseFloat(transaction.paidAmount) + parseFloat(amount);
      const remainingAmount = parseFloat(transaction.amount) - newPaidAmount;
      
      let status = 'PARTIAL';
      if (remainingAmount <= 0) {
        status = 'PAID';
      }

      await transaction.update({
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, remainingAmount),
        status,
      });

      // Update customer balance
      await customerService.updateCustomerBalance(transaction.customerId);

      return transaction;
    } catch (error) {
      throw new Error(`Error processing payment: ${error.message}`);
    }
  }

  async getOverdueTransactions() {
    try {
      const today = new Date();
      return await Transaction.findAll({
        where: {
          dueDate: {
            [Op.lt]: today,
          },
          status: ['UNPAID', 'PARTIAL'],
        },
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        }],
      });
    } catch (error) {
      throw new Error(`Error fetching overdue transactions: ${error.message}`);
    }
  }

  async getTransactionsDueSoon(days = 7) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      return await Transaction.findAll({
        where: {
          dueDate: {
            [Op.between]: [today, futureDate],
          },
          status: ['UNPAID', 'PARTIAL'],
        },
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        }],
        order: [['dueDate', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching transactions due soon: ${error.message}`);
    }
  }

  async getTransactionById(id) {
    try {
      const transaction = await Transaction.findByPk(id, {
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone', 'email'],
        }],
      });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      return transaction;
    } catch (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }

  async updateTransaction(id, transactionData) {
    try {
      const transaction = await Transaction.findByPk(id);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction
      await transaction.update(transactionData);

      // Update customer balance
      await customerService.updateCustomerBalance(transaction.customerId);

      return await this.getTransactionById(id);
    } catch (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }
  }

  async deleteTransaction(id) {
    try {
      const transaction = await Transaction.findByPk(id);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const customerId = transaction.customerId;
      
      // Delete transaction
      await transaction.destroy();

      // Update customer balance
      await customerService.updateCustomerBalance(customerId);

      return { success: true };
    } catch (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }
  }

  async deleteMultipleTransactions(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid transaction IDs provided');
      }

      // Get transactions to find affected customers
      const transactions = await Transaction.findAll({
        where: { id: ids },
        attributes: ['id', 'customerId']
      });

      if (transactions.length === 0) {
        throw new Error('No transactions found with provided IDs');
      }

      // Get unique customer IDs
      const customerIds = [...new Set(transactions.map(t => t.customerId))];

      // Delete transactions
      const deletedCount = await Transaction.destroy({
        where: { id: ids }
      });

      // Update customer balances for affected customers
      for (const customerId of customerIds) {
        await customerService.updateCustomerBalance(customerId);
      }

      return { 
        success: true, 
        deletedCount,
        message: `Successfully deleted ${deletedCount} transaction(s)`
      };
    } catch (error) {
      throw new Error(`Error deleting multiple transactions: ${error.message}`);
    }
  }

  async getDueDateAlerts() {
    try {
      const today = new Date();
      const alerts = [];

      // Get overdue transactions
      const overdue = await this.getOverdueTransactions();
      overdue.forEach(transaction => {
        const daysOverdue = Math.ceil((today - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24));
        alerts.push({
          ...transaction.toJSON(),
          alertType: 'overdue',
          daysOverdue,
          priority: 'urgent'
        });
      });

      // Get transactions due soon
      const dueSoon = await this.getTransactionsDueSoon(7);
      dueSoon.forEach(transaction => {
        const daysUntilDue = Math.ceil((new Date(transaction.dueDate) - today) / (1000 * 60 * 60 * 24));
        alerts.push({
          ...transaction.toJSON(),
          alertType: 'due_soon',
          daysUntilDue,
          priority: daysUntilDue === 0 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low'
        });
      });

      return alerts;
    } catch (error) {
      throw new Error(`Error fetching due date alerts: ${error.message}`);
    }
  }
}

module.exports = new TransactionService();

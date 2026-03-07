const express = require('express');
const transactionService = require('../services/transactionService');
const router = express.Router();

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await transactionService.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const transactions = await transactionService.getTransactionsByCustomer(req.params.customerId);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const transaction = await transactionService.createTransaction(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Make payment
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount } = req.body;
    const transaction = await transactionService.makePayment(req.params.id, amount);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get due date alerts
router.get('/due-date-alerts', async (req, res) => {
  try {
    const alerts = await transactionService.getDueDateAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions due soon
router.get('/due-soon', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const transactions = await transactionService.getTransactionsDueSoon(days);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple transactions (must be before /:id routes)
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await transactionService.deleteMultipleTransactions(ids);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete single transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await transactionService.deleteTransaction(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
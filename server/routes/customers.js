const express = require('express');
const customerService = require('../services/customerService');
const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search customers
router.get('/search/:searchTerm', async (req, res) => {
  try {
    const customers = await customerService.searchCustomers(req.params.searchTerm);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple customers (must be before /:id route)
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await customerService.deleteMultipleCustomers(ids);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Add advance payment
router.post('/:id/advance-payment', async (req, res) => {
  try {
    const result = await customerService.addAdvancePayment(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Use advance payment
router.post('/:id/use-advance-payment', async (req, res) => {
  try {
    const result = await customerService.useAdvancePayment(req.params.id, req.body.amount);
    if (!result) {
      throw new Error('Failed to process advance payment');
    }
    res.json(result);
  } catch (error) {
    console.error('Error using advance payment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json(customer);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
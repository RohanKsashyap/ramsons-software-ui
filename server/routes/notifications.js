const express = require('express');
const notificationService = require('../services/notificationService');
const router = express.Router();

// Get all notification rules
router.get('/', async (req, res) => {
  try {
    const rules = await notificationService.getAllRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notification rule
router.post('/', async (req, res) => {
  try {
    const rule = await notificationService.createRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update notification rule
router.put('/:id', async (req, res) => {
  try {
    const rule = await notificationService.updateRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete notification rule
router.delete('/:id', async (req, res) => {
  try {
    const result = await notificationService.deleteRule(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Test notification rule
router.post('/:id/test', async (req, res) => {
  try {
    const result = await notificationService.testRule(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
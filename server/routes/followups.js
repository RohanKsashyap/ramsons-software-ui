const express = require('express');
const followUpService = require('../services/followUpService');
const router = express.Router();

// Get all follow-up sequences
router.get('/', async (req, res) => {
  try {
    const sequences = await followUpService.getAllSequences();
    res.json(sequences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create follow-up sequence
router.post('/', async (req, res) => {
  try {
    const sequence = await followUpService.createSequence(req.body);
    res.status(201).json(sequence);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update follow-up sequence
router.put('/:id', async (req, res) => {
  try {
    const sequence = await followUpService.updateSequence(req.params.id, req.body);
    res.json(sequence);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete follow-up sequence
router.delete('/:id', async (req, res) => {
  try {
    const result = await followUpService.deleteSequence(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Trigger follow-up sequence
router.post('/:id/trigger', async (req, res) => {
  try {
    const { customerId } = req.body;
    const result = await followUpService.triggerSequence(customerId, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
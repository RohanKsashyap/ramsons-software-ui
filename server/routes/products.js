const express = require('express');
const productService = require('../services/productService');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(404).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete multiple products
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Product IDs array is required' 
      });
    }
    const result = await productService.deleteMultipleProducts(ids);
    res.json(result);
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
const express = require('express');
const reportService = require('../services/reportService');
const router = express.Router();

// Generate sales report
router.post('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const report = await reportService.generateSalesReport(startDate, endDate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate overdue report
router.get('/overdue', async (req, res) => {
  try {
    const report = await reportService.generateOverdueReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export to Excel
router.post('/export/excel', async (req, res) => {
  try {
    const { reportData, filename } = req.body;
    const result = await reportService.exportToExcel(reportData, filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export to PDF
router.post('/export/pdf', async (req, res) => {
  try {
    const { reportData, filename } = req.body;
    const result = await reportService.exportToPDF(reportData, filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
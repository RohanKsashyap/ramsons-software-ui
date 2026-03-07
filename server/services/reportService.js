const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const transactionService = require('./transactionService');
const customerService = require('./customerService');

// Helper function to get downloads path for server environment
const getDownloadsPath = () => {
  return path.join(os.homedir(), 'Downloads');
};

class ReportService {
  async generateSalesReport(startDate, endDate) {
    try {
      const transactions = await transactionService.getAllTransactions();
      
      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
      });

      const salesData = filteredTransactions
        .filter(t => t.type === 'SALE')
        .reduce((acc, t) => {
          acc.totalSales += parseFloat(t.amount);
          acc.totalPaid += parseFloat(t.paidAmount);
          acc.totalOutstanding += parseFloat(t.remainingAmount);
          return acc;
        }, { totalSales: 0, totalPaid: 0, totalOutstanding: 0 });

      return {
        period: { startDate, endDate },
        transactions: filteredTransactions,
        summary: salesData,
      };
    } catch (error) {
      throw new Error(`Error generating sales report: ${error.message}`);
    }
  }

  async generateOverdueReport() {
    try {
      const overdueTransactions = await transactionService.getOverdueTransactions();
      
      const summary = overdueTransactions.reduce((acc, t) => {
        acc.totalOverdue += parseFloat(t.remainingAmount);
        acc.count += 1;
        return acc;
      }, { totalOverdue: 0, count: 0 });

      return {
        transactions: overdueTransactions,
        summary,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Error generating overdue report: ${error.message}`);
    }
  }

  async exportToExcel(reportData, filename) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Paid', key: 'paid', width: 12 },
        { header: 'Remaining', key: 'remaining', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      // Add data
      reportData.transactions.forEach(transaction => {
        worksheet.addRow({
          date: new Date(transaction.createdAt).toLocaleDateString(),
          customer: transaction.customer?.name || 'N/A',
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          paid: parseFloat(transaction.paidAmount),
          remaining: parseFloat(transaction.remainingAmount),
          status: transaction.status,
        });
      });

      // Save file
      const downloadsPath = getDownloadsPath();
      const filePath = path.join(downloadsPath, `${filename}.xlsx`);
      
      await workbook.xlsx.writeFile(filePath);
      
      return { filePath, success: true };
    } catch (error) {
      throw new Error(`Error exporting to Excel: ${error.message}`);
    }
  }

  async exportToPDF(reportData, filename) {
    try {
      const doc = new PDFDocument();
      const downloadsPath = getDownloadsPath();
      const filePath = path.join(downloadsPath, `${filename}.pdf`);
      
      doc.pipe(fs.createWriteStream(filePath));

      // Add title
      doc.fontSize(20).text('Credit Book Report', 100, 100);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 130);

      // Add summary if available
      if (reportData.summary) {
        doc.text('Summary:', 100, 160);
        doc.text(`Total Sales: $${reportData.summary.totalSales || 0}`, 100, 180);
        doc.text(`Total Paid: $${reportData.summary.totalPaid || 0}`, 100, 195);
        doc.text(`Total Outstanding: $${reportData.summary.totalOverdue || reportData.summary.totalOutstanding || 0}`, 100, 210);
      }

      // Add transactions table
      let yPosition = 250;
      doc.text('Transactions:', 100, yPosition);
      yPosition += 20;

      // Table headers
      doc.text('Date', 100, yPosition);
      doc.text('Customer', 160, yPosition);
      doc.text('Type', 280, yPosition);
      doc.text('Amount', 320, yPosition);
      doc.text('Status', 380, yPosition);
      yPosition += 20;

      // Table data
      reportData.transactions.slice(0, 30).forEach(transaction => {
        doc.text(new Date(transaction.createdAt).toLocaleDateString(), 100, yPosition);
        doc.text(transaction.customer?.name || 'N/A', 160, yPosition);
        doc.text(transaction.type, 280, yPosition);
        doc.text(`$${transaction.amount}`, 320, yPosition);
        doc.text(transaction.status, 380, yPosition);
        yPosition += 15;

        if (yPosition > 700) {
          doc.addPage();
          yPosition = 100;
        }
      });

      doc.end();

      return { filePath, success: true };
    } catch (error) {
      throw new Error(`Error exporting to PDF: ${error.message}`);
    }
  }
}

module.exports = new ReportService();

import ExcelJS from 'exceljs';

interface ReportData {
  summary: any;
  customers?: any[];
  transactions?: any[];
}

export const exportToExcel = async (reportType: string, data: ReportData, filename: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Define columns based on report type
  let columns: Partial<ExcelJS.Column>[] = [];
  let rows: any[] = [];

  if (reportType === 'customers' && data.customers) {
    columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Total Credit', key: 'totalCredit', width: 15 },
      { header: 'Total Paid', key: 'totalPaid', width: 15 },
      { header: 'Balance', key: 'balance', width: 15 },
    ];
    rows = data.customers.map((c: any) => ({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      totalCredit: c.totalCredit || 0,
      totalPaid: c.totalPaid || 0,
      balance: c.balance || 0,
    }));
  } else if (data.transactions) {
    columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Details', key: 'details', width: 40 },
    ];
    
    if (reportType === 'sales') {
      columns.push({ header: 'Paid Amount', key: 'paidAmount', width: 15 });
      columns.push({ header: 'Remaining', key: 'remainingAmount', width: 15 });
    }

    rows = data.transactions.map((t: any) => {
      let details = t.description || '';
      
      if (t.items && t.items.length > 0) {
        const itemDetails = t.items.map((item: any) => {
          const product = item.product || item.productId;
          const productName = typeof product === 'object' ? product.name : 'Product';
          return `${productName} (${item.quantity} x ₹${item.pricePerUnit || 0})`;
        }).join(', ');
        details = itemDetails + (t.description ? ` - ${t.description}` : '');
      } else if (t.paymentMethod === 'advance' && t.advanceOriginalAmount) {
        details = `Paid from exact advance amount: ₹${t.advanceOriginalAmount.toFixed(2)} (Used: ₹${t.amount.toFixed(2)})`;
      }

      return {
        date: new Date(t.createdAt).toLocaleDateString(),
        customer: t.customer?.name || t.customerName,
        amount: t.amount || 0,
        status: t.status,
        type: t.type,
        paidAmount: t.paidAmount || 0,
        remainingAmount: t.remainingAmount || 0,
        details: details,
      };
    });
  }

  worksheet.columns = columns as ExcelJS.Column[];
  worksheet.addRows(rows);

  // Style the header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const exportToPDF = async (reportType: string, data: ReportData, filename: string) => {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1e40af; margin: 0; }
            .header p { color: #666; margin: 5px 0 0 0; }
            .summary-box { display: flex; gap: 20px; margin-bottom: 30px; }
            .summary-item { flex: 1; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
            .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .summary-value { font-size: 20px; font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background-color: #f1f5f9; color: #475569; font-weight: 600; padding: 12px 8px; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .amount { font-family: monospace; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ramsons Accounting</h1>
            <p>${reportType.toUpperCase()} Report | Generated: ${new Date().toLocaleString()}</p>
          </div>
    `;

    if (reportType === 'customers' && data.customers) {
      content += `
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Total Customers</div>
            <div class="summary-value">${data.summary.totalCustomers}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Overall Outstanding</div>
            <div class="summary-value">₹${data.summary.totalOutstanding.toLocaleString()}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Total Credit</th>
              <th>Total Paid</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.customers.map((c: any) => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || ''}</td>
                <td class="amount">₹${(c.totalCredit || 0).toLocaleString()}</td>
                <td class="amount">₹${(c.totalPaid || 0).toLocaleString()}</td>
                <td class="amount" style="color: #dc2626; font-weight: bold;">₹${(c.balance || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'individual_customer' && data.summary) {
      content += `
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Customer Name</div>
            <div class="summary-value">${data.summary.name}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Phone</div>
            <div class="summary-value">${data.summary.phone || 'N/A'}</div>
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Total Credit</div>
            <div class="summary-value">₹${(data.summary.totalCredit || 0).toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Paid</div>
            <div class="summary-value">₹${(data.summary.totalPaid || 0).toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Advance Bal.</div>
            <div class="summary-value" style="color: #059669;">₹${(data.summary.advancePayment || 0).toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Balance</div>
            <div class="summary-value" style="color: #dc2626;">₹${(data.summary.balance || 0).toLocaleString()}</div>
          </div>
        </div>
        <h3>Transaction History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Details</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(Array.isArray(data.transactions) ? data.transactions : []).map((t: any) => `
              <tr>
                <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                <td>${t.type}</td>
                <td>
                  <div style="font-size: 11px; max-width: 250px;">
                    ${t.items && t.items.length > 0 
                      ? `
                        <div style="margin-bottom: 4px;">
                          ${t.items.map((item: any) => {
                            const product = item.product || item.productId;
                            const productName = typeof product === 'object' ? product.name : 'Product';
                            return `<div style="margin-bottom: 2px;">• ${productName} <span style="color: #64748b;">(${item.quantity} x ₹${(item.pricePerUnit || 0).toLocaleString()})</span></div>`;
                          }).join('')}
                        </div>
                        ${t.description ? `<div style="font-size: 10px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 2px; margin-top: 2px;">${t.description}</div>` : ''}
                      `
                      : `<span style="color: #64748b; font-style: italic;">${t.description || 'No description'}</span>`
                    }
                  </div>
                </td>
                <td class="amount">₹${(t.amount || 0).toLocaleString()}</td>
                <td class="amount">₹${(t.paidAmount || 0).toLocaleString()}</td>
                <td class="amount">₹${(t.remainingAmount || 0).toLocaleString()}</td>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; background: #e2e8f0;">${t.status}</span>
                    ${t.paymentMethod === 'advance' ? `
                      <span style="font-size: 9px; font-weight: bold; color: #1e40af; font-style: italic;">
                        ${t.advanceOriginalAmount 
                          ? `Paid from exact advance amount: ₹${t.advanceOriginalAmount.toLocaleString()} (Used: ₹${(t.amount || 0).toLocaleString()})`
                          : (t.description?.includes('Paid from exact advance amount') 
                            ? `${t.description.replace('Paid from exact advance amount:', 'Paid from')} (Used: ₹${(t.amount || 0).toLocaleString()})`
                            : `Paid from advance: ₹${(t.amount || 0).toLocaleString()}`)}
                      </span>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (data.transactions) {
      content += `
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Total Transactions</div>
            <div class="summary-value">${data.transactions.length}</div>
          </div>
          ${data.summary.totalSales !== undefined ? `
            <div class="summary-item">
              <div class="summary-label">Total Amount</div>
              <div class="summary-value">₹${data.summary.totalSales.toLocaleString()}</div>
            </div>
          ` : ''}
          ${data.summary.totalPayments !== undefined ? `
            <div class="summary-item">
              <div class="summary-label">Total Collected</div>
              <div class="summary-value">₹${data.summary.totalPayments.toLocaleString()}</div>
            </div>
          ` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${data.transactions.map((t: any) => `
              <tr>
                <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                <td>${t.customer?.name || t.customerName}</td>
                <td class="amount">₹${(t.amount || 0).toLocaleString()}</td>
                <td><span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; background: #e2e8f0;">${t.status}</span></td>
                <td>${t.type}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    content += `
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    
    // Add a small delay to ensure styles are loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } catch (error) {
    console.error('PDF generation failed', error);
    alert('Failed to generate PDF. Try Excel export instead.');
  }
};

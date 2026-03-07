import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Calendar, Download, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';

import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface ReportData {
  summary: any;
  customers?: any[];
  transactions?: any[];
}

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reportTypes = [
    { id: 'sales', label: 'Sales Report', icon: <BarChart size={20} /> },
    { id: 'customers', label: 'Customer Report', icon: <PieChart size={20} /> },
    { id: 'outstanding', label: 'Outstanding Balances', icon: <BarChart size={20} /> },
    { id: 'payments', label: 'Payment History', icon: <BarChart size={20} /> },
  ];

  const dateRanges = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const [showCustomRange, setShowCustomRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getDates = (range: string) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case 'week':
        start.setDate(end.getDate() - end.getDay());
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        const quarter = Math.floor(end.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        break;
      case 'year':
        start.setMonth(0);
        start.setDate(1);
        break;
      case 'custom':
        return { start: startDate, end: endDate };
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const fetchReport = async () => {
    setLoading(true);
    setReportData(null); // Clear old data
    try {
      const { start, end } = getDates(dateRange);
      let data;
      
      switch (activeReport) {
        case 'sales':
          data = await api.reports.generateSales(start, end);
          break;
        case 'customers':
          data = await api.reports.generateCustomers();
          break;
        case 'outstanding':
          data = await api.reports.generateOverdues();
          break;
        case 'payments':
          data = await api.reports.generatePayments(start, end);
          break;
      }
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== 'custom' || (startDate && endDate)) {
      fetchReport();
    }
  }, [activeReport, dateRange, startDate, endDate]);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    setShowCustomRange(range === 'custom');
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!reportData) return;
    setExporting(true);
    try {
      const filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}`;
      if (format === 'excel') {
        await exportToExcel(activeReport, reportData, filename);
      } else {
        await exportToPDF(activeReport, reportData, filename);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleCustomerExport = async (customer: any) => {
    setExporting(true);
    try {
      const response = await api.transactions.getByCustomer(customer._id);
      // Ensure we have an array of transactions, handling different API response structures
      const transactions = Array.isArray(response) ? response : (response as any).data || (response as any).transactions || [];
      
      const customerData = {
        summary: {
          name: customer.name,
          phone: customer.phone,
          totalCredit: customer.totalCredit,
          totalPaid: customer.totalPaid,
          balance: customer.balance,
          advancePayment: customer.advancePayment || 0
        },
        transactions
      };
      
      const filename = `customer_report_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      // For individual reports, we'll default to PDF as it's more common for customer statements
      await exportToPDF('individual_customer', customerData, filename);
    } catch (error) {
      console.error('Customer export error:', error);
      alert('Failed to export customer report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Financial Reports</h3>
            <p className="text-xs md:text-sm text-gray-500">Generate and view detailed financial reports</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <div className="relative group">
              <button 
                disabled={!reportData || exporting}
                className="flex items-center justify-center gap-1 md:gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs md:text-sm whitespace-nowrap"
              >
                {exporting ? <Loader2 className="h-3 md:h-4 w-3 md:w-4 animate-spin" /> : <Download className="h-3 md:h-4 w-3 md:w-4" />}
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block border border-gray-200">
                <button
                  onClick={() => handleExport('excel')}
                  className="block px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Export to Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Export to PDF
                </button>
              </div>
            </div>
            <button 
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center justify-center gap-1 md:gap-2 bg-gray-100 text-gray-700 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs md:text-sm"
            >
              {loading ? <Loader2 className="h-3 md:h-4 w-3 md:w-4 animate-spin" /> : <RefreshCw className="h-3 md:h-4 w-3 md:w-4" />}
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Report Type Selection */}
          <div className="w-full md:w-1/4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Report Type</h4>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 gap-2">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`flex items-center justify-center md:justify-start px-2 md:px-4 py-2 md:py-3 rounded-lg text-left text-xs md:text-sm ${activeReport === report.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-2">{report.icon}</span>
                  <span className="font-medium hidden md:inline">{report.label}</span>
                  <span className="md:hidden font-medium text-xs">{report.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Report Configuration */}
          <div className="w-full md:w-3/4">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Date Range</h4>
              <div className="flex flex-wrap gap-2">
                {dateRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => handleDateRangeChange(range.id)}
                    className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm ${dateRange === range.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              
              {showCustomRange && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="flex-1">
                    <label htmlFor="start-date" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 md:h-4 w-3 md:w-4" />
                      <input
                        type="date"
                        id="start-date"
                        className="pl-10 pr-4 py-2 border rounded-lg w-full text-xs md:text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="end-date" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 md:h-4 w-3 md:w-4" />
                      <input
                        type="date"
                        id="end-date"
                        className="pl-10 pr-4 py-2 border rounded-lg w-full text-xs md:text-sm"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Report Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6 min-h-[300px] md:min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-full min-h-[250px]">
                  <Loader2 className="h-6 md:h-8 w-6 md:w-8 animate-spin text-blue-600" />
                </div>
              ) : reportData ? (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {activeReport === 'sales' && (
                      <>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Total Sales</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-800">₹{(reportData.summary.totalSales || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Total Paid</p>
                          <p className="text-xl md:text-2xl font-bold text-green-600">₹{(reportData.summary.totalPaid || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Outstanding</p>
                          <p className="text-xl md:text-2xl font-bold text-red-600">₹{(reportData.summary.totalOutstanding || 0).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                    {activeReport === 'customers' && (
                      <>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Total Customers</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-800">{reportData.summary.totalCustomers || 0}</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">w/ Balance</p>
                          <p className="text-xl md:text-2xl font-bold text-orange-600">{reportData.summary.customersWithBalance || 0}</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Outstanding</p>
                          <p className="text-xl md:text-2xl font-bold text-red-600">₹{(reportData.summary.totalOutstanding || 0).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                    {activeReport === 'outstanding' && (
                      <>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Total Pending</p>
                          <p className="text-xl md:text-2xl font-bold text-red-600">₹{(reportData.summary.totalOverdue || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Transactions</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-800">{reportData.summary.count || 0}</p>
                        </div>
                      </>
                    )}
                    {activeReport === 'payments' && (
                      <>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Total Collected</p>
                          <p className="text-xl md:text-2xl font-bold text-green-600">₹{(reportData.summary.totalPayments || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs md:text-sm text-gray-500">Payment Count</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-800">{reportData.summary.count || 0}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {(activeReport === 'sales' || activeReport === 'payments' || activeReport === 'outstanding') && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              {activeReport === 'sales' && (
                                <>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                </>
                              )}
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </>
                          )}
                          {activeReport === 'customers' && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Credit</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeReport === 'customers' ? (
                          reportData.customers?.map((customer: any) => (
                            <tr key={customer._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(customer.totalCredit || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(customer.totalPaid || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">₹{(customer.balance || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleCustomerExport(customer)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                                  title="Export individual report"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Export</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          reportData.transactions?.map((t: any) => (
                            <tr key={t._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.customer?.name || t.customerName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(t.amount || 0).toLocaleString()}</td>
                              {activeReport === 'sales' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{(t.paidAmount || 0).toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{(t.remainingAmount || 0).toLocaleString()}</td>
                                </>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    t.status === 'completed' || t.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                                    t.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {t.status}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {activeReport === 'customers' ? (
                      reportData.customers?.map((customer: any) => (
                        <div key={customer._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-gray-900">{customer.name}</h5>
                              <p className="text-xs text-gray-500">{customer.phone}</p>
                            </div>
                            <button
                              onClick={() => handleCustomerExport(customer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400">Total Credit</p>
                              <p className="text-xs font-medium">₹{(customer.totalCredit || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400">Total Paid</p>
                              <p className="text-xs font-medium text-green-600">₹{(customer.totalPaid || 0).toLocaleString()}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Current Balance</p>
                              <p className="text-sm font-bold text-red-600">₹{(customer.balance || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      reportData.transactions?.map((t: any) => (
                        <div key={t._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-gray-900">{t.customer?.name || t.customerName}</h5>
                              <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] leading-5 font-semibold rounded-full ${
                              t.status === 'completed' || t.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                              t.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400">Amount</p>
                              <p className="text-sm font-bold">₹{(t.amount || 0).toLocaleString()}</p>
                            </div>
                            {activeReport === 'sales' && (
                              <>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">Paid</p>
                                  <p className="text-sm font-bold text-green-600">₹{(t.paidAmount || 0).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[10px] uppercase font-bold text-gray-400">Balance</p>
                                  <p className="text-sm font-bold text-red-600">₹{(t.remainingAmount || 0).toLocaleString()}</p>
                                </div>
                              </>
                            )}
                          </div>
                          {t.paymentMethod === 'advance' && (
                            <div className="bg-blue-50 p-2 rounded text-[10px] text-blue-700 italic border border-blue-100">
                              {t.advanceOriginalAmount 
                                ? `Paid from exact advance amount: ₹${t.advanceOriginalAmount.toLocaleString()}`
                                : `Paid from advance: ₹${(t.amount || 0).toLocaleString()}`}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">No data available</h4>
                  <p className="text-gray-500">Try changing the date range or selecting a different report</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
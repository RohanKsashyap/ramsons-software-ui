import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Calendar, IndianRupee, Clock, Search, 
  ChevronDown, ChevronUp, Download, Printer, User,
  TrendingUp, CheckCircle2, Package, LayoutGrid, CreditCard,
  ArrowUpRight, ArrowDownLeft, AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';

interface CustomerLedgerProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({ 
  customerId, 
  customerName,
  onClose 
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'ledger' | 'invoices' | 'payments'>('ledger');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLedgerData();
  }, [customerId]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const response = await apiService.customers.getDetails(customerId);
      if (response && response.data) {
        setData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
      setError('Failed to load customer ledger');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Customer Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{customerName}</h2>
              <p className="text-sm text-gray-500 font-medium">Financial Ledger & Statement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500" title="Print Statement">
              <Printer className="h-5 w-5" />
            </button>
            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500" title="Download CSV">
              <Download className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button onClick={onClose} className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-gray-400">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto bg-gray-50/30">
          {error ? (
            <div className="p-12 text-center">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-bold text-lg">{error}</p>
              <button 
                onClick={fetchLedgerData}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : data && (
            <div className="p-6 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Sales</p>
                  <p className="text-2xl font-black text-gray-900">₹{data.totals.totalInvoiceAmount.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 mt-2 text-blue-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">All Invoices</span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Paid</p>
                  <p className="text-2xl font-black text-green-600">₹{data.totals.totalPaid.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 mt-2 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Cleared Amount</span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending Dues</p>
                  <p className="text-2xl font-black text-red-600">₹{data.totals.totalPending.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 mt-2 text-red-600">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Balance Owed</span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Advance Balance</p>
                  <p className="text-2xl font-black text-orange-600">₹{data.totals.advanceBalance.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 mt-2 text-orange-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Pre-payments</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
                  <button 
                    onClick={() => setActiveSection('ledger')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSection === 'ledger' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Ledger History
                  </button>
                  <button 
                    onClick={() => setActiveSection('invoices')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSection === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Invoices
                  </button>
                  <button 
                    onClick={() => setActiveSection('payments')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSection === 'payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Payments
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by ref or date..." 
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Section Content */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {activeSection === 'ledger' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Date</th>
                          <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Type</th>
                          <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Reference</th>
                          <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Debit (+)</th>
                          <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Credit (-)</th>
                          <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.ledgerHistory
                          .filter((item: any) => 
                            item.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.type.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.type === 'Invoice' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-4 text-sm font-bold text-gray-900">{item.reference}</td>
                            <td className="p-4 text-sm font-black text-gray-900 text-right">
                              {item.debit > 0 ? `₹${item.debit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="p-4 text-sm font-black text-green-600 text-right">
                              {item.credit > 0 ? `₹${item.credit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="p-4 text-sm font-black text-gray-900 text-right bg-gray-50/30">
                              ₹{item.runningBalance.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSection === 'invoices' && (
                  <div className="divide-y divide-gray-100">
                    {data.invoices
                      .filter((inv: any) => inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((inv: any) => (
                      <div key={inv._id} className="group">
                        <div 
                          className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedInvoice(expandedInvoice === inv._id ? null : inv._id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{inv.invoiceNumber}</p>
                              <p className="text-xs text-gray-400 font-medium">{formatDate(inv.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                              <p className="text-sm font-black text-gray-900">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remaining</p>
                              <p className="text-sm font-black text-red-600">₹{inv.pendingAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(inv.status)}`}>
                              {inv.status}
                            </span>
                            {expandedInvoice === inv._id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                          </div>
                        </div>
                        {expandedInvoice === inv._id && (
                          <div className="px-16 py-6 bg-gray-50/50 border-t border-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Package className="h-3 w-3" /> Invoice Items
                                </h4>
                                <div className="space-y-2">
                                  {inv.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">{item.productName}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{item.quantity} units × ₹{item.pricePerUnit}</p>
                                      </div>
                                      <p className="text-sm font-black text-gray-900">₹{item.total.toLocaleString('en-IN')}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <CreditCard className="h-3 w-3" /> Payments Applied
                                </h4>
                                {inv.allocations?.length > 0 ? (
                                  <div className="space-y-2">
                                    {inv.allocations.map((al: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
                                        <div>
                                          <p className="text-sm font-bold text-gray-900">{al.paymentNumber}</p>
                                          <p className="text-[10px] text-gray-500 font-medium">{formatDate(al.paymentDate)}</p>
                                        </div>
                                        <p className="text-sm font-black text-green-600">₹{al.allocatedAmount.toLocaleString('en-IN')}</p>
                                      </div>
                                    ))}
                                    <div className="pt-2 flex justify-between items-center border-t border-gray-200">
                                      <p className="text-[10px] font-black text-gray-400 uppercase">Total Paid</p>
                                      <p className="text-sm font-black text-green-600">₹{inv.paidAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                                    <p className="text-xs text-gray-400 font-medium">No payments applied yet</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'payments' && (
                  <div className="divide-y divide-gray-100">
                    {data.payments
                      .filter((pay: any) => pay.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((pay: any) => (
                      <div key={pay._id} className="group">
                        <div 
                          className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedPayment(expandedPayment === pay._id ? null : pay._id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-green-50 p-2.5 rounded-xl text-green-600">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{pay.paymentNumber}</p>
                              <p className="text-xs text-gray-400 font-medium">{formatDate(pay.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                              <p className="text-sm font-black text-green-600">₹{pay.amount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unallocated</p>
                              <p className="text-sm font-black text-orange-600">₹{pay.remainingAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-wider text-gray-600 border border-gray-200">
                              {pay.paymentMethod}
                            </span>
                            {expandedPayment === pay._id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                          </div>
                        </div>
                        {expandedPayment === pay._id && (
                          <div className="px-16 py-6 bg-gray-50/50 border-t border-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <FileText className="h-3 w-3" /> Applied Invoices
                                </h4>
                                {pay.allocations?.length > 0 ? (
                                  <div className="space-y-2">
                                    {pay.allocations.map((al: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-sm font-bold text-gray-900">{al.invoiceNumber}</p>
                                        <p className="text-sm font-black text-blue-600">₹{al.allocatedAmount.toLocaleString('en-IN')}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                                    <p className="text-xs text-gray-400 font-medium">This is an advance payment</p>
                                  </div>
                                )}
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm self-start">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Payment Notes</h4>
                                <p className="text-sm text-gray-600 italic">"{pay.notes || 'No notes provided'}"</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;

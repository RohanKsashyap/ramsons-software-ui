import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, FileText, Calendar, IndianRupee, Clock, Search, RotateCcw, 
  Filter, ChevronDown, ChevronUp, Download, Printer, User, 
  TrendingUp, CheckCircle2, Package, LayoutGrid, Monitor, Headphones
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Transaction, Customer, Product } from '../types';

interface CustomerOrdersModalProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({ 
  customerId, 
  customerName,
  onClose 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach(p => {
      if (p.id) map[p.id] = p;
      if (p._id) map[p._id] = p;
    });
    return map;
  }, [products]);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      const [customerResponse, transactionsResponse, productsResponse] = await Promise.all([
        apiService.customers.getById(customerId),
        apiService.transactions.getByCustomer(customerId),
        apiService.products.getAll()
      ]);

      if (customerResponse && customerResponse.data) {
        setCustomer(customerResponse.data);
      }
      
      if (transactionsResponse && Array.isArray(transactionsResponse.data || transactionsResponse)) {
        setTransactions(transactionsResponse.data || transactionsResponse);
      } else {
        setTransactions([]);
      }

      if (productsResponse && Array.isArray(productsResponse.data || productsResponse)) {
        setProducts(productsResponse.data || productsResponse);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'delivered':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'pending':
      case 'unpaid':
      case 'processing':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-none">Transaction History</h2>
              <p className="text-sm text-gray-400 mt-1">Customer ID: #{customerId.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {/* Customer Profile & Summary Cards */}
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex items-center gap-4 flex-grow">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=f3f4f6&color=9ca3af&bold=true`} 
                      alt={customerName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{customerName}</h3>
                    <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-4 w-4" />
                      {customer?.phone || 'No phone provided'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-52 bg-gray-50/50 border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Outstanding Balance</p>
                    <p className="text-2xl font-extrabold text-gray-900">₹{(customer?.balance || 0).toFixed(2)}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`h-2 w-2 rounded-full ${customer?.balance === 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${customer?.balance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {customer?.balance === 0 ? 'Settled' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 md:w-52 bg-green-50/30 border border-green-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest mb-3">Advance Payment</p>
                    <p className="text-2xl font-extrabold text-green-600">₹{(customer?.advancePayment || 0).toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">+100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed History Controls */}
              <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Detailed History</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                    <div className="bg-orange-50 p-1 rounded-md">
                      <LayoutGrid className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    Bulk Actions
                    <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold">
                    <X className="h-4 w-4" />
                    Reset Filter
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
                    <Filter className="h-4 w-4 text-gray-400" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Transactions Desktop Table */}
              <div className="hidden md:block border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="p-5 w-14 border-b border-gray-100">
                        <input type="checkbox" className="rounded-md border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4" />
                      </th>
                      <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Transaction Details</th>
                      <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Date</th>
                      <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Status</th>
                      <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTransactions.map((t) => (
                      <React.Fragment key={t._id}>
                        <tr className="hover:bg-gray-50/30 transition-colors group">
                          <td className="p-5">
                            <input type="checkbox" className="rounded-md border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4" />
                          </td>
                          <td className="p-5">
                            <div className="flex flex-col">
                              <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                {t.type.charAt(0).toUpperCase() + t.type.slice(1)} #{t.reference || t._id.slice().toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{t.description || 'No description provided'}</p>
                              {(t.type === 'invoice' || t.items?.length) && (
                                <button 
                                  onClick={() => toggleExpand(t._id)}
                                  className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-orange-600 uppercase tracking-wider hover:underline"
                                >
                                  {expandedId === t._id ? (
                                    <>
                                      <ChevronUp className="h-3 w-3" /> Hide Details
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3" /> Show Details
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-5 text-sm text-gray-500 font-medium text-center">{formatDate(t.date)}</td>
                          <td className="p-5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyles(t.status)}`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${t.status === 'completed' || t.status === 'delivered' || t.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`} />
                              {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-5 text-right font-bold text-gray-900 text-lg">
                            {t.type === 'refund' ? `-₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                          </td>
                        </tr>
                        
                        {/* Expanded Content */}
                        {expandedId === t._id && (
                          <tr>
                            <td colSpan={5} className="bg-blue-50/20 p-8 border-b border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Items Section */}
                                <div>
                                  <div className="flex items-center gap-2 mb-6 text-gray-400">
                                    <Package className="h-4 w-4" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Purchased Items ({t.items?.length || 0})</h4>
                                  </div>
                                  <div className="space-y-4">
                                    {t.items?.map((item, idx) => {
                                      const product = item.product || (typeof item.productId === 'object' ? item.productId : productMap[item.productId as string]);
                                      const productName = product?.name || 'Unknown Product';
                                      
                                      return (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                          <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                              {productName.toLowerCase().includes('mac') ? <Monitor className="h-6 w-6" /> : 
                                               productName.toLowerCase().includes('airpods') ? <Headphones className="h-6 w-6" /> : 
                                               <Package className="h-6 w-6" />}
                                            </div>
                                            <div>
                                              <p className="font-bold text-gray-900">{productName}</p>
                                              <div className="flex flex-col gap-0.5 mt-1">
                                                <p className="text-xs text-gray-400">Qty: {item.quantity} {product?.unit || ''}</p>
                                                {product?.description && (
                                                  <p className="text-[10px] text-gray-500 italic leading-tight max-w-[250px]">
                                                    {product.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <p className="font-bold text-gray-900">₹{item.total.toLocaleString('en-IN')}</p>
                                        </div>
                                      );
                                    })}
                                    {(!t.items || t.items.length === 0) && (
                                      <p className="text-sm text-gray-400 italic">No items found for this transaction</p>
                                    )}
                                  </div>
                                </div>

                                {/* Tracking Section */}
                                <div>
                                  <div className="flex items-center gap-2 mb-6 text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Tracking History</h4>
                                  </div>
                                  <div className="space-y-6">
                                    {/* Mock tracking for visualization as per image */}
                                    <div className="relative pl-8 pb-6 border-l-2 border-green-500 last:border-0 last:pb-0">
                                      <div className="absolute -left-[11px] top-0 h-5 w-5 bg-white border-2 border-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">Delivered</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(t.date)} • 02:30 PM</p>
                                      </div>
                                    </div>
                                    <div className="relative pl-8 pb-6 border-l-2 border-green-500 last:border-0 last:pb-0">
                                      <div className="absolute -left-[11px] top-0 h-5 w-5 bg-white border-2 border-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">Out for Delivery</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(t.date)} • 09:15 AM</p>
                                      </div>
                                    </div>
                                    <div className="relative pl-8 pb-6 border-l-2 border-green-500 last:border-0 last:pb-0">
                                      <div className="absolute -left-[11px] top-0 h-5 w-5 bg-white border-2 border-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">Processing</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(new Date(t.date).getTime() - 86400000 * 2).toISOString())} • 11:00 AM</p>
                                      </div>
                                    </div>
                                    <div className="relative pl-8 last:border-0">
                                      <div className="absolute -left-[11px] top-0 h-5 w-5 bg-white border-2 border-orange-500 rounded-full flex items-center justify-center">
                                        <div className="h-2 w-2 bg-orange-500 rounded-full" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">Order Placed</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(new Date(t.date).getTime() - 86400000 * 3).toISOString())} • 04:45 PM</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Transactions Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredTransactions.map((t) => (
                  <div key={t._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded-md border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900">
                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">#{t.reference || t._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-base leading-none">
                          {t.type === 'refund' ? `-₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50/30">
                      <div className="flex items-center justify-between mb-3">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyles(t.status)}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${t.status === 'completed' || t.status === 'delivered' || t.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`} />
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                        
                        {(t.type === 'invoice' || t.items?.length) && (
                          <button 
                            onClick={() => toggleExpand(t._id)}
                            className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1"
                          >
                            {expandedId === t._id ? <><ChevronUp className="h-3 w-3" /> Hide</> : <><ChevronDown className="h-3 w-3" /> Details</>}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{t.description || 'No description provided'}</p>
                    </div>

                    {/* Mobile Expanded Content */}
                    {expandedId === t._id && (
                      <div className="p-4 bg-orange-50/10 border-t border-orange-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Items ({t.items?.length || 0})</h4>
                        <div className="space-y-3">
                          {t.items?.map((item, idx) => {
                            const product = item.product || (typeof item.productId === 'object' ? item.productId : productMap[item.productId as string]);
                            const productName = product?.name || 'Unknown Product';
                            return (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                    <Package className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{productName}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Qty: {item.quantity}</p>
                                    {product?.description && (
                                      <p className="text-[8px] text-gray-500 italic leading-tight mt-0.5 line-clamp-1">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs font-bold text-gray-900">₹{(item.total || (item.pricePerUnit * item.quantity)).toLocaleString('en-IN')}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 font-medium">Showing <span className="font-bold text-gray-900">{filteredTransactions.length}</span> transactions</p>
          <div className="flex items-center gap-8">
            {/* <button className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-2">
              <Download className="h-4.5 w-4.5" />
              Export CSV
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200">
              <Printer className="h-4.5 w-4.5" />
              Print Statement
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersModal;


import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, CreditCard, IndianRupee, Check, Building2 } from 'lucide-react';
import type { Transaction } from '../types';
import PaymentForm from './PaymentForm';
import { apiService } from '../services/api';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Transaction | null>(null);

  const fetchPayments = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.transactions.getAll();
      const all = (response as any)?.data || response || [];
      const paymentOnly: Transaction[] = Array.isArray(all)
        ? all.filter((t: any) => 
            (t.type === 'PAYMENT' || t.type === 'payment')
          ).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        : [];
      setPayments(paymentOnly);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter(payment => {
    const customerName = payment.customer?.name ||
                        (payment.customerId && typeof payment.customerId === 'object' && (payment.customerId as any)?.name ? (payment.customerId as any).name : null) ||
                        payment.customerName ||
                        '';
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterMethod === 'ALL' || payment.paymentMethod === filterMethod;
    
    return matchesSearch && matchesFilter;
  });

  const getPaymentMethodIcon = (method: string) => {
    switch(method?.toUpperCase()) {
      case 'CASH':
        return <IndianRupee className="h-4 w-4 text-green-600" />;
      case 'CREDIT':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'BANK_TRANSFER':
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case 'PARTIAL_PAYMENT':
        return <Check className="h-4 w-4 text-yellow-600" />;
      default:
        return <IndianRupee className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatPaymentMethod = (method: string) => {
    if (!method) return 'N/A';
    return method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  useEffect(() => {
    const handleDataChanged = (event: CustomEvent<{ entity: string }>) => {
      if (event.detail.entity === 'payment') {
        fetchPayments();
      }
    };

    window.addEventListener('dataChanged', handleDataChanged as EventListener);

    return () => {
      window.removeEventListener('dataChanged', handleDataChanged as EventListener);
    };
  }, [fetchPayments]);

  const handlePaymentSaved = async () => {
    await fetchPayments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search payments..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              className="pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              setEditingPayment(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">PMT-{payment._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.customer?.name ||
                         (payment.customerId && typeof payment.customerId === 'object' && (payment.customerId as any)?.name ? (payment.customerId as any).name : null) ||
                         payment.customerName ||
                         'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.customer?.phone || 
                         (typeof payment.customerId === 'object' ? payment.customerId.phone : null) || 
                         ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">₹{payment.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex p-1 rounded-full mr-2 bg-gray-100">
                          {getPaymentMethodIcon(payment.paymentMethod || '')}
                        </span>
                        <span className="text-sm text-gray-900">{formatPaymentMethod(payment.paymentMethod || '')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {payment.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                      <button className="text-blue-600 hover:text-blue-800 mr-3">Print</button>
                      <button 
                        onClick={() => {
                          setEditingPayment(payment);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Payment Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-1">Total Received</h4>
            <p className="text-2xl font-bold text-green-700">
            ₹{payments.reduce((sum, payment) => sum + (payment.type === 'payment' ? payment.amount : 0), 0).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Cash Payments</h4>
            <p className="text-2xl font-bold text-blue-700">
            ₹{payments.filter(p => p.paymentMethod === 'CASH').reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800 mb-1">Credit Payments</h4>
            <p className="text-2xl font-bold text-purple-700">
            ₹{payments.filter(p => p.paymentMethod === 'CREDIT').reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <PaymentForm
          payment={editingPayment || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingPayment(null);
          }}
          onSave={handlePaymentSaved}
        />
      )}
    </div>
  );
};

export default Payments;

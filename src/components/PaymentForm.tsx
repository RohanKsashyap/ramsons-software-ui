import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTransactions, useCustomers } from '../hooks/useElectron';
import { apiService } from '../services/api';
import type { Transaction, Customer } from '../types';
import CustomerSelector from './CustomerSelector';

interface PaymentFormProps {
  payment?: Transaction;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ payment, onClose, onSave }) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const { customers } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [pendingInvoices, setPendingInvoices] = useState<Transaction[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<Transaction[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: payment?.customerId || '',
    amount: payment?.amount?.toString() || '',
    description: payment?.description || '',
    paymentMethod: payment?.paymentMethod || 'CASH',
    invoiceId: payment?.reference || '',
    selectedInvoiceIds: [] as string[]
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        customerId: typeof payment.customerId === 'string' ? payment.customerId : payment.customerId?._id || '',
        amount: payment.amount?.toString() || '',
        description: payment.description || '',
        paymentMethod: payment.paymentMethod || 'CASH',
        invoiceId: payment.reference || '',
        selectedInvoiceIds: []
      });
    }
  }, [payment]);
  useEffect(() => {
    if (formData.customerId) {
      fetchCustomerInvoices(typeof formData.customerId === 'string' ? formData.customerId : (formData.customerId as any)?._id);
    }
  }, [formData.customerId]);

  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);

  const fetchCustomerInvoices = async (customerId: string) => {
    try {
      setInvoicesLoading(true);
      const response: any = await apiService.transactions.getAll();
      const transactionsData = response?.success ? response.data : Array.isArray(response) ? response : [];
      
      const allCustomerInvoices = transactionsData.filter((transaction: Transaction) => {
        const isInvoice = (transaction.type === 'invoice' || transaction.type === 'INVOICE');
        const belongsToCustomer = transaction.customerId === customerId || 
          (typeof transaction.customerId === 'object' && (transaction.customerId as any)?._id === customerId);
        return isInvoice && belongsToCustomer;
      });

      const pending = allCustomerInvoices.filter((inv: Transaction) => 
        inv.status === 'pending' || inv.status === 'PENDING' || inv.status === 'partial' || inv.status === 'PARTIAL'
      );
      
      const paid = allCustomerInvoices.filter((inv: Transaction) => 
        inv.status === 'completed' || inv.status === 'COMPLETED' || inv.status === 'paid' || inv.status === 'PAID'
      );
      
      setPendingInvoices(pending);
      setPaidInvoices(paid);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setPendingInvoices([]);
      setPaidInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const paymentAmount = parseFloat(formData.amount);
      const selectedInvoiceIds = formData.selectedInvoiceIds.length > 0 
        ? formData.selectedInvoiceIds 
        : (formData.invoiceId ? [formData.invoiceId] : []);

      if (formData.paymentMethod === 'advance') {
        const availableAdvance = selectedCustomer?.advancePayment || 0;
        if (paymentAmount > availableAdvance) {
          alert(`Insufficient advance balance. Available: ₹${availableAdvance.toFixed(2)}`);
          setLoading(false);
          return;
        }
      }

      // Always create a standalone payment transaction
      // The backend updateInvoiceStatusIfPaid will handle allocating this payment to invoices
      const paymentData: Partial<Transaction> = {
        customerId: typeof formData.customerId === 'string' ? formData.customerId : (formData.customerId as any)?._id,
        type: 'payment' as const,
        amount: paymentAmount,
        status: 'completed',
        description: formData.description || (formData.paymentMethod === 'advance' ? `Paid from exact advance amount: ₹${(selectedCustomer?.advancePayment || 0).toFixed(2)}` : (selectedInvoiceIds.length > 0 ? `Payment for Invoice(s): ${selectedInvoiceIds.map(id => id.substring(0,8)).join(', ')}` : '')),
        paymentMethod: formData.paymentMethod,
        reference: formData.invoiceId || (selectedInvoiceIds.length > 0 ? selectedInvoiceIds[0] : undefined),
      };
      
      await createTransaction(paymentData);

      if (onSave) {
        await onSave();
      }

      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          message: payment ? 'Payment updated successfully.' : 'Payment recorded successfully.',
          type: 'success'
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleInvoiceSelection = (invoiceId: string) => {
    setFormData(prev => {
      const selectedIds = prev.selectedInvoiceIds.includes(invoiceId)
        ? prev.selectedInvoiceIds.filter(id => id !== invoiceId)
        : [...prev.selectedInvoiceIds, invoiceId];
      
      const totalAmount = selectedIds.reduce((sum, id) => {
        const invoice = pendingInvoices.find(inv => inv._id === id);
        return sum + (invoice?.amount || 0);
      }, 0);

      return {
        ...prev,
        selectedInvoiceIds: selectedIds,
        amount: totalAmount.toString()
      };
    });
  };

  const handleCustomerChange = (customerId: string, customerData?: Partial<Customer>) => {
    setFormData({
      ...formData,
      customerId: customerId,
      selectedInvoiceIds: [],
      amount: ''
    });
    setSelectedCustomer(customerData || null);
    
    if (!customerId) {
      setPendingInvoices([]);
      setPaidInvoices([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900">
            {payment ? 'Edit Payment' : 'Record New Payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="customerId" className="block text-sm font-semibold text-gray-800 mb-3">
              Customer *
            </label>
            <CustomerSelector
              value={typeof formData.customerId === 'string' ? formData.customerId : formData.customerId?._id || ''}
              onChange={handleCustomerChange}
              required
              placeholder="Search or create customer"
            />
            
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Customer Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  </div>
                  {selectedCustomer.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium text-gray-900">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Total Credit:</span>
                    <p className="font-medium text-gray-900">₹{(selectedCustomer.balance && selectedCustomer.balance > 0 ? (selectedCustomer.totalCredit || 0) : 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid:</span>
                    <p className="font-medium text-green-600">₹{(selectedCustomer.balance && selectedCustomer.balance > 0 ? (selectedCustomer.totalPaid || 0) : 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Balance Due:</span>
                    <p className="font-bold text-red-600">₹{(selectedCustomer.balance || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Advance Payment:</span>
                    <p className="font-bold text-blue-600">₹{(selectedCustomer.advancePayment || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {formData.customerId && (
            <div className="space-y-4">
              {paidInvoices.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50/50 p-5 shadow-sm">
                  <label className="block text-sm font-semibold text-green-800 mb-3">
                    Paid Invoices
                  </label>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {paidInvoices.map((invoice) => (
                      <div key={invoice._id} className="flex items-start p-3 border border-green-100 rounded-lg bg-white/50">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">INV-{invoice._id?.substring(0, 8) || 'N/A'}</p>
                            <p className="text-sm font-semibold text-green-600">₹{invoice.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Completed</p>
                            {invoice.description && <p className="text-xs text-gray-500 italic max-w-[70%] truncate">{invoice.description}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-red-600 mb-3">
                  Pending Invoices
                </label>
                
                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : pendingInvoices.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {pendingInvoices.map((invoice) => (
                      <div key={invoice._id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleInvoiceSelection(invoice._id)}>
                        <input
                          type="checkbox"
                          checked={formData.selectedInvoiceIds.includes(invoice._id)}
                          onChange={() => handleInvoiceSelection(invoice._id)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">INV-{invoice._id?.substring(0) || 'N/A'}</p>
                            <p className="text-sm font-semibold text-gray-900">₹{invoice.amount.toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-gray-500">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                          {invoice.description && <p className="text-xs text-gray-600 truncate">{invoice.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-700">No pending invoices for this customer</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="invoiceId" className="block text-sm font-semibold text-gray-800 mb-3">
              Or Enter Invoice ID Manually (Optional)
            </label>
            <input
              type="text"
              id="invoiceId"
              name="invoiceId"
              value={formData.invoiceId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter invoice ID if not shown above"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-800 mb-3">
              Payment Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="paymentMethod" className="block text-sm font-semibold text-gray-800 mb-3">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              required
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CASH">Cash</option>
              <option value="advance">From Advance</option>
              <option value="CREDIT">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-3">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter payment description"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;

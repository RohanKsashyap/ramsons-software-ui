import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTransactions, useCustomers } from '../hooks/useElectron';
import type { Transaction, Customer } from '../types';
import CustomerSelector from './CustomerSelector';

interface TransactionFormProps {
  transaction?: Transaction;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onClose, onSave }) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const { customers } = useCustomers();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: transaction?.customerId || '',
    type: transaction?.type || 'SALE',
    amount: transaction?.amount?.toString() || '',
    description: transaction?.description || '',
    paymentMethod: transaction?.paymentMethod || 'CASH',
    dueDate: transaction?.dueDate ? new Date(transaction.dueDate).toISOString().split('T')[0] : '',
    status: transaction?.status || 'UNPAID',
    useAdvancePayment: false
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map form data to API format
      const transactionData = {
        customerId: typeof formData.customerId === 'string' ? formData.customerId : (formData.customerId as any)._id,
        type: (formData.type === 'SALE' ? 'invoice' : 'payment') as 'payment' | 'invoice',
        amount: parseFloat(formData.amount),
        status: (formData.type === 'SALE'
          ? (formData.status === 'PAID' ? 'completed' : 'pending')
          : 'completed') as 'pending' | 'completed' | 'failed' | 'cancelled' | 'paid' | 'unpaid' | 'partial' | 'overdue',
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        useAdvancePayment: formData.type === 'SALE' ? formData.useAdvancePayment : false,
      };

      if (transaction?._id) {
        // Update existing transaction
        await updateTransaction(transaction._id, transactionData);
      } else {
        // Create new transaction
        await createTransaction(transactionData);
      }

      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          type: transaction ? 'info' : 'payment_received',
          title: transaction ? 'Transaction Updated' : 'Transaction Created',
          message: transaction ? 'Transaction details updated successfully.' : 'New transaction recorded successfully.',
          customerName: selectedCustomer?.name,
          priority: 'low',
          autoClose: true,
        });
      }

      if (onSave) {
        await Promise.resolve(onSave());
      }

      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
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

  const handleCustomerChange = (customerId: string, customerData?: Partial<Customer>) => {
    setFormData({
      ...formData,
      customerId: customerId,
    });
    setSelectedCustomer(customerData || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
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
              value={typeof formData.customerId === 'string' ? formData.customerId : ''}
              onChange={handleCustomerChange}
              required
              placeholder="Search or create customer"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-3">
              Transaction Type *
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="SALE">Sale</option>
              <option value="PAYMENT">Payment</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-800 mb-3">
              Amount *
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
              <option value="CREDIT">Credit</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
            </select>
          </div>

          {formData.type === 'SALE' && (
            <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
              <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-800 mb-3">
                Due Date {formData.paymentMethod === 'CREDIT' && '*'}
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                required={formData.paymentMethod === 'CREDIT'}
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.paymentMethod === 'CREDIT' && (
                <p className="mt-2 text-sm text-gray-500">
                  Due date is required for credit transactions. Default is 30 days from today if not specified.
                </p>
              )}
            </div>
          )}

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
              placeholder="Enter transaction description"
            />
          </div>

          {formData.type === 'SALE' && (
            <>
              <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
                <label htmlFor="status" className="block text-sm font-semibold text-gray-800 mb-3">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              
              {selectedCustomer && (selectedCustomer.advancePayment || 0) > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useAdvancePayment"
                      name="useAdvancePayment"
                      checked={formData.useAdvancePayment}
                      onChange={(e) => setFormData({
                        ...formData,
                        useAdvancePayment: e.target.checked
                      })}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="useAdvancePayment" className="ml-2 block text-sm font-medium text-gray-800">
                      Use advance payment (Available: ${selectedCustomer.advancePayment?.toFixed(2) || '0.00'})
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Checking this will automatically use available advance payment to cover this transaction.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
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

export default TransactionForm;

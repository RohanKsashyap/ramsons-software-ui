import React, { useState } from 'react';
import { X } from 'lucide-react';
import apiService from '../services/api';
import type { Customer } from '../types';

interface AdvancePaymentModalProps {
  customer: Customer;
  isAddingAdvance: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  customer,
  isAddingAdvance,
  onClose,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isAddingAdvance) {
        await apiService.customers.addAdvancePayment(customer.id, {
          amount: parseFloat(amount),
          description: 'Advance payment added'
        });
      } else {
        await apiService.customers.useAdvancePayment(customer.id, parseFloat(amount));
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Advance payment error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred while processing the payment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAddingAdvance ? 'Add Advance Payment' : 'Use Advance Payment'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-medium">{customer.name}</p>
              {customer.phone && <p className="text-sm text-gray-600">Phone: {customer.phone}</p>}
            </div>
          </div>

          {!isAddingAdvance && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Available Advance: <span className="font-semibold">₹{customer.advancePayment?.toFixed(2) || '0.00'}</span>
              </p>
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg mr-2 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {loading ? 'Processing...' : isAddingAdvance ? 'Add Payment' : 'Use Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancePaymentModal;

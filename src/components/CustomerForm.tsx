import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useCustomers } from '../hooks/useElectron';
import type { Customer } from '../types';

interface CustomerFormProps {
  customer?: Customer | null;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  onSuccess?: (customer: Customer) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onClose, onSave, onSuccess }) => {
  const { createCustomer, updateCustomer } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedCustomer: any;
      if (customer) {
        savedCustomer = await updateCustomer(customer.id, formData);
      } else {
        savedCustomer = await createCustomer(formData);
      }

      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          type: 'info',
          title: customer ? 'Customer Updated' : 'Customer Added',
          message: `${formData.name} has been ${customer ? 'updated' : 'added'} successfully.`,
          priority: 'low',
          autoClose: true,
        });
      }

      const resultCustomer = savedCustomer?.data || savedCustomer;
      if (onSuccess && resultCustomer) {
        onSuccess({
          ...resultCustomer,
          id: resultCustomer._id || resultCustomer.id
        });
      }

      if (onSave) {
        await Promise.resolve(onSave());
      }
      onClose();
    } catch (error) {
      alert('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-[70]">
      <div className="bg-white rounded-lg md:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-8 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base md:text-xl font-bold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="h-4 md:h-5 w-4 md:w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-4 md:space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 md:px-5 py-3 md:py-4 border border-gray-100 bg-gray-50 rounded-lg md:rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 md:px-5 py-3 md:py-4 border border-gray-100 bg-gray-50 rounded-lg md:rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 md:px-5 py-3 md:py-4 border border-gray-100 bg-gray-50 rounded-lg md:rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 md:px-5 py-3 md:py-4 border border-gray-100 bg-gray-50 rounded-lg md:rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="Enter customer address"
              />
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 border border-gray-200 text-gray-700 rounded-lg md:rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save Customer'}</span>
              <span className="sm:hidden">{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
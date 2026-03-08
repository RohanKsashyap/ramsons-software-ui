import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Phone, Mail, MapPin, Trash2, Edit, Eye, Minus } from 'lucide-react';
import type { Customer } from '../types';
import { useCustomers } from '../hooks/useElectron';
import { CustomerForm } from './CustomerForm';
import { apiService } from '../services/api';
import CustomerOrdersModal from './CustomerOrdersModal';

export const Customers: React.FC = () => {
  const { customers, loading, error, fetchCustomers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState<Customer | null>(null);

  useEffect(() => {
    // Check URL parameters for action=new
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }

    // Listen for data change events (e.g., when transactions are deleted)
    const handleDataChanged = (event: CustomEvent) => {
      if (event.detail?.type === 'transaction' && event.detail?.action === 'delete') {
        // Refresh customer data when transactions are deleted
        fetchCustomers();
      }
    };

    window.addEventListener('dataChanged', handleDataChanged as EventListener);

    return () => {
      window.removeEventListener('dataChanged', handleDataChanged as EventListener);
    };
  }, [fetchCustomers]);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };
  
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };
  
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomerForOrders(customer);
    setShowOrdersModal(true);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === sortedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(sortedCustomers.map(c => c.id));
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setDeleting(true);
      await apiService.customers.delete(customerId);
      window.dispatchEvent(new CustomEvent('dataChanged', { detail: { type: 'customer', action: 'delete' } }));
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    try {
      setDeleting(true);
      await apiService.customers.deleteMultiple(selectedCustomers);
      window.dispatchEvent(new CustomEvent('dataChanged', { detail: { type: 'customer', action: 'delete', count: selectedCustomers.length } }));
      await fetchCustomers();
      setSelectedCustomers([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting customers:', error);
      alert('Failed to delete customers');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    return customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'balance') {
      return b.balance - a.balance;
    } else if (sortBy === 'recent') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div className="relative flex-1 sm:flex-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 md:h-5 w-4 md:w-5" />
          <input
            type="text"
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4">
          <div className="relative flex-1 sm:flex-auto">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 md:h-4 w-3 md:w-4" />
            <select
              className="pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white w-full text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="balance">Sort by Balance</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>

          <div className="flex gap-2">
            {selectedCustomers.length > 0 && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete ({selectedCustomers.length})</span>
                <span className="sm:hidden">({selectedCustomers.length})</span>
              </button>
            )}
            
            <button 
              onClick={() => setShowForm(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Customer</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCustomers.length > 0 ? (
            sortedCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{customer.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{customer.email || 'No email provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button 
                        onClick={() => handleViewCustomer(customer)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="View Orders"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        disabled={deleting}
                        title="Delete Customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-4">Financial Summary</p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Advance Balance</p>
                        <p className="text-sm font-bold text-blue-600">
                          ₹{(customer.advancePayment || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pending Balance</p>
                        <p className="text-sm font-bold text-gray-900">
                          ₹{(customer.balance > 0 ? customer.balance : 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Purchase</p>
                        <p className="text-sm font-bold text-gray-900">
                          ₹{(customer.totalCredit || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                        <p className="text-sm font-bold text-green-600">
                          ₹{Math.max(0, (customer.totalPaid || 0) - (customer.advancePayment || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border-t border-gray-50 flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add  Advance
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm">
                    <Minus className="h-4 w-4" />
                    Use Advance
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleCloseForm}
          onSave={async () => {
            await fetchCustomers();
            handleCloseForm();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Customers
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedCustomers.length} customer(s)? 
              This action cannot be undone and will also delete all associated transactions.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMultiple}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {showOrdersModal && selectedCustomerForOrders && (
        <CustomerOrdersModal
          customerId={selectedCustomerForOrders.id}
          customerName={selectedCustomerForOrders.name}
          onClose={() => setShowOrdersModal(false)}
        />
      )}
    </>
  );
};

export default Customers;
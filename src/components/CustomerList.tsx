import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, Minus } from 'lucide-react';
import { useCustomers } from '../hooks/useElectron';
import { CustomerForm } from './CustomerForm';
import { AdvancedSearch } from './AdvancedSearch';
import CustomerOrdersModal from './CustomerOrdersModal';
import AdvancePaymentModal from './AdvancePaymentModal';
import apiService from '../services/api';
import type { Customer } from '../types';

export const CustomerList: React.FC = () => {
  const { customers, loading, error, fetchCustomers } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [isAddingAdvance, setIsAddingAdvance] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setFilteredCustomers(customers);
    // Reset selection when customers change or filters apply
    setSelectedIds([]);
  }, [customers]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id || c._id).filter(Boolean) as string[]);
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setIsDeleting(true);
    try {
      await apiService.customers.deleteMultiple(selectedIds);
      await fetchCustomers();
      setSelectedIds([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting customers:', error);
      alert('Failed to delete customers');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        // Delete customer using the correct API service method
        await apiService.customers.delete(customerId);
        
        await fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const handleSaveCustomer = async () => {
    await fetchCustomers();
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleViewOrders = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowOrdersModal(true);
  };
  
  const handleAdvancePayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAddingAdvance(true);
    setShowAdvanceModal(true);
  };

  const handleUseAdvance = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAddingAdvance(false);
    setShowAdvanceModal(true);
  };

  const handleAdvanceSuccess = () => {
    fetchCustomers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Customer Management</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        customers={customers}
        onFilteredResults={setFilteredCustomers}
        onSearchChange={setSearchTerm}
      />

      {/* Results Summary and Bulk Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all"
              checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="select-all" className="text-sm font-medium text-blue-900 cursor-pointer">
              Select All
            </label>
          </div>
          <p className="text-blue-800">
            Showing <span className="font-semibold">{filteredCustomers.length}</span> of{' '}
            <span className="font-semibold">{customers.length}</span> customers
            {searchTerm && (
              <> matching "<span className="font-semibold">{searchTerm}</span>"</>
            )}
            {selectedIds.length > 0 && (
              <> | <span className="font-semibold text-blue-600">{selectedIds.length}</span> selected</>
            )}
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Customer Grid */}
      <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <div 
            key={customer.id || customer._id} 
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all flex flex-col ${
              selectedIds.includes((customer.id || customer._id) as string) 
                ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
                : 'border-gray-100 hover:shadow-md'
            }`}
          >
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes((customer.id || customer._id) as string)}
                    onChange={() => toggleSelectCustomer((customer.id || customer._id) as string)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{customer.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{customer.email || 'No email provided'}</p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleViewOrders(customer)}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="View Orders"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
                      ₹{customer.advancePayment?.toFixed(2) || '0.00'}
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
              <button
                onClick={() => handleAdvancePayment(customer)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Advance
              </button>
              <button
                onClick={() => handleUseAdvance(customer)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!customer.advancePayment || customer.advancePayment <= 0}
              >
                <Minus className="h-4 w-4" /> Use Advance
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleCloseForm}
          onSave={handleSaveCustomer}
        />
      )}

      {/* Customer Orders Modal */}
      {showOrdersModal && selectedCustomer && (
        <CustomerOrdersModal
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onClose={() => setShowOrdersModal(false)}
        />
      )}

      {/* Advance Payment Modal */}
      {showAdvanceModal && selectedCustomer && (
        <AdvancePaymentModal
          customer={selectedCustomer}
          isAddingAdvance={isAddingAdvance}
          onClose={() => setShowAdvanceModal(false)}
          onSuccess={handleAdvanceSuccess}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Delete Multiple Customers</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">{selectedIds.length}</span> selected customers? 
                This action <span className="text-red-600 font-semibold">cannot be undone</span> and will permanently remove all associated transactions and data.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Customers'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
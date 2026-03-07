import React, { useState, useEffect } from 'react';
import { UserPlus, Search, X, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { useCustomers } from '../hooks/useElectron';
import type { Customer } from '../types';

interface CustomerSelectorProps {
  value: string;
  onChange: (customerId: string, customerData?: Partial<Customer>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  value,
  onChange,
  required = false,
  placeholder = "Select or create customer",
  className = ""
}) => {
  const { customers, loading, fetchCustomers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', newCustomerData);
  }, [newCustomerData]);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Sync searchTerm with value prop
  useEffect(() => {
    if (value) {
      const customer = customers.find(c => (c.id === value || c._id === value));
      if (customer) {
        setSearchTerm(customer.name);
      } else if (!loading) {
        // If value is provided but customer not found, re-fetch list
        fetchCustomers();
      }
    } else if (!value && !showDropdown) {
      setSearchTerm('');
    }
  }, [value, customers, showDropdown, loading, fetchCustomers]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleCustomerSelect = (customer: Customer) => {
    onChange(customer.id, customer);
    setSearchTerm(customer.name);
    setShowDropdown(false);
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, customer data:', newCustomerData);
    
    if (!newCustomerData.name.trim()) {
      alert('Customer name is required');
      return;
    }

    try {
      setCreatingCustomer(true);
      console.log('Creating customer with data:', {
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim() || undefined,
        email: newCustomerData.email.trim() || undefined,
        address: newCustomerData.address.trim() || undefined,
        totalCredit: 0,
        totalPaid: 0,
        balance: 0
      });
      
      const response = await apiService.customers.create({
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim() || undefined,
        email: newCustomerData.email.trim() || undefined,
        address: newCustomerData.address.trim() || undefined,
        totalCredit: 0,
        totalPaid: 0,
        balance: 0
      });

      console.log('API response:', response);

      if (response && response.success && response.data) {
        // Refresh the customer list from the server
        await fetchCustomers();
        
        const newCustomer = {
          ...response.data,
          id: response.data._id
        };
        
        // Select the new customer
        onChange(response.data._id, newCustomer);
        setSearchTerm(newCustomerData.name);
        
        // Reset form and close
        setNewCustomerData({ name: '', phone: '', email: '', address: '' });
        setShowNewCustomerForm(false);
        setShowDropdown(false);
      } else {
        console.error('Invalid response structure:', response);
        alert('Invalid response from server. Please try again.');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === value || c._id === value);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setShowDropdown(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Create New Customer Button */}
          <button
            type="button"
            onClick={() => {
              setShowNewCustomerForm(true);
              setShowDropdown(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 flex items-center gap-2 text-blue-600"
          >
            <UserPlus className="h-4 w-4" />
            <span className="font-medium">Create New Customer</span>
          </button>

          {/* Customer List */}
          {loading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              Loading customers...
            </div>
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleCustomerSelect(customer)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{customer.name}</div>
                <div className="text-sm text-gray-500">
                  {customer.phone && `📞 ${customer.phone}`}
                  {customer.email && ` • ✉️ ${customer.email}`}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No customers found
            </div>
          )}
        </div>
      )}

      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Customer</h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewCustomerForm(false);
                  setNewCustomerData({ name: '', phone: '', email: '', address: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              console.log('Form onSubmit triggered');
              handleCreateNewCustomer(e);
            }} className="p-4 space-y-4">
              <div>
                <label htmlFor="newCustomerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="newCustomerName"
                  required
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label htmlFor="newCustomerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="newCustomerPhone"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div>
                <label htmlFor="newCustomerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="newCustomerEmail"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address (optional)"
                />
              </div>

              <div>
                <label htmlFor="newCustomerAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  id="newCustomerAddress"
                  rows={2}
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address (optional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomerForm(false);
                    setNewCustomerData({ name: '', phone: '', email: '', address: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creatingCustomer || !newCustomerData.name.trim()}
                  onClick={(e) => {
                    console.log('Button clicked, calling handleCreateNewCustomer directly');
                    e.preventDefault();
                    handleCreateNewCustomer(e);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
                >
                  {creatingCustomer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Create Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Customer Display */}
      {selectedCustomer && !showDropdown && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
              <div className="text-sm text-blue-700">
                {selectedCustomer.phone && `📞 ${selectedCustomer.phone}`}
                {selectedCustomer.email && ` • ✉️ ${selectedCustomer.email}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;

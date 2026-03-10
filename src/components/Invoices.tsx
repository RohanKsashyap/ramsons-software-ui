import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Printer, Mail, Eye } from 'lucide-react';
import { apiService } from '../services/api';
import type { Transaction, Customer } from '../types';
import InvoiceFormTemplate from './InvoiceFormTemplate';
import {GSTBillModal} from './GSTBillModal';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Transaction | null>(null);
  const [selectedInvoiceForGST, setSelectedInvoiceForGST] = useState<Transaction | null>(null);

  const fetchInvoices = React.useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await apiService.transactions.getAll();
      const transactionsData = response?.success ? response.data : Array.isArray(response) ? response : [];
      const invoiceData = transactionsData
        .filter((transaction: Transaction) =>
          transaction.type === 'invoice' || transaction.type === 'INVOICE'
        )
        .sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = React.useCallback(async () => {
    try {
      const response = await apiService.customers.getAll();
      const customersData = response?.data || response || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [fetchInvoices, fetchCustomers]);

  useEffect(() => {
    const handleDataChanged = (event: CustomEvent<{ entity: string }>) => {
      if (event.detail.entity === 'invoice') {
        fetchInvoices();
      }
    };

    window.addEventListener('dataChanged', handleDataChanged as EventListener);

    return () => {
      window.removeEventListener('dataChanged', handleDataChanged as EventListener);
    };
  }, [fetchInvoices]);

  const handleInvoiceSaved = async () => {
    await fetchInvoices();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const customerName = invoice.customer?.name ||
                        (invoice.customerId && typeof invoice.customerId === 'object' && (invoice.customerId as any)?.name ? (invoice.customerId as any).name : null) ||
                        invoice.customerName ||
                        '';
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || invoice.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadgeClass = (status:string ,paymentMethod?:string) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  



  const getStatusLabel = (invoice: Transaction) => {
    // Show partial payment badge if paidAmount exists and is less than amount
    const paidAmount = (invoice as any).paidAmount || 0;
    if (paidAmount > 0 && paidAmount < invoice.amount) {
      return `₹${paidAmount.toFixed(2)} paid of ₹${invoice.amount.toFixed(2)}`;
    }
    // Show "Paid by advance" for fully advance-paid transactions
    if (invoice.paymentMethod === 'advance' && paidAmount >= invoice.amount) {
      return 'Paid by advance';
    }
    return invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  };
  


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <InvoiceFormTemplate
        invoice={editingInvoice || undefined}
        onClose={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
        onSave={handleInvoiceSaved}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div className="relative flex-1 sm:flex-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 md:h-5 w-4 md:w-5" />
          <input
            type="text"
            placeholder="Search invoices..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              setEditingInvoice(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline"> </span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">INV-{invoice._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.customer?.name ||
                         (invoice.customerId && typeof invoice.customerId === 'object' && (invoice.customerId as any)?.name ? (invoice.customerId as any).name : null) ||
                         invoice.customerName ||
                         'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.customer?.phone ||
                         (invoice.customerId && typeof invoice.customerId === 'object' && (invoice.customerId as any)?.phone ? (invoice.customerId as any).phone : null) ||
                         ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{invoice.amount.toFixed(2)}</div>
                      {((invoice as any).paidAmount || 0) > 0 && ((invoice as any).paidAmount || 0) < invoice.amount && (
                        <div className="text-xs text-amber-600 font-medium">
                          Paid: ₹{((invoice as any).paidAmount || 0).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </div>
                      {invoice.status === 'pending' && invoice.dueDate && new Date(invoice.dueDate) < new Date() && (
                        <div className="text-xs text-red-600 font-medium">
                          Overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(invoice.status,invoice.paymentMethod)}`}>
                        {getStatusLabel(invoice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setSelectedInvoiceForGST(invoice)}
                          className="text-purple-600 hover:text-purple-800" 
                          title="View GST Bill"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedInvoiceForGST(invoice)}
                          className="text-blue-600 hover:text-blue-800" 
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedInvoiceForGST(invoice)}
                          className="text-blue-600 hover:text-blue-800" 
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-800" title="Email">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800" 
                          title="Edit"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <div key={invoice._id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">Invoice #</p>
                    <p className="text-sm font-medium text-blue-600">INV-{invoice._id}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(invoice.status,invoice.paymentMethod)}`}>
                    {getStatusLabel(invoice)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.customer?.name ||
                       (invoice.customerId && typeof invoice.customerId === 'object' && (invoice.customerId as any)?.name ? (invoice.customerId as any).name : null) ||
                       invoice.customerName ||
                       'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {invoice.customer?.phone ||
                       (invoice.customerId && typeof invoice.customerId === 'object' && (invoice.customerId as any)?.phone ? (invoice.customerId as any).phone : null) ||
                       ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-bold text-gray-900">₹{invoice.amount.toFixed(2)}</p>
                    {((invoice as any).paidAmount || 0) > 0 && ((invoice as any).paidAmount || 0) < invoice.amount && (
                      <p className="text-xs text-amber-600 font-medium">
                        Paid: ₹{((invoice as any).paidAmount || 0).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <p className="font-medium text-gray-900">{new Date(invoice.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="font-medium text-gray-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                    {invoice.status === 'pending' && invoice.dueDate && new Date(invoice.dueDate) < new Date() && (
                      <p className="text-xs text-red-600 font-medium">Overdue</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button 
                    onClick={() => setSelectedInvoiceForGST(invoice)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-600 hover:text-purple-800 py-1 hover:bg-purple-50 rounded"
                    title="View GST Bill"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                  <button 
                    onClick={() => setSelectedInvoiceForGST(invoice)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1 hover:bg-blue-50 rounded"
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                  <button 
                    onClick={() => setSelectedInvoiceForGST(invoice)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1 hover:bg-blue-50 rounded"
                    title="Print"
                  >
                    <Printer className="h-3 w-3" />
                    Print
                  </button>
                  <button 
                    onClick={() => {
                      setEditingInvoice(invoice);
                      setShowForm(true);
                    }}
                    className="flex-1 flex items-center justify-center text-xs text-blue-600 hover:text-blue-800 py-1 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No invoices found</p>
          </div>
        )}
      </div>

      {selectedInvoiceForGST && (
        <GSTBillModal
          invoice={selectedInvoiceForGST}
          onClose={() => setSelectedInvoiceForGST(null)}
          allCustomers={customers}
        />
      )}
    </div>
  );
};

export default Invoices;

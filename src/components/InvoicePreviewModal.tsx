import React, { useState, useMemo, useEffect } from 'react';
import { X, Edit2, Save } from 'lucide-react';
import { apiService } from '../services/api';
import type { Transaction, Customer, InvoiceItem } from '../types';

interface InvoicePreviewModalProps {
  invoice: Transaction;
  selectedCustomer?: Partial<Customer> | null;
  onClose: () => void;
  onSave: (updatedInvoice: Transaction) => Promise<void>;
  loading?: boolean;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  selectedCustomer,
  onClose,
  onSave,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Transaction>(invoice);
  const [saving, setSaving] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>({
    name: 'Maa Ambey Tiles Inventory',
    address: 'Address here',
    gst: 'GSTIN here',
    phone: 'Phone here',
    email: 'Email here',
    logo: '',
    stamp: '',
  });

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const response = await apiService.companyProfile.getProfile();
        const profile = response?.data || response;
        if (profile) {
          setCompanyProfile({
            name: profile.companyName || 'Maa Ambey Tiles Inventory',
            address: profile.address || 'Address here',
            gst: profile.gst || 'GSTIN here',
            phone: profile.contact || 'Phone here',
            email: profile.email || 'Email here',
            logo: profile.logo || '',
            stamp: profile.stamp || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch company profile:', error);
      }
    };
    fetchCompanyProfile();
  }, []);

  const getCustomerName = (): string => {
    if (selectedCustomer?.name) return selectedCustomer.name;
    if (invoice.customer?.name) return invoice.customer.name;
    if (typeof invoice.customerId === 'object' && invoice.customerId?.name) {
      return invoice.customerId.name;
    }
    return invoice.customerName || 'N/A';
  };

  const getCustomerAddress = (): string => {
    return invoice.address || selectedCustomer?.address || '';
  };

  const calculateTotals = (inv: Transaction) => {
    const subtotal = inv.items?.reduce((sum, item) => sum + item.total, 0) || inv.amount || 0;
    let cgst = inv.cgst || 0;
    let sgst = inv.sgst || 0;
    let igst = inv.igst || 0;

    const totalTax = cgst + sgst + igst;
    const total = subtotal + totalTax;

    return { subtotal, cgst, sgst, igst, totalTax, total };
  };

  const { subtotal, cgst, sgst, igst, totalTax, total } = useMemo(
    () => calculateTotals(editedInvoice),
    [editedInvoice]
  );

  const handleTaxChange = (field: 'cgst' | 'sgst' | 'igst', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedInvoice({
      ...editedInvoice,
      [field]: numValue,
    });
  };

  const handleInvoiceNumberChange = (value: string) => {
    setEditedInvoice({
      ...editedInvoice,
      _id: value,
    });
  };

  const handleDateChange = (value: string) => {
    setEditedInvoice({
      ...editedInvoice,
      date: new Date(value).toISOString(),
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { logoUrl, stampUrl, ...invoiceData } = editedInvoice;
      await onSave({
        ...invoiceData,
        amount: total,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Edit Invoice & Add Tax' : 'Invoice Preview'}
          </h2>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit & Add Tax
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
            {/* Header with Logo */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
              <div>
                <h1 className="text-3xl font-bold text-purple-800 mb-2">{companyProfile.name}</h1>
                <p className="text-gray-600 text-sm mb-1">{companyProfile.address}</p>
                <p className="text-gray-600 text-sm">GSTIN: {companyProfile.gst}</p>
                <p className="text-gray-600 text-sm">Phone: {companyProfile.phone}</p>
                <p className="text-gray-600 text-sm">Email: {companyProfile.email}</p>
              </div>
              <div className="text-right">
                {companyProfile.logo ? (
                  <img
                    src={companyProfile.logo}
                    alt="Company Logo"
                    className="h-20 w-auto mb-2"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2">
                    No Logo
                  </div>
                )}
                <h2 className="text-2xl font-bold text-purple-800">TAX INVOICE</h2>
                <div className="text-gray-600 text-sm">
                  {isEditing ? (
                    <div className="flex items-center gap-2 justify-end mb-2">
                      <label className="font-medium">Invoice #:</label>
                      <input
                        type="text"
                        value={editedInvoice._id || ''}
                        onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <p>Invoice #: {editedInvoice._id}</p>
                  )}
                </div>
                <div className="text-gray-600 text-sm">
                  {isEditing ? (
                    <div className="flex items-center gap-2 justify-end">
                      <label className="font-medium">Date:</label>
                      <input
                        type="date"
                        value={editedInvoice.date ? new Date(editedInvoice.date).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <p>Date: {new Date(editedInvoice.date).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-8">
                {/* Bill To */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Bill To:</h3>
                  <p className="font-medium text-gray-900">{getCustomerName()}</p>
                  {getCustomerAddress() && (
                    <p className="text-gray-600 text-sm">{getCustomerAddress()}</p>
                  )}
                  {editedInvoice.customerGST && (
                    <p className="text-gray-600 text-sm">GSTIN: {editedInvoice.customerGST}</p>
                  )}
                  {editedInvoice.customerState && (
                    <p className="text-gray-600 text-sm">State: {editedInvoice.customerState}</p>
                  )}
                  {selectedCustomer?.phone && (
                    <p className="text-gray-600 text-sm">Phone: {selectedCustomer.phone}</p>
                  )}
                  {selectedCustomer?.email && (
                    <p className="text-gray-600 text-sm">Email: {selectedCustomer.email}</p>
                  )}
                </div>

                {/* Ship From / Business Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Details:</h3>
                  <p className="font-medium text-gray-900">{companyProfile.name}</p>
                  {companyProfile.address && (
                    <p className="text-gray-600 text-sm">{companyProfile.address}</p>
                  )}
                  {companyProfile.gst && (
                    <p className="text-gray-600 text-sm">GSTIN: {companyProfile.gst}</p>
                  )}
                  {companyProfile.phone && (
                    <p className="text-gray-600 text-sm">Phone: {companyProfile.phone}</p>
                  )}
                  {companyProfile.email && (
                    <p className="text-gray-600 text-sm">Email: {companyProfile.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold text-gray-700">
                      #
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700">
                      Rate (₹)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {editedInvoice.items && editedInvoice.items.length > 0 ? (
                    editedInvoice.items.map((item: InvoiceItem, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                          {item.product?.name || (typeof item.productId === 'object' ? item.productId.name : 'Product')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-right text-gray-700">
                          {item.quantity} {item.product?.unit || (typeof item.productId === 'object' ? (item.productId as any).unit : '') || 'pcs'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-right text-gray-700">
                          ₹{item.pricePerUnit.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-right text-gray-700">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tax Editing Section & Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Tax Editor */}
              {isEditing && (
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Tax Configuration</h4>
                  <div className="space-y-4">
                    {igst > 0 && cgst === 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IGST (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={igst}
                          onChange={(e) => handleTaxChange('igst', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{((igst / subtotal) * 100).toFixed(2)}% of subtotal</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CGST (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cgst}
                            onChange={(e) => handleTaxChange('cgst', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">{((cgst / subtotal) * 100).toFixed(2)}% of subtotal</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SGST (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={sgst}
                            onChange={(e) => handleTaxChange('sgst', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">{((sgst / subtotal) * 100).toFixed(2)}% of subtotal</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="flex flex-col justify-end">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700 pb-2 border-b border-gray-300">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {(cgst > 0 || isEditing) && (
                    <div className="flex justify-between text-gray-700">
                      <span>CGST:</span>
                      <span className="font-medium">₹{cgst.toFixed(2)}</span>
                    </div>
                  )}
                  {(sgst > 0 || isEditing) && (
                    <div className="flex justify-between text-gray-700">
                      <span>SGST:</span>
                      <span className="font-medium">₹{sgst.toFixed(2)}</span>
                    </div>
                  )}
                  {(igst > 0 || isEditing) && (
                    <div className="flex justify-between text-gray-700">
                      <span>IGST:</span>
                      <span className="font-medium">₹{igst.toFixed(2)}</span>
                    </div>
                  )}
                  {totalTax > 0 && (
                    <div className="flex justify-between text-gray-700 pb-2 border-b border-gray-300">
                      <span>Total Tax:</span>
                      <span className="font-medium">₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 bg-gray-100 p-3 rounded-lg">
                    <span>Total:</span>
                    <span className="text-purple-800">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp Section */}
            {companyProfile.stamp && (
              <div className="mb-6 pb-6 border-t border-gray-200 pt-6">
                <div className="flex justify-end">
                  <div className="text-center">
                    <img
                      src={companyProfile.stamp}
                      alt="Authorized Stamp"
                      className="h-24 w-auto mx-auto"
                    />
                    <div className="text-xs text-gray-500 mt-2">Authorized Stamp</div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-sm text-gray-600">
              <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>Payment due within 15 days of invoice date.</li>
                <li>Please make payment via bank transfer or cheque.</li>
                <li>Goods once sold cannot be returned.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search, Calendar, CreditCard, Bell, FileText, CheckCircle2 } from 'lucide-react';
import { useTransactions } from '../hooks/useElectron';
import { apiService } from '../services/api';
import type { Transaction, Customer, Product, InvoiceItem } from '../types';
import CustomerSelector from './CustomerSelector';
import ProductSelector from './ProductSelector';
import { ProductForm } from './ProductForm';
import { BundleForm } from './BundleForm';
import { CustomerForm } from './CustomerForm';
import AdvancePaymentModal from './AdvancePaymentModal';

interface CompanyProfile {
  name: string;
  address: string;
  gst: string;
  phone: string;
  email: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  iban?: string;
  swiftBic?: string;
}

interface InvoiceFormTemplateProps {
  invoice?: Transaction;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
}

export const InvoiceFormTemplate: React.FC<InvoiceFormTemplateProps> = ({ 
  invoice, 
  onClose, 
  onSave 
}) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyProfile>({
    name: '',
    address: '',
    gst: '',
    phone: '',
    email: ''
  });
  
  // Form state
  const [customerId, setCustomerId] = useState<string>(
    typeof invoice?.customerId === 'string' ? invoice.customerId : 
    invoice?.customerId?._id || ''
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(
    invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : 
    (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })()
  );
  
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>(
    invoice?.items || []
  );
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(invoice?.paymentMethod || 'Bank Transfer (ACH)');
  const [status, setStatus] = useState<string>(invoice?.status || 'pending');
  const [notes, setNotes] = useState<string>(invoice?.description || '');
  const [shipping, setShipping] = useState<number>(0);
  const [currency, setCurrency] = useState('USD - US Dollar ($)');
  
  // Advance Payment State
  const [useAdvance, setUseAdvance] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [isAddingAdvance, setIsAddingAdvance] = useState(true);
  

  
  // Media state
  const [logoUrl, setLogoUrl] = useState<string>(invoice?.logoUrl || '');
  const [address, setAddress] = useState<string>(invoice?.address || '');
  const [customerGST, setCustomerGST] = useState<string>(invoice?.customerGST || '');

  useEffect(() => {
    fetchCompanyProfile();
    if (customerId) {
      fetchCustomerDetails(customerId);
    }
  }, []);

  const fetchCustomerDetails = async (id: string) => {
    try {
      const response = await apiService.customers.getById(id);
      const customer = response?.data || response;
      if (customer) {
        setSelectedCustomer(customer);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await apiService.companyProfile.getProfile();
      const profile = response?.data || response;
      if (profile) {
        setCompanyDetails({
          name: profile.companyName || '',
          address: profile.address || '',
          gst: profile.gst || '',
          phone: profile.contact || '',
          email: profile.email || '',
          bankName: profile.bankName || '',
          accountNumber: profile.accountNumber || '',
          ifscCode: profile.ifscCode || '',
          iban: profile.iban || '',
          swiftBic: profile.swiftBic || ''
        });
        
        if (profile.logo && !invoice?.logoUrl) {
          setLogoUrl(profile.logo);
        }
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const handleCustomerChange = (cId: string, customerData?: Partial<Customer>) => {
    setCustomerId(cId);
    setSelectedCustomer(customerData || null);
    setUseAdvance(false);
  };

  const handleProductSelect = (products: Product[]) => {
    const newItems = products.map(product => ({
      productId: product.id || product._id || '',
      product,
      quantity: 1,
      pricePerUnit: product.price,
      total: product.price,
    }));
    setSelectedItems([...selectedItems, ...newItems]);
    setShowProductSelector(false);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    const item = newItems[index];
    const currentProduct = item.product || (typeof item.productId === 'object' ? item.productId : { name: '', price: 0, inStock: true });
    
    if (field === 'name' || field === 'description' || field === 'layout') {
      newItems[index] = {
        ...item,
        product: {
          ...currentProduct,
          [field]: value
        } as Product
      };
    }
    
    setSelectedItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...selectedItems];
    newItems[index] = {
      ...newItems[index],
      quantity,
      total: (quantity || 0) * newItems[index].pricePerUnit,
    };
    setSelectedItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...selectedItems];
    newItems[index] = {
      ...newItems[index],
      pricePerUnit: price,
      total: price * newItems[index].quantity,
    };
    setSelectedItems(newItems);
  };

  const calculateTotals = React.useCallback(() => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + shipping;
    return { subtotal, total };
  }, [selectedItems, shipping]);

  const { subtotal, total } = useMemo(() => calculateTotals(), [calculateTotals]);

  const handleSubmit = async () => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Handle New Products
      const allExistingProductsResponse = await apiService.products.getAll();
      const allExistingProducts: Product[] = allExistingProductsResponse.success ? allExistingProductsResponse.data : [];
      
      // Keep track of newly created products within this session to avoid duplicates
      const newlyCreatedProducts: Record<string, string> = {};

      const processedItems: InvoiceItem[] = [];
      for (const item of selectedItems) {
        // If it's a new product (no productId)
        if (!item.productId) {
          const itemName = item.product?.name || '';
          if (!itemName.trim()) {
            processedItems.push(item);
            continue;
          }
          const normalizedName = itemName.toLowerCase();
          
          // 1. Check if already created in this session
          if (newlyCreatedProducts[normalizedName]) {
            processedItems.push({
              ...item,
              productId: newlyCreatedProducts[normalizedName]
            });
            continue;
          }

          // 2. Case-insensitive check for existing product in DB
          const existingProduct = allExistingProducts.find(
            p => p.name.toLowerCase() === normalizedName
          );
          
          if (existingProduct) {
            const pid = existingProduct.id || existingProduct._id || '';
            newlyCreatedProducts[normalizedName] = pid;
            processedItems.push({
              ...item,
              productId: pid
            });
          } else {
            // 3. Create new product
            try {
              // Calculate total quantity for this product in the entire invoice
              const totalQtyForThisProduct = selectedItems
                .filter(i => !i.productId && i.product?.name.toLowerCase() === normalizedName)
                .reduce((sum, i) => sum + i.quantity, 0);

              const createResponse = await apiService.products.create({
                name: itemName,
                price: item.pricePerUnit,
                description: item.product?.description || '',
                layout: item.product?.layout || '',
                unit: item.product?.unit || 'pcs',
                inStock: true,
                quantity: totalQtyForThisProduct
              });
              
              if (createResponse.success && createResponse.data) {
                const newId = createResponse.data.id || createResponse.data._id || '';
                newlyCreatedProducts[normalizedName] = newId;
                processedItems.push({
                  ...item,
                  productId: newId
                });
              } else {
                processedItems.push(item);
              }
            } catch (err: any) {
              console.error(`Failed to create product ${itemName}:`, err);
              setLoading(false);
              alert(`Error creating product "${itemName}": ${err.message || 'Unknown error'}.`);
              return;
            }
          }
        } else {
          processedItems.push(item);
        }
      }

      const invoiceData = {
        customerId,
        customerName: selectedCustomer?.name || '',
        type: 'invoice' as const,
        amount: total,
        items: processedItems.map(item => ({
          productId: typeof item.productId === 'object' ? (item.productId._id || item.productId.id) : item.productId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          total: item.total,
        })),
        date: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        status: useAdvance ? 'completed' : status as any,
        paymentMethod: useAdvance ? 'advance' : paymentMethod,
        description: useAdvance 
          ? `${notes ? notes + '\n\n' : ''}Auto-paid from exact advance amount which was user had: ₹${selectedCustomer?.advancePayment?.toFixed(2)}` 
          : notes,
        cgst: 0,
        sgst: 0,
        igst: 0,
        logoUrl: logoUrl || undefined,
        address: address || undefined,
        customerGST: customerGST || undefined,
        companyName: companyDetails.name,
        companyAddress: companyDetails.address,
        companyGST: companyDetails.gst,
        companyPhone: companyDetails.phone,
        companyEmail: companyDetails.email,
        shipping: shipping
      };

      if (invoice?._id) {
        await updateTransaction(invoice._id, invoiceData);
        if (useAdvance) {
          try {
            await apiService.transactions.applyAdvanceDeduction(invoice._id, total);
          } catch (err) {
            console.error('Failed to deduct advance during update:', err);
          }
        }
      } else {
        await createTransaction({ ...invoiceData, useAdvance: true } as any);
      }

      if (onSave) await onSave();

      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          message: invoice ? 'Invoice updated successfully.' : 'Invoice created successfully.',
          type: 'success',
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      
      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          message: error.message || 'Error saving invoice',
          type: 'error',
        });
      } else {
        alert(error.message || 'Error saving invoice');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100 font-sans">
      <div className="min-h-screen pb-12">
        {/* Navigation / Header */}
        {/* <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-gray-900">InvoicePro</span>
              </div>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
                <a href="#" className="hover:text-gray-900">Dashboard</a>
                <a href="#" className="text-blue-600">Invoices</a>
                <a href="#" className="hover:text-gray-900">Customers</a>
                <a href="#" className="hover:text-gray-900">Inventory</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">Alex Rivera</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  AR
                </div>
              </div>
            </div>
          </div>
        </header> */}

        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
              </button>
              <h1 className="text-sm md:text-xl font-bold text-gray-900 truncate max-w-[150px] md:max-w-none">
                {invoice ? 'Edit Invoice' : 'New Invoice'} #INV-{invoice?._id?.substring(0, 8) || 'Draft'}
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 md:px-6 py-1.5 md:py-2 rounded-xl bg-blue-600 text-white text-xs md:text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-8">
          {/* Breadcrumbs & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 md:mb-2">
                <span>Invoices</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900">Create New</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Invoice #INV-{invoice?._id?.substring(0, 8) || '2024-082'}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-bold uppercase">
                  {status}
                </span>
                <span className="text-xs text-gray-400">Last saved 3 mins ago</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={onClose}
                className="whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-xl border border-gray-200 bg-white text-xs md:text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Preview PDF
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-blue-600 text-white text-xs md:text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {loading ? 'Saving...' : (invoice ? 'Update' : 'Save')}
              </button>
              <button 
                onClick={onClose}
                className="p-2 md:p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-8">
            {/* Left Column - Main Form */}
            <div className="col-span-12 lg:col-span-8 space-y-4 md:space-y-8">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 p-4 md:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-6">
                  <div className="space-y-4 w-full md:w-auto">
                    <div className="h-12 w-12 md:h-16 md:w-16 bg-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain brightness-0 invert" />
                      ) : (
                        <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">{companyDetails.name || 'Skyline Digital Agency'}</h2>
                      <p className="text-xs md:text-sm text-gray-500 max-w-xs">{companyDetails.address || '123 Tech Plaza, Silicon Valley, CA'}</p>
                      <p className="text-xs md:text-sm text-gray-500">{companyDetails.email || 'billing@skylinedigital.com'}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-100 uppercase tracking-tighter">Invoice</h2>
                    <div className="mt-4 md:mt-6">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
                      <div className="relative">
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className="text-left md:text-right font-bold text-gray-900 focus:outline-none appearance-none bg-transparent w-full md:w-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill To Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bill To</h3>
                      <button 
                        type="button"
                        onClick={() => setShowCustomerForm(true)}
                        className="text-blue-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add New
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <CustomerSelector
                          value={customerId}
                          onChange={handleCustomerChange}
                          placeholder="Select existing customer"
                        />
                      </div>
                      
                      <div className="bg-blue-50 bg-opacity-30 rounded-2xl p-4 md:p-6 border border-blue-100 border-dashed">
                        {selectedCustomer ? (
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-gray-900">{selectedCustomer.name}</p>
                            <p className="text-xs text-gray-500">{selectedCustomer.address}</p>
                            <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
                            
                            {selectedCustomer.advancePayment && selectedCustomer.advancePayment > 0 ? (
                              <div className="mt-4 p-3 md:p-4 bg-green-50 rounded-2xl border border-green-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                      <CreditCard className="h-3.5 w-3.5 text-green-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Advance Credit</span>
                                  </div>
                                  <span className="text-sm font-black text-green-700">₹{selectedCustomer.advancePayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setUseAdvance(!useAdvance)}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                      useAdvance 
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                                        : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
                                    }`}
                                  >
                                    {useAdvance ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Using Advance
                                      </span>
                                    ) : 'Use Advance Credit'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingAdvance(true);
                                      setShowAdvanceModal(true);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-white text-blue-600 border border-blue-200 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-all"
                                  >
                                    Add More
                                  </button>
                                </div>
                                {useAdvance && (
                                  <div className="mt-2 flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-green-400 animate-pulse"></div>
                                    <p className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">
                                      Auto-paid on save
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingAdvance(true);
                                    setShowAdvanceModal(true);
                                  }}
                                  className="w-full py-3 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all flex items-center justify-center gap-2 border-dashed"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Add Advance Payment
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-300">
                              <Search className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500">Customer details</p>
                              <p className="text-[10px] text-gray-400">Select a client from the dropdown</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hidden md:block pt-6"></div> {/* Spacer */}
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Billing Address (Optional)"
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all min-h-[80px] md:min-h-[60px]"
                    />
                    <input
                      type="text"
                      value={customerGST}
                      onChange={(e) => setCustomerGST(e.target.value)}
                      placeholder="Tax ID / VAT Number"
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                {/* Product/Service Table */}
                <div className="mb-10 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="text-left pb-4">Product / Service</th>
                        <th className="text-center pb-4 w-24">Qty</th>
                        <th className="text-right pb-4 w-32">Price</th>
                        <th className="text-right pb-4 w-32">Amount</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="group">
                          <td className="py-6">
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={item.product?.name || (typeof item.productId === 'object' ? item.productId.name : '')}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                placeholder="Product Name"
                                className="text-sm font-bold text-gray-900 bg-transparent focus:outline-none border-b border-transparent focus:border-blue-200 w-full"
                              />
                              <input
                                type="text"
                                value={item.product?.description || (typeof item.productId === 'object' ? item.productId.description : '')}
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                placeholder="Description (optional)"
                                className="text-xs text-gray-400 bg-transparent focus:outline-none border-b border-transparent focus:border-blue-100 w-full"
                              />
                              <input
                                type="text"
                                value={item.product?.layout || (typeof item.productId === 'object' ? item.productId.layout : '')}
                                onChange={(e) => handleItemChange(idx, 'layout', e.target.value)}
                                placeholder="Layout (optional)"
                                className="text-[10px] text-blue-500 bg-transparent focus:outline-none border-b border-transparent focus:border-blue-100 w-full"
                              />
                              {!item.productId && (
                                <span className="text-[9px] text-blue-600 font-medium italic">New product will be saved</span>
                              )}
                            </div>
                          </td>
                          <td className="py-6">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                className="w-full text-center text-sm font-bold text-gray-900 bg-gray-50 rounded-xl py-2 focus:outline-none"
                              />
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {item.product?.unit || (typeof item.productId === 'object' ? (item.productId as any).unit : '') || 'pcs'}
                              </span>
                            </div>
                          </td>
                          <td className="py-6">
                            <div className="flex items-center justify-end gap-1 text-sm font-bold text-black">
                              <span className="text-gray-300">₹</span>
                              <input
                                type="number"
                                value={item.pricePerUnit}
                                onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-20 text-right bg-transparent focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-6 text-right">
                            <span className="text-sm font-bold text-gray-900">₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="py-6 text-right">
                            <button 
                              onClick={() => handleRemoveItem(idx)}
                              className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Catalog Selector Button */}
                      <tr>
                        <td colSpan={5} className="py-4">
                          <button 
                            onClick={() => setShowProductSelector(true)}
                            className="w-full py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                          >
                            Add Product from Catalog...
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-8 md:mb-12">
                  <button 
                    onClick={() => setShowProductSelector(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-3 w-3" /> Catalog
                  </button>
                  <button 
                    onClick={() => setShowProductForm(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-3 w-3" /> Product
                  </button>
                  <button 
                    onClick={() => setShowBundleForm(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-3 w-3" /> Bundle
                  </button>
                </div>

                {/* Bottom Summary */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 pt-8 md:pt-10 border-t border-gray-50">
                  <div className="w-full md:w-7/12">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Notes</h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add instructions or terms here..."
                      className="w-full h-32 rounded-2xl md:rounded-3xl border border-gray-100 bg-gray-50 p-4 md:p-6 text-sm placeholder:text-gray-300 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="w-full md:w-5/12">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-400">Subtotal</span>
                        <span className="text-sm font-bold text-gray-900">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-center text-blue-600">
                        <span className="text-sm font-medium">Discount</span>
                        <span className="text-sm font-bold">-₹0.00</span>
                      </div>
                      <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                        <span className="text-2xl md:text-3xl font-black text-blue-600">
                        ₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-8">
              {/* Invoice Settings */}
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-blue-600 px-6 py-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white">Invoice Settings</h3>
                </div>
               
              <div className="p-6 md:p-8 space-y-6 md:space-y-8">

                   {/*
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Payment Method</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <select 
                     value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:outline-none appearance-none"
                      >
                        <option>Bank Transfer (ACH)</option> 
                        <option>Credit Card</option>
                        <option>PayPal</option>
                        <option>Cash</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>    
                  */}

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Due Date</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Currency</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:outline-none appearance-none"
                      >
                     
                        <option>INR - Indian Rupee (₹)</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div> */}

                </div>
              </div>

              {/* Internal Notes */}
              <div className="bg-blue-50 bg-opacity-30 rounded-2xl md:rounded-3xl shadow-sm border border-blue-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Internal Notes</h3>
                </div>
                <p className="text-xs text-blue-400 leading-relaxed mb-6">These notes are for your team only and will not appear on the client's PDF invoice.</p>
                <textarea
                  placeholder="Reminder: Follow up on Tuesday if not paid..."
                  className="w-full h-32 rounded-2xl border border-blue-100 bg-white p-4 md:p-6 text-sm placeholder:text-gray-300 focus:outline-none"
                />
              </div>


              {/* Bottom Save Action */}
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl bg-blue-600 text-white text-base md:text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                  {loading ? 'Saving...' : (invoice ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest gap-4 md:gap-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-300" />
            <span>Secure Billing Protocol v2.4</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-gray-500">
            <a href="#" className="hover:text-gray-900">Docs</a>
            <a href="#" className="hover:text-gray-900">Shortcuts</a>
            <a href="#" className="hover:text-gray-900">API</a>
          </div>
          <div className="text-center md:text-right">
            © 2024 Skyline Digital. All rights reserved.
          </div>
        </footer>
      </div>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Browse Catalog</h3>
                <p className="text-xs text-gray-500 mt-1">Select products to add to your invoice</p>
              </div>
              <button onClick={() => setShowProductSelector(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col min-h-0 bg-gray-50/30 overflow-y-auto">
              <ProductSelector onProductSelect={handleProductSelect} inline />
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm 
          onClose={() => setShowCustomerForm(false)}
          onSuccess={(customer) => {
            handleCustomerChange(customer.id, customer);
            setShowCustomerForm(false);
          }}
        />
      )}

      {showProductForm && (
        <ProductForm 
          onClose={() => setShowProductForm(false)}
          onSave={(product) => {
            handleProductSelect([product]);
            setShowProductForm(false);
          }}
        />
      )}

      {showBundleForm && (
        <BundleForm 
          onClose={() => setShowBundleForm(false)}
          onSave={(bundle) => {
            handleProductSelect([bundle]);
            setShowBundleForm(false);
          }}
        />
      )}

      {showAdvanceModal && selectedCustomer && (
        <AdvancePaymentModal
          customer={selectedCustomer as Customer}
          isAddingAdvance={isAddingAdvance}
          onClose={() => setShowAdvanceModal(false)}
          onSuccess={() => {
            if (customerId) fetchCustomerDetails(customerId);
            setShowAdvanceModal(false);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceFormTemplate;

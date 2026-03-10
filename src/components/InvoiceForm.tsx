import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Edit2, IndianRupee, Upload, Plus } from 'lucide-react';
import { useTransactions } from '../hooks/useElectron';
import { apiService } from '../services/api';
import type { Transaction, Customer, Product, InvoiceItem } from '../types';
import CustomerSelector from './CustomerSelector';
import ProductSelector from './ProductSelector';
import { ProductForm } from './ProductForm';
import { BundleForm } from './BundleForm';

interface InvoiceFormProps {
  invoice?: Transaction;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose, onSave }) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  
  // Set default due date to 7 days from now
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const buildFormState = (currentInvoice?: Transaction) => ({
    customerId: typeof currentInvoice?.customerId === 'string'
      ? currentInvoice.customerId
      : currentInvoice?.customerId?._id || '',
    description: currentInvoice?.description || '',
    paymentMethod: currentInvoice?.paymentMethod || 'credit',
    dueDate: currentInvoice?.dueDate
      ? new Date(currentInvoice.dueDate).toISOString().split('T')[0]
      : getDefaultDueDate(),
    status: currentInvoice?.status || 'pending',
    amount: currentInvoice?.amount?.toString() || '0',
  });

  const [formData, setFormData] = useState(buildFormState(invoice));
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [useAdvance, setUseAdvance] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(invoice?.logoUrl || '');
  const [stampUrl, setStampUrl] = useState<string>(invoice?.stampUrl || '');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBundleForm, setShowBundleForm] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStampUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const newState = buildFormState(invoice);
    setFormData(newState);
    
    // Initialize selected items from invoice if available
    if (invoice?.items && Array.isArray(invoice.items)) {
      setSelectedItems(invoice.items.map(item => ({
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        total: item.pricePerUnit * item.quantity,
      })));
    }
  }, [invoice]);

  const computeTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    // Placeholder for tax/shipping etc. if needed later
    const total = subtotal;
    return { subtotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer before saving the invoice.');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please add at least one product to the invoice.');
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
                quantity: totalQtyForThisProduct // Set initial quantity to match total invoice quantity
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
              alert(`Error creating product "${itemName}": ${err.message || 'Unknown error'}. Please check if it already exists.`);
              return; // Stop the entire save process if a product fails to create
            }
          }
        } else {
          processedItems.push(item);
        }
      }

      const { total } = computeTotals(processedItems);
      const sanitizedItems = processedItems.map((item) => ({
        productId: typeof item.productId === 'object' ? (item.productId._id || item.productId.id) : item.productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        total: item.total,
      }));

      const invoiceData: Transaction = {
        ...formData,
        customerName: selectedCustomer?.name || '',
        _id: invoice?._id || '',
        type: 'invoice' as const,
        amount: total,
        items: sanitizedItems,
        useAdvance: useAdvance,
        paymentMethod: useAdvance ? 'advance' : formData.paymentMethod,
        logoUrl: logoUrl || undefined,
        stampUrl: stampUrl || undefined,
        date: new Date().toISOString(),
        createdAt: invoice?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Transaction;

      // If adding advance payment
      if (showAdvanceForm && advanceAmount && parseFloat(advanceAmount) > 0) {
        await apiService.customers.addAdvancePayment(formData.customerId, {
          amount: parseFloat(advanceAmount),
          description: 'Advance payment added during invoice creation'
        });
      }

      if (invoice?.id || invoice?._id) {
        const targetId = invoice.id || invoice._id;
        if (targetId) {
          await updateTransaction(targetId, invoiceData);
        }
      } else {
        await createTransaction(invoiceData);
      }

      if (onSave) {
        await onSave();
      }

      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          message: invoice ? 'Invoice updated successfully.' : 'Invoice created successfully.',
          type: 'success',
        });

        if (showAdvanceForm && advanceAmount && parseFloat(advanceAmount) > 0) {
          (window as any).addNotification({
            message: `Advance payment of ₹${parseFloat(advanceAmount).toFixed(2)} recorded.`,
            type: 'success',
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
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

  const handleProductSelect = (products: Product[]) => {
    // Create new items for each selected product
    const newItems = products.map(product => ({
      productId: product.id || product._id || '',
      product,
      quantity: 1,
      pricePerUnit: product.price,
      total: product.price,
    }));
    
    // Add all new items to the selected items
    const updatedItems = [...selectedItems, ...newItems];
    setSelectedItems(updatedItems);
    updateInvoiceAmount(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
    updateInvoiceAmount(newItems);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setEditingItem({ ...selectedItems[index] });
  };

  const handleSaveItemEdit = () => {
    if (editingItemIndex !== null && editingItem) {
      const newItems = [...selectedItems];
      // Calculate the total based on quantity and price
      const total = editingItem.quantity * editingItem.pricePerUnit;
      newItems[editingItemIndex] = {
        ...editingItem,
        total: total
      };
      setSelectedItems(newItems);
      updateInvoiceAmount(newItems);
      setEditingItemIndex(null);
      setEditingItem(null);
    }
  };

  const handleCancelItemEdit = () => {
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  // New function to handle quantity changes directly in the table
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return; // Prevent negative or zero quantities
    
    const newItems = [...selectedItems];
    const item = newItems[index];
    const total = newQuantity * item.pricePerUnit;
    
    newItems[index] = {
      ...item,
      quantity: newQuantity,
      total: total
    };
    
    setSelectedItems(newItems);
    updateInvoiceAmount(newItems);
  };

  const updateInvoiceAmount = (items: InvoiceItem[]) => {
    const { total } = computeTotals(items);
    setFormData({
      ...formData,
      amount: total.toString(),
    });
  };

  const { subtotal, total } = useMemo(() => computeTotals(selectedItems), [selectedItems]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
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
              value={formData.customerId}
              onChange={handleCustomerChange}
              required
              placeholder="Search or create customer"
            />
            
            {selectedCustomer && (
              <div className="mt-2 flex flex-col space-y-2">
                {selectedCustomer.advancePayment && selectedCustomer.advancePayment > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <div className="text-sm">
                      <span className="font-medium">Available Advance:</span> ₹{selectedCustomer.advancePayment.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseAdvance(!useAdvance)}
                      className={`px-3 py-1 text-xs rounded ${
                        useAdvance ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {useAdvance ? 'Using Advance' : 'Use Advance'}
                    </button>
                  </div>
                )}
                
                {!showAdvanceForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAdvanceForm(true)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <IndianRupee size={16} className="mr-1" />
                    Add Advance Payment
                  </button>
                ) : (
                  <div className="flex flex-col space-y-2 p-2 border border-blue-200 rounded bg-blue-50">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Advance Amount (₹)</label>
                      <button 
                        type="button" 
                        onClick={() => setShowAdvanceForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 p-2 border rounded text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Selection Section */}
          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Products *
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <ProductSelector 
                  onProductSelect={handleProductSelect}
                  placeholder="Search for products to add"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowProductForm(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center whitespace-nowrap"
              >
                <Plus size={18} className="mr-1" />
                Add Product
              </button>
              <button
                type="button"
                onClick={() => setShowBundleForm(true)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center whitespace-nowrap"
              >
                <Plus size={18} className="mr-1" />
                Add Bundle
              </button>
            </div>
            
            {/* Selected Products List */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Products</h4>
              
              {selectedItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  No products added yet
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedItems.map((item, index) => (
                        <tr key={`${item.productId}-${index}`}>
                          {editingItemIndex === index ? (
                            // Editing mode
                            <>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={editingItem?.product?.name || (typeof editingItem?.productId === 'object' ? (editingItem.productId as any).name : '')}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem!,
                                      product: {
                                        ...(editingItem!.product || (typeof editingItem?.productId === 'object' ? (editingItem!.productId as any) : { name: '', price: 0, inStock: true })),
                                        name: e.target.value
                                      }
                                    })}
                                    placeholder="Product Name"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  />
                                  <textarea
                                    value={editingItem?.product?.description || (typeof editingItem?.productId === 'object' ? (editingItem.productId as any).description : '')}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem!,
                                      product: {
                                        ...(editingItem!.product || (typeof editingItem?.productId === 'object' ? (editingItem!.productId as any) : { name: '', price: 0, inStock: true })),
                                        description: e.target.value
                                      }
                                    })}
                                    placeholder="Description (optional)"
                                    rows={1}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={editingItem?.product?.layout || (typeof editingItem?.productId === 'object' ? (editingItem.productId as any).layout : '')}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem!,
                                      product: {
                                        ...(editingItem!.product || (typeof editingItem?.productId === 'object' ? (editingItem!.productId as any) : { name: '', price: 0, inStock: true })),
                                        layout: e.target.value
                                      }
                                    })}
                                    placeholder="Layout (optional)"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                                  />
                                  {!editingItem?.productId && (
                                    <span className="text-[10px] text-blue-600 font-medium italic">
                                      New product will be saved to list
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingItem?.pricePerUnit || 0}
                                  onChange={(e) => setEditingItem({
                                    ...editingItem!,
                                    pricePerUnit: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <div className="space-y-1">
                                  <input
                                    type="number"
                                    min="1"
                                    value={editingItem?.quantity || 1}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem!,
                                      quantity: parseInt(e.target.value) || 1
                                    })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                                  />
                                  <select
                                    value={editingItem?.product?.unit || (typeof editingItem?.productId === 'object' ? (editingItem!.productId as any).unit : '') || 'pcs'}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem!,
                                      product: {
                                        ...(editingItem!.product || (typeof editingItem?.productId === 'object' ? (editingItem!.productId as any) : { name: '', price: 0, inStock: true })),
                                        unit: e.target.value
                                      }
                                    })}
                                    className="w-full px-1 py-1 border border-gray-300 rounded-md text-[10px]"
                                  >
                                    <option value="pcs">pcs</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="mtr">mtr</option>
                                    <option value="ltr">ltr</option>
                                    <option value="box">box</option>
                                    <option value="pkt">pkt</option>
                                    <option value="set">set</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₹{((editingItem?.pricePerUnit || 0) * (editingItem?.quantity || 1)).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveItemEdit}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelItemEdit}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="font-medium">{item.product?.name || (typeof item.productId === 'object' ? (item.productId as any).name : 'Product')}</div>
                                {(item.product?.description || (typeof item.productId === 'object' ? (item.productId as any).description : '')) && (
                                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {item.product?.description || (typeof item.productId === 'object' ? (item.productId as any).description : '')}
                                  </div>
                                )}
                                {(item.product?.layout || (typeof item.productId === 'object' ? (item.productId as any).layout : '')) && (
                                  <div className="text-xs text-blue-500 truncate max-w-[200px]">
                                    Layout: {item.product?.layout || (typeof item.productId === 'object' ? (item.productId as any).layout : '')}
                                  </div>
                                )}
                                {!item.productId && (
                                  <span className="text-[10px] text-blue-600 font-medium italic">
                                    New product
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₹{item.pricePerUnit.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                <div className="flex items-center justify-end">
                                  <button 
                                    type="button"
                                    onClick={() => handleQuantityChange(index, Math.max(1, item.quantity - 1))}
                                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-l-md border border-gray-300"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-0.5 border-t border-b border-gray-300 bg-white">
                                    {item.quantity} {item.product?.unit || (typeof item.productId === 'object' ? (item.productId as any).unit : '') || 'pcs'}
                                  </span>
                                  <button 
                                    type="button"
                                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-r-md border border-gray-300"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₹{item.total.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditItem(index)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                          Subtotal:
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                          ₹{subtotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                          Total:
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-blue-600">
                          ₹{total.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
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
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-800 mb-3">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              required
              value={formData.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              placeholder="Enter invoice description"
            />
          </div>

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
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Business Logo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Upload className="h-5 w-5" />
                    <span>Upload Logo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {logoUrl && (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              )}
            </div>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove Logo
              </button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Authorized Stamp (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Upload className="h-5 w-5" />
                    <span>Upload Stamp</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {stampUrl && (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={stampUrl} alt="Stamp" className="h-full w-full object-contain" />
                </div>
              )}
            </div>
            {stampUrl && (
              <button
                type="button"
                onClick={() => setStampUrl('')}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove Stamp
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Loading...' : 'Preview Invoice'}
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
    </div>
  );
};

export default InvoiceForm;

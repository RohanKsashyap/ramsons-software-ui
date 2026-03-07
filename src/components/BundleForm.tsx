import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Minus, Trash2, Package, Save, IndianRupee } from 'lucide-react';
import { apiService } from '../services/api';
import type { Product } from '../types';
import ProductSelector from './ProductSelector';

interface BundleFormProps {
  onClose: () => void;
  onSave: (bundle: Product) => Promise<void> | void;
}

export const BundleForm: React.FC<BundleFormProps> = ({ onClose, onSave }) => {
  const [bundleName, setBundleName] = useState('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [bundleItems, setBundleItems] = useState<Array<{
    productId?: string;
    product?: Product;
    name: string;
    quantity: number;
    price: number;
  }>>([]);
  const [saving, setSaving] = useState(false);

  const handleProductSelect = (selectedProducts: Product[]) => {
    const newItems = selectedProducts.map(p => ({
      productId: p.id || p._id,
      product: p,
      name: p.name,
      quantity: 1,
      price: p.price
    }));
    
    setBundleItems(prev => [...prev, ...newItems]);
  };

  const handleAddManualItem = () => {
    setBundleItems(prev => [...prev, {
      name: '',
      quantity: 1,
      price: 0
    }]);
  };

  const updateItem = (index: number, updates: any) => {
    setBundleItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setBundleItems(prev => prev.filter((_, i) => i !== index));
  };

  const individualItemsSum = useMemo(() => {
    return bundleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [bundleItems]);

  const bundleDiscount = useMemo(() => {
    const total = parseFloat(totalPrice) || 0;
    return individualItemsSum - total;
  }, [individualItemsSum, totalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim() || !totalPrice) {
      alert('Please enter bundle name and total price');
      return;
    }
    if (bundleItems.length === 0) {
      alert('Please add at least one item to the bundle');
      return;
    }

    try {
      setSaving(true);
      const productData = {
        name: bundleName.trim(),
        price: parseFloat(totalPrice),
        description: `Bundle: ${bundleItems.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
        isBundle: true,
        bundleItems: bundleItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        inStock: true
      };

      const response = await apiService.products.create(productData);
      
      window.dispatchEvent(new CustomEvent('dataChanged', { 
        detail: { type: 'product', action: 'create' } 
      }));
      
      await onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating bundle:', error);
      alert('Failed to create bundle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Create New Bundle</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Mix Set • Inventory Management</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bundle Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Bundle Name</label>
              <input
                type="text"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="Artisanal Gift Box"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Price</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-12 pr-6 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sub-Products Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sub-Products</h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest">
                  {bundleItems.length} Items Added
                </span>
                <button 
                  type="button"
                  onClick={handleAddManualItem}
                  className="text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Manual Entry
                </button>
              </div>
            </div>

            <ProductSelector 
              onProductSelect={handleProductSelect}
              placeholder="Search catalog to add items..."
              className="mb-6"
            />

            <div className="space-y-3">
              {bundleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <Package className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No items added yet</p>
                </div>
              ) : (
                bundleItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all flex items-center gap-4 group">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                      {item.product ? (
                        <Package className="h-6 w-6" />
                      ) : (
                        "M"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                        className="text-sm font-bold text-gray-900 bg-transparent focus:outline-none w-full border-b border-transparent focus:border-blue-100"
                        placeholder="Item Name"
                      />
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                        Price: ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1">
                        <button 
                          type="button"
                          onClick={() => updateItem(idx, { quantity: Math.max(1, item.quantity - 1) })}
                          className="p-1 hover:text-blue-600 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateItem(idx, { quantity: item.quantity + 1 })}
                          className="p-1 hover:text-blue-600 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Individual Items Sum:</span>
                <span className="text-sm font-black text-gray-900">₹{individualItemsSum.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bundle Discount:</span>
                <span className={`text-sm font-black ${bundleDiscount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {bundleDiscount >= 0 ? '-' : '+'}₹{Math.abs(bundleDiscount).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Bundle Total</span>
              <span className="text-2xl font-black text-blue-600 tracking-tighter">₹{(parseFloat(totalPrice) || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button 
              type="button"
              onClick={() => {
                if (confirm('Discard all changes?')) onClose();
              }}
              className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Discard
            </button>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Bundle'} <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleForm;

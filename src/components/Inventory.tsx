import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit, RefreshCw, BarChart3, Notebook, Download, Filter,Package } from 'lucide-react';
import type { Product } from '../types';
import { apiService } from '../services/api';

interface InventoryItem extends Product {
  quantity?: number;
  reorderLevel?: number;
}

interface AuditLog {
  _id: string;
  productId: string;
  productName: string;
  type: 'add' | 'adjustment' | 'sale' | 'return';
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  performedBy: string;
  date: string;
  notes?: string;
}

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'low-stock' | 'audit' | 'report'>('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [addQuantity, setAddQuantity] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.inventory.getAll();
      const items = response?.data || response || [];
      setInventory(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError(`Failed to load inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.inventory.getLowStock();
      const items = response?.data || response || [];
      setLowStockItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      setError(`Failed to load low stock items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLowStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.inventory.getAuditLogs();
      const logs = response?.data || response || [];
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError(`Failed to load audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchInventory();
    } else if (activeTab === 'low-stock') {
      fetchLowStock();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleAddStock = async () => {
    if (!selectedProduct || !addQuantity) {
      alert('Please select a product and enter quantity');
      return;
    }

    try {
      await apiService.inventory.addStock({
        productId: selectedProduct.id || selectedProduct._id,
        quantity: parseInt(addQuantity),
        notes: `Added stock for ${selectedProduct.name}`,
      });
      alert('Stock added successfully!');
      setShowAddModal(false);
      setAddQuantity('');
      setSelectedProduct(null);
      fetchInventory();
      fetchLowStock();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    }
  };

  const handleAdjustInventory = async () => {
    if (!selectedProduct || !adjustQuantity) {
      alert('Please select a product and enter adjustment quantity');
      return;
    }

    try {
      await apiService.inventory.adjustInventory({
        productId: selectedProduct.id || selectedProduct._id,
        quantityChange: parseInt(adjustQuantity),
        reason: adjustReason || 'Manual adjustment',
      });
      alert('Inventory adjusted successfully!');
      setShowAdjustModal(false);
      setAdjustQuantity('');
      setAdjustReason('');
      setSelectedProduct(null);
      fetchInventory();
      fetchLowStock();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      alert('Failed to adjust inventory');
    }
  };

  const handleUpdateReorderLevel = async (product: InventoryItem) => {
    if (!reorderLevel) {
      alert('Please enter a reorder level');
      return;
    }

    try {
      await apiService.inventory.updateReorderLevel(
        product.id || product._id!,
        parseInt(reorderLevel)
      );
      alert('Reorder level updated successfully!');
      setReorderLevel('');
      setSelectedProduct(null);
      fetchInventory();
    } catch (error) {
      console.error('Error updating reorder level:', error);
      alert('Failed to update reorder level');
    }
  };

  const filteredInventory = inventory.filter(item =>
    (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 md:px-4 py-2 text-sm border rounded-md"
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs md:text-sm whitespace-nowrap"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Stock</span><span className="sm:hidden">Add</span>
        </button>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs md:text-sm whitespace-nowrap"
        >
          <Edit size={16} /> <span className="hidden sm:inline">Adjust</span>
        </button>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
          <Package className="mx-auto mb-4 text-gray-400" size={40} />
          <p className="text-gray-600 text-sm md:text-base">No products found in inventory</p>
        </div>
      ) : (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Quantity</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Reorder Level</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventory.map((item) => (
                <tr key={item.id || item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{item.sku || '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{item.category || '-'}</td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {item.quantity ?? 0}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-600">
                    {item.reorderLevel ?? 5}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {(item.quantity ?? 0) <= (item.reorderLevel ?? 5) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        <AlertCircle size={14} /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(item);
                        setReorderLevel((item.reorderLevel ?? 5).toString());
                        setShowAdjustModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredInventory.map((item) => (
            <div key={item.id || item._id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    {item.sku && <p className="text-xs text-gray-600">SKU: {item.sku}</p>}
                  </div>
                  <div>
                    {(item.quantity ?? 0) <= (item.reorderLevel ?? 5) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        <AlertCircle size={12} /> Low
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-900">{item.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm font-semibold text-gray-900">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-sm font-bold text-gray-900">{item.quantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reorder</p>
                    <p className="text-sm text-gray-900">{item.reorderLevel ?? 5}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Needed</p>
                    <p className="text-sm text-orange-600 font-semibold">
                      {Math.max(0, (item.reorderLevel ?? 5) - (item.quantity ?? 0))}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedProduct(item);
                    setReorderLevel((item.reorderLevel ?? 5).toString());
                    setShowAdjustModal(true);
                  }}
                  className="w-full text-blue-600 hover:text-blue-800 font-semibold text-xs py-2 hover:bg-blue-50 rounded"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
      )}
    </div>
  );

  const renderLowStock = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-bold text-yellow-900 text-sm md:text-base">Low Stock Alert</h3>
          <p className="text-xs md:text-sm text-yellow-800">These items are below their reorder level and need restocking.</p>
        </div>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500 font-medium">No low stock items. All products are well stocked!</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Stock</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reorder Level</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Units Needed</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lowStockItems.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.sku || '-'}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-red-600">
                      {item.quantity ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {item.reorderLevel ?? 5}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-orange-600">
                      {Math.max(0, (item.reorderLevel ?? 5) - (item.quantity ?? 0))}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowAddModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id || item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.sku || 'No SKU'}</p>
                  </div>
                  <div className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                    Low Stock
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Current</p>
                    <p className="text-sm font-black text-red-600">{item.quantity ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Target</p>
                    <p className="text-sm font-bold text-gray-700">{item.reorderLevel ?? 5}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Needed</p>
                    <p className="text-sm font-black text-orange-600">{Math.max(0, (item.reorderLevel ?? 5) - (item.quantity ?? 0))}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(item);
                    setShowAddModal(true);
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  Restock Now
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={fetchAuditLogs}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-bold transition-all active:scale-95"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {auditLogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Notebook className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500 font-medium">No audit logs yet. Inventory changes will appear here.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Change</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Previous</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">New</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-gray-900">{log.productName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        log.type === 'add' ? 'bg-green-100 text-green-800' :
                        log.type === 'sale' ? 'bg-red-100 text-red-800' :
                        log.type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black">
                      {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">{log.previousQuantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{log.newQuantity}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{log.reason}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {auditLogs.map((log) => (
              <div key={log._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{log.productName}</h4>
                    <p className="text-[10px] text-gray-400">{new Date(log.date).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    log.type === 'add' ? 'bg-green-100 text-green-800' :
                    log.type === 'sale' ? 'bg-red-100 text-red-800' :
                    log.type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.type}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded-lg mb-2">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Prev</p>
                    <p className="text-xs font-medium text-gray-600">{log.previousQuantity}</p>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Change</p>
                    <p className={`text-xs font-black ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">New</p>
                    <p className="text-xs font-bold text-gray-900">{log.newQuantity}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 bg-blue-50/50 p-2 rounded-lg">
                  <span className="font-bold text-blue-800">Reason: </span>
                  {log.reason}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderReport = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-semibold">Total Products</div>
          <div className="text-3xl font-bold text-blue-600">{inventory.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-semibold">Low Stock Items</div>
          <div className="text-3xl font-bold text-red-600">{lowStockItems.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-semibold">Total Audit Events</div>
          <div className="text-3xl font-bold text-green-600">{auditLogs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-semibold">Total Inventory Value</div>
          <div className="text-3xl font-bold text-purple-600">
            ₹{inventory.reduce((sum, item) => sum + ((item.quantity ?? 0) * item.price), 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> Inventory Summary
        </h3>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>Total Products:</strong> {inventory.length}</p>
            <p className="mb-2"><strong>Products in Stock:</strong> {inventory.filter(i => (i.quantity ?? 0) > 0).length}</p>
            <p className="mb-2"><strong>Out of Stock:</strong> {inventory.filter(i => (i.quantity ?? 0) === 0).length}</p>
            <p className="mb-2"><strong>Low Stock Items:</strong> {lowStockItems.length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {[
          { id: 'overview', label: 'Inventory Overview', icon: Package },
          { id: 'low-stock', label: 'Low Stock', icon: AlertCircle },
          { id: 'audit', label: 'Audit Logs', icon: Notebook },
          { id: 'report', label: 'Reports', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'low-stock' && renderLowStock()}
          {activeTab === 'audit' && renderAudit()}
          {activeTab === 'report' && renderReport()}
        </>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">Add Stock</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product</label>
                <select
                  value={selectedProduct?.id || selectedProduct?._id || ''}
                  onChange={(e) => {
                    const product = inventory.find(p => (p.id || p._id) === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Select a product...</option>
                  {inventory.map((product) => (
                    <option key={product.id || product._id} value={product.id || product._id}>
                      {product.name} (Current: {product.quantity ?? 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity to Add</label>
                <input
                  type="number"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-2 border rounded-md"
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddStock}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
                >
                  Add Stock
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddQuantity('');
                    setSelectedProduct(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">Adjust Inventory</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product</label>
                <select
                  value={selectedProduct?.id || selectedProduct?._id || ''}
                  onChange={(e) => {
                    const product = inventory.find(p => (p.id || p._id) === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Select a product...</option>
                  {inventory.map((product) => (
                    <option key={product.id || product._id} value={product.id || product._id}>
                      {product.name} (Current: {product.quantity ?? 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Change (+ or -)</label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="Enter adjustment (e.g., -5 or +10)"
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Damage, Discrepancy..."
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Update Reorder Level (Optional)</label>
                <input
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  placeholder="Reorder level"
                  className="w-full px-4 py-2 border rounded-md"
                  min="0"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAdjustInventory}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold"
                >
                  Adjust
                </button>
                <button
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustQuantity('');
                    setAdjustReason('');
                    setReorderLevel('');
                    setSelectedProduct(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

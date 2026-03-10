import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Package, Trash2, Edit, Eye } from 'lucide-react';
import type { Product } from '../types';
import { apiService } from '../services/api';
import { ProductForm } from './ProductForm';
import { BundleForm } from './BundleForm';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mapProduct = (rawProduct: any): Product | null => {
    if (!rawProduct) return null;

    const productId = rawProduct.id || rawProduct._id;

    if (!productId) {
      return null;
    }

    return {
      id: productId,
      _id: rawProduct._id,
      name: rawProduct.name,
      description: rawProduct.description,
      price: typeof rawProduct.price === 'number' ? rawProduct.price : parseFloat(rawProduct.price || '0'),
      unit: rawProduct.unit || 'pcs',
      sku: rawProduct.sku,
      category: rawProduct.category,
      layout: rawProduct.layout,
      inStock: rawProduct.inStock ?? true,
      isBundle: rawProduct.isBundle || false,
      bundleItems: rawProduct.bundleItems || [],
      createdAt: rawProduct.createdAt,
      updatedAt: rawProduct.updatedAt,
    };
  };

  useEffect(() => {
    fetchProducts();

    // Listen for data change events
    const handleDataChanged = (event: CustomEvent) => {
      if (event.detail?.type === 'product') {
        fetchProducts();
      }
    };

    window.addEventListener('dataChanged', handleDataChanged as EventListener);

    return () => {
      window.removeEventListener('dataChanged', handleDataChanged as EventListener);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.products.getAll();
      const rawProducts = response?.data || response || [];
      const parsedProducts = (Array.isArray(rawProducts) ? rawProducts : [])
        .map(mapProduct)
        .filter((product): product is Product => Boolean(product))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setProducts(parsedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setDeleting(true);
      await apiService.products.delete(productId);
      window.dispatchEvent(new CustomEvent('dataChanged', { detail: { type: 'product', action: 'delete' } }));
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    try {
      setDeleting(true);
      await apiService.products.deleteMultiple(selectedProducts);
      window.dispatchEvent(new CustomEvent('dataChanged', { detail: { type: 'product', action: 'delete', count: selectedProducts.length } }));
      await fetchProducts();
      setSelectedProducts([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Failed to delete products');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="relative flex-1 sm:flex-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 md:h-5 w-4 md:w-5" />
          <input
            type="text"
            placeholder="Search products..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowBundleForm(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm whitespace-nowrap"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">New Bundle</span>
              <span className="sm:hidden">Bundle</span>
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Product</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="bg-blue-50 p-3 md:p-4 rounded-xl mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-100">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
            onChange={() => {
              if (selectedProducts.length === filteredProducts.length) {
                // Deselect all
                setSelectedProducts([]);
              } else {
                // Select all filtered products
                setSelectedProducts(filteredProducts.map(p => p.id as string));
              }
            }}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer mr-3"
          />
          <span className="text-blue-900 font-bold text-sm">
            {selectedProducts.length > 0 
              ? `${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'products'} selected` 
              : 'Select All Products'}
          </span>
        </div>
        {selectedProducts.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold shadow-lg shadow-red-100"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* No products state */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first product</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      )}

      {/* Products grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                selectedProducts.includes(product.id as string) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelectProduct(product.id as string)}
            >
              <div className="p-3 md:p-6">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
                    {product.isBundle && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 w-fit">
                        Bundle
                      </span>
                    )}
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id as string)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(product.id as string);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 md:h-5 md:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Price:</span>
                    <span className="font-medium">₹{product.price.toFixed(2)} / {product.unit || 'pcs'}</span>
                  </div>
                  
                  {product.sku && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>SKU:</span>
                      <span>{product.sku}</span>
                    </div>
                  )}
                  
                  {product.category && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Category:</span>
                      <span>{product.category}</span>
                    </div>
                  )}
                  
                  {product.layout && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Layout:</span>
                      <span>{product.layout}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-gray-600">
                    <span>In Stock:</span>
                    <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
                      {product.inStock ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {product.createdAt && (
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Created:</span>
                      <span>{new Date(product.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                {product.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-100 flex justify-between">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id as string)}
                    className="text-red-600 hover:text-red-800 flex items-center"
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForm}
          onSave={fetchProducts}
        />
      )}

      {/* Bundle form modal */}
      {showBundleForm && (
        <BundleForm
          onClose={() => setShowBundleForm(false)}
          onSave={fetchProducts}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'}?
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. These products will be permanently removed from your system.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMultiple}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
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
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Check } from 'lucide-react';
import { apiService } from '../services/api';
import type { Product } from '../types';

interface ProductSelectorProps {
  onProductSelect: (products: Product[]) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onProductSelect,
  placeholder = "Search for products",
  className = "",
  inline = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(inline);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!inline) setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inline]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.products.getAll();
      if (response && response.success && response.data && Array.isArray(response.data)) {
        // Convert MongoDB _id to id for consistency
        const productsWithId = response.data.map(product => ({
          ...product,
          id: product._id || product.id
        }));
        setProducts(productsWithId);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleProductSelect = (product: Product) => {
    const isAlreadySelected = selectedProducts.some(p => p.id === product.id);
    
    if (isAlreadySelected) {
      // Remove from selection
      const updatedSelection = selectedProducts.filter(p => p.id !== product.id);
      setSelectedProducts(updatedSelection);
    } else {
      // Add to selection
      const updatedSelection = [...selectedProducts, product];
      setSelectedProducts(updatedSelection);
    }
  };
  
  const handleAddSelectedProducts = () => {
    if (selectedProducts.length > 0) {
      onProductSelect(selectedProducts);
      setSelectedProducts([]);
      setSearchTerm('');
      if (!inline) setShowDropdown(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = products.find(p => p.name.toLowerCase() === searchTerm.toLowerCase());

  const handleAddNewProduct = () => {
    if (!searchTerm.trim()) return;
    
    const newProduct: Product = {
      name: searchTerm.trim(),
      price: 0,
      unit: 'pcs',
      inStock: true,
      description: ''
    };
    
    onProductSelect([newProduct]);
    setSearchTerm('');
    if (!inline) setShowDropdown(false);
  };

  const listContainerClasses = inline 
    ? "w-full mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0"
    : "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto";

  return (
    <div ref={containerRef} className={`relative flex flex-col ${inline ? 'h-full' : ''} ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              if (!inline) setShowDropdown(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown / List */}
      {(showDropdown || inline) && (
        <div className={listContainerClasses}>
          {/* Selected Products Count and Add Button */}
          {selectedProducts.length > 0 && (
            <div className="sticky top-0 z-10 bg-blue-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm font-bold text-blue-800">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </div>
              <button
                type="button"
                onClick={handleAddSelectedProducts}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors shadow-sm"
              >
                Add Selected Products
              </button>
            </div>
          )}
          
          <div className={`${inline ? 'overflow-y-auto flex-1' : ''}`}>
            {/* Product List */}
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Loading products...
              </div>
            ) : (
              <>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id || product._id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        selectedProducts.some(p => p.id === product.id) ? 'bg-blue-50 hover:bg-blue-100' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-5 h-5 mr-3 flex items-center justify-center rounded border transition-colors ${
                            selectedProducts.some(p => p.id === product.id) 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300 bg-white'
                          }`}>
                            {selectedProducts.some(p => p.id === product.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              {product.sku && `SKU: ${product.sku}`}
                              {product.category && `${product.sku ? ' • ' : ''}Category: ${product.category}`}
                              {product.inStock ? ' • In Stock' : ' • Out of Stock'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600 font-bold text-sm">₹{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {product.unit || 'pcs'}</div>
                          {product.quantity !== undefined && (
                            <div className="text-[10px] text-gray-400">Qty: {product.quantity}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <p className="font-medium text-sm">No products found</p>
                    <p className="text-xs">Try searching with a different term</p>
                  </div>
                )}
                
                {/* Add New Product Option */}
                {searchTerm && !exactMatch && (
                  <button
                    type="button"
                    onClick={handleAddNewProduct}
                    className="w-full px-4 py-4 text-left hover:bg-blue-50 text-blue-600 font-bold border-t border-gray-100 flex items-center transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{searchTerm}" as new product
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;

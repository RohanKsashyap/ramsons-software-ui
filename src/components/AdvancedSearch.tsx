import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, DollarSign, User, Phone } from 'lucide-react';
import type { Customer } from '../types';

interface SearchFilters {
  searchTerm: string;
  balanceMin: string;
  balanceMax: string;
  dateFrom: string;
  dateTo: string;
  status: 'all' | 'paid' | 'unpaid' | 'overdue';
  sortBy: 'name' | 'balance' | 'createdAt' | 'totalCredit';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  customers: Customer[];
  onFilteredResults: (customers: Customer[]) => void;
  onSearchChange: (searchTerm: string) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  customers,
  onFilteredResults,
  onSearchChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    balanceMin: '',
    balanceMax: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  useEffect(() => {
    applyFilters();
  }, [filters, customers]);

  const applyFilters = () => {
    let filtered = [...customers];

    // Text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(filters.searchTerm) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.id.toLowerCase().includes(searchLower)
      );
    }

    // Balance range filter
    if (filters.balanceMin) {
      filtered = filtered.filter(customer => 
        parseFloat(customer.balance.toString()) >= parseFloat(filters.balanceMin)
      );
    }
    if (filters.balanceMax) {
      filtered = filtered.filter(customer => 
        parseFloat(customer.balance.toString()) <= parseFloat(filters.balanceMax)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) <= new Date(filters.dateTo)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(customer => {
        const balance = parseFloat(customer.balance.toString());
        switch (filters.status) {
          case 'paid':
            return balance <= 0;
          case 'unpaid':
            return balance > 0;
          case 'overdue':
            // Check if customer has overdue transactions
            return customer.transactions?.some(t => 
              t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'PAID'
            ) || false;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'balance':
          aValue = parseFloat(a.balance.toString());
          bValue = parseFloat(b.balance.toString());
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'totalCredit':
          aValue = parseFloat(a.totalCredit.toString());
          bValue = parseFloat(b.totalCredit.toString());
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    onFilteredResults(filtered);
    onSearchChange(filters.searchTerm);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      balanceMin: '',
      balanceMax: '',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const hasActiveFilters = filters.balanceMin || filters.balanceMax || 
    filters.dateFrom || filters.dateTo || filters.status !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg border transition-colors text-sm md:text-base ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-[10px] md:text-xs rounded-full px-1.5 md:px-2 py-0.5 md:py-1">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors text-sm md:text-base"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Balance Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.balanceMin}
                  onChange={(e) => handleFilterChange('balanceMin', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.balanceMax}
                  onChange={(e) => handleFilterChange('balanceMax', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Customers</option>
                <option value="paid">Paid Up</option>
                <option value="unpaid">Has Balance</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="balance">Balance</option>
                  <option value="createdAt">Date Added</option>
                  <option value="totalCredit">Total Credit</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="asc">↑ Asc</option>
                  <option value="desc">↓ Desc</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
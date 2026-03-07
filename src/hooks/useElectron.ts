import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Customer, Transaction } from '../types';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.customers.getAll();
      // Handle the API response structure which has data in a nested 'data' property
      const customersData = response.data || [];
      // Convert MongoDB _id to id for consistency and filter out null/invalid customers
      const customersWithId = customersData
        .filter((customer: any) => customer && customer._id)
        .map((customer: any) => ({
          ...customer,
          id: customer._id
        }));
      setCustomers(customersWithId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      setCustomers([]); // Ensure customers is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await apiService.customers.create(customerData);
      await fetchCustomers();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
      throw err;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const response = await apiService.customers.update(id, customerData);
      await fetchCustomers();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await apiService.customers.delete(id);
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
      throw err;
    }
  };

  const searchCustomers = async (searchTerm: string) => {
    try {
      setLoading(true);
      const response = await apiService.customers.search(searchTerm);
      // Handle the API response structure which has data in a nested 'data' property
      const customersData = response.data || [];
      // Convert MongoDB _id to id for consistency and filter out null/invalid customers
      const customersWithId = customersData
        .filter((customer: any) => customer && customer._id)
        .map((customer: any) => ({
          ...customer,
          id: customer._id
        }));
      setCustomers(customersWithId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
      setCustomers([]); // Ensure customers is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
  };
};

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.transactions.getAll();
      // Handle the API response structure which has data in a nested 'data' property
      const transactionsData = response.data || [];
      // Convert MongoDB _id to id for consistency and filter out null/invalid transactions
      const transactionsWithId = transactionsData
        .filter((transaction: any) => transaction && transaction._id)
        .map((transaction: any) => ({
          ...transaction,
          id: transaction._id
        }));
      setTransactions(transactionsWithId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setTransactions([]); // Ensure transactions is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData: Partial<Transaction>) => {
    try {
      await apiService.transactions.create(transactionData);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      throw err;
    }
  };

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
    try {
      await apiService.transactions.update(id, transactionData);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    }
  };

  const makePayment = async (transactionId: string, amount: number) => {
    try {
      await apiService.transactions.makePayment(transactionId, amount);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    makePayment,
  };
};
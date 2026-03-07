export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  totalCredit: number;
  totalPaid: number;
  balance: number;
  advancePayment?: number;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
}

export interface NotificationRule {
  id: string;
  name: string;
  type: 'overdue' | 'reminder' | 'followup';
  enabled: boolean;
  conditions: {
    daysOverdue?: number;
    balanceThreshold?: number;
    customerTags?: string[];
  };
  actions: {
    notification: boolean;
    email?: boolean;
    sms?: boolean;
  };
  sound: {
    enabled: boolean;
    type: 'notification' | 'urgent' | 'reminder' | 'custom';
    customUrl?: string;
    volume?: number;
  };
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    days?: number[]; // 0-6 for weekly
  };
  message: {
    title: string;
    body: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: 'overdue' | 'payment_missed' | 'manual';
    daysAfter: number;
  };
  steps: FollowUpStep[];
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpStep {
  id: string;
  sequenceId: string;
  stepNumber: number;
  delayDays: number;
  action: 'notification' | 'email' | 'sms' | 'call_reminder';
  message: {
    title: string;
    body: string;
  };
  completed: boolean;
  completedAt?: string;
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category?: string;
  layout?: string;
  inStock: boolean;
  isBundle?: boolean;
  bundleItems?: Array<{
    productId?: string;
    name: string;
    quantity: number;
    price?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  productId: string | Product;
  product?: Product;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Transaction {
  _id: string;
  customerId: string | {
    _id: string;
    name: string;
    phone: string;
  };
  customerName: string;
  type: 'payment' | 'invoice' | 'customer' | 'credit' | 'debit';
  amount: number;
  date: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'paid' | 'unpaid' | 'partial' | 'overdue';
  description?: string;
  reference?: string;
  paymentMethod?: string;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
  customer?: {
    _id: string;
    name: string;
    phone: string;
    balance?: number;
    totalCredit?: number;
    totalPaid?: number;
  };
  originalAmount?: number;
  gstRate?: number;
  gstAmount?: number;
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  applyGST?: boolean;
  address?: string;
  customerState?: string;
  customerGST?: string;
  logoUrl?: string;
  stampUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyGST?: string;
  companyPhone?: string;
  companyEmail?: string;
  advanceTransactionId?: string;
  advanceOriginalAmount?: number;
  advanceUsedAmount?: number;
  advanceRemainingAfterUse?: number;
}

export * from './auth';

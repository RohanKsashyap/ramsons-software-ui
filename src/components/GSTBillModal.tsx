import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import type { Transaction, Customer, Product } from '../types';
import { apiService } from '../services/api';

interface GSTBillModalProps {
  invoice: Transaction;
  onClose: () => void;
  allCustomers?: Customer[];
}

export const GSTBillModal: React.FC<GSTBillModalProps> = ({ invoice: initialInvoice, onClose }) => {
  const [invoice, setInvoice] = useState<Transaction>(initialInvoice);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    address: '',
    gst: '',
    phone: '',
    email: '',
    logo: '',
    stamp: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    iban: '',
    swiftBic: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCompanyProfile(),
          fetchLatestInvoice(),
          fetchAllProducts()
        ]);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialInvoice._id]);

  const fetchAllProducts = async () => {
    try {
      const response = await apiService.products.getAll();
      const productsData = response?.success ? response.data : Array.isArray(response) ? response : [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchLatestInvoice = async () => {
    try {
      const response = await apiService.transactions.getById(initialInvoice._id);
      const data = response?.data || response;
      if (data) {
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching latest invoice:', error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await apiService.companyProfile.getProfile();
      const profile = response?.data || response;
      if (profile) {
        setCompanyDetails({
          name: profile.companyName || initialInvoice.companyName || '',
          address: profile.address || initialInvoice.companyAddress || '',
          gst: profile.gst || initialInvoice.companyGST || '',
          phone: profile.contact || initialInvoice.companyPhone || '',
          email: profile.email || initialInvoice.companyEmail || '',
          logo: profile.logo || initialInvoice.logoUrl || '',
          stamp: profile.stamp || initialInvoice.stampUrl || '',
          bankName: profile.bankName || '',
          accountNumber: profile.accountNumber || '',
          ifscCode: profile.ifscCode || '',
          iban: profile.iban || '',
          swiftBic: profile.swiftBic || '',
        });
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  // Helper to get enriched product name
  const getProductName = (item: any) => {
    if (item.product?.name) return item.product.name;
    const foundProduct = products.find(p => (p.id || p._id) === item.productId);
    return foundProduct?.name || 'Product';
  };

  // Helper to get enriched product SKU
  const getProductSKU = (item: any, idx: number) => {
    if (item.product?.sku) return item.product.sku;
    const foundProduct = products.find(p => (p.id || p._id) === item.productId);
    return foundProduct?.sku || `ITEM-${idx + 1}`;
  };

  const getCustomerName = (): string => {
    if (invoice.customer?.name) return invoice.customer.name;
    if (typeof invoice.customerId === 'object' && (invoice.customerId as any)?.name) {
      return (invoice.customerId as any).name;
    }
    return invoice.customerName || 'N/A';
  };

  const getCustomerPhone = (): string => {
    if (invoice.customer?.phone) return invoice.customer.phone;
    if (typeof invoice.customerId === 'object' && (invoice.customerId as any)?.phone) {
      return (invoice.customerId as any).phone;
    }
    return '';
  };

  const calculateTotals = () => {
    const subtotal = invoice.items?.reduce((sum, item) => sum + item.total, 0) || 0;
    const cgst = invoice.cgst || 0;
    const sgst = invoice.sgst || 0;
    const igst = invoice.igst || 0;
    const totalTax = cgst + sgst + igst;
    const totalAmount = subtotal + totalTax;

    return {
      subtotal,
      cgst,
      sgst,
      igst,
      totalTax,
      totalAmount
    };
  };

  const handleNextCustomer = () => {
    setCurrentCustomerIndex((prev) => (prev + 1) % customers.length);
  };

  const handlePreviousCustomer = () => {
    setCurrentCustomerIndex((prev) => (prev - 1 + customers.length) % customers.length);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('gst-bill-content');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>GST Invoice</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #333;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div class="p-0">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    alert('PDF download feature would be implemented with html2pdf library');
  };

  const { subtotal, totalTax, totalAmount } = calculateTotals();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm z-10">
        <h2 className="text-xl font-bold text-gray-900">GST Invoice Bill</h2>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Bill Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-0 md:p-8">
        <div id="gst-bill-content" className="bg-white mx-auto max-w-5xl shadow-2xl min-h-full md:min-h-0 font-sans">
          {/* Redesigned Header */}
          <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
               {companyDetails.logo ? (
                 <img src={companyDetails.logo} alt="Logo" className="h-16 w-16 bg-white rounded-lg p-1 object-contain" />
               ) : (
                 <div className="h-16 w-16 bg-blue-500 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-white border-opacity-20">
                   LOGO
                 </div>
               )}
               <div>
                 <h1 className="text-2xl font-bold tracking-tight uppercase">{companyDetails.name || 'COMPANY NAME'}</h1>
                 <p className="text-blue-100 text-sm">{companyDetails.email || 'TAGLINE OR EMAIL'}</p>
               </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-light opacity-80 mb-2 tracking-widest">INVOICE</h2>
              <div className="bg-blue-500 bg-opacity-30 px-4 py-1 rounded-full text-sm inline-block font-mono">
                #INV-{invoice._id?.substring(0, 8)}
              </div>
            </div>
          </div>

          {/* Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-100 text-center bg-white">
            <div className="p-4 border-r border-b md:border-b-0 border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Issue Date</p>
              <p className="text-gray-800 font-semibold">{new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
            </div>
            <div className="p-4 border-r border-b md:border-b-0 border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Due Date</p>
              <p className="text-blue-600 font-semibold">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div className="p-4 border-r border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Payment Method</p>
              <p className="text-gray-800 font-semibold uppercase">{invoice.paymentMethod || 'N/A'}</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status</p>
              <div className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                invoice.status === 'completed' || invoice.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {invoice.status}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <h3 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">From</h3>
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{companyDetails.name}</h4>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{companyDetails.address}</p>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="text-blue-600">✉</span> {companyDetails.email}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="text-blue-600">📞</span> {companyDetails.phone}
                </p>
                {companyDetails.gst && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="text-blue-600 font-bold text-[10px]">GSTIN:</span> {companyDetails.gst}
                  </p>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <h3 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Bill To</h3>
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{getCustomerName()}</h4>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                {invoice.address || (typeof invoice.customerId === 'object' ? (invoice.customerId as any)?.address : '') || 'Billing address not specified'}
              </p>
              <div className="mt-4 space-y-1">
                {getCustomerPhone() && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="text-blue-600">📞</span> {getCustomerPhone()}
                  </p>
                )}
                {invoice.customerGST && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                     <span className="text-blue-600 font-bold text-[10px]">GSTIN:</span> {invoice.customerGST}
                  </p>
                )}
              </div>
            </div>
          </div>

            {/* Items Table */}
            <div className="px-8 mb-8 bg-white overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-blue-600 tracking-wider border-b border-blue-100">
                    <th className="py-4">SKU / Item</th>
                    <th className="py-4">Description</th>
                    <th className="py-4 text-center">Qty</th>
                    <th className="py-4 text-right">Unit Price</th>
                    <th className="py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 group hover:bg-gray-50 transition-colors">
                        <td className="py-6 text-xs text-gray-400 font-medium">
                          {getProductSKU(item, idx)}
                        </td>
                        <td className="py-6">
                          <p className="text-sm font-bold text-gray-800 mb-1">{getProductName(item)}</p>
                          <p className="text-xs text-gray-400">{item.product?.description || products.find(p => (p.id || p._id) === item.productId)?.description}</p>
                        </td>
                        <td className="py-6 text-center text-sm font-semibold text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="py-6 text-right text-sm font-semibold text-gray-600">
                          ₹{item.pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-6 text-right text-sm font-bold text-gray-800">
                          ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic text-sm">
                        No items found in this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Section */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 bg-gray-50 bg-opacity-30">
              <div className="bg-blue-50 bg-opacity-40 p-6 rounded-xl border border-blue-100">
                <h3 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-4">Notes & Payment Instructions</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  {invoice.description || `Please include invoice number #INV-${invoice._id?.substring(0, 8)} in your bank transfer reference.`}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Bank Name</p>
                    <p className="text-xs font-bold text-gray-700">{companyDetails.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Account No.</p>
                    <p className="text-xs font-bold text-gray-700">{companyDetails.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">IFSC Code</p>
                    <p className="text-xs font-bold text-gray-700">{companyDetails.ifscCode || 'N/A'}</p>
                  </div>
                  {companyDetails.gst && (
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Company GST</p>
                      <p className="text-xs font-bold text-gray-700">{companyDetails.gst}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col justify-center items-end">
                <div className="w-full max-w-[320px] space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider">Subtotal</span>
                    <span className="text-gray-800 font-bold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  {invoice.cgst > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-semibold uppercase tracking-wider">CGST</span>
                      <span className="text-gray-800 font-bold">₹{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {invoice.sgst > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-semibold uppercase tracking-wider">SGST</span>
                      <span className="text-gray-800 font-bold">₹{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {invoice.igst > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-semibold uppercase tracking-wider">IGST</span>
                      <span className="text-gray-800 font-bold">₹{invoice.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {((invoice as any).shipping || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-semibold uppercase tracking-wider">Shipping</span>
                      <span className="text-gray-800 font-bold">₹{((invoice as any).shipping).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  <div className="pt-6 mt-6 border-t-2 border-blue-100 flex flex-col items-end">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Total Amount Due</p>
                     <h2 className="text-4xl font-black text-blue-600 mb-1">
                       ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                     </h2>
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Indian Rupee (INR)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 p-8 text-white text-[10px] flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="uppercase font-bold tracking-widest opacity-60">© {new Date().getFullYear()} {companyDetails.name || 'RAMSONS ACCOUNTING'}. ALL RIGHTS RESERVED.</p>
              <div className="flex gap-6 uppercase font-bold tracking-widest opacity-60">
                 <span className="hover:opacity-100 cursor-pointer transition-opacity">Privacy Policy</span>
                 <span className="hover:opacity-100 cursor-pointer transition-opacity">Terms of Service</span>
                 <span className="hover:opacity-100 cursor-pointer transition-opacity">Contact Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

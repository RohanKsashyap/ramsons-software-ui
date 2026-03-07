import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { apiService } from '../services/api';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void> | void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    gst: '',
    address: '',
    email: '',
    contact: '',
    logo: '',
    stamp: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    iban: '',
    swiftBic: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const response = await apiService.companyProfile.getProfile();
      const profile = response?.data || response;
      if (profile) {
        setFormData({
          companyName: profile.companyName || '',
          gst: profile.gst || '',
          address: profile.address || '',
          email: profile.email || '',
          contact: profile.contact || '',
          logo: profile.logo || '',
          stamp: profile.stamp || '',
          bankName: profile.bankName || '',
          accountNumber: profile.accountNumber || '',
          ifscCode: profile.ifscCode || '',
          iban: profile.iban || '',
          swiftBic: profile.swiftBic || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch company profile:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.companyProfile.updateProfile(formData);

      if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification({
          type: 'info',
          title: 'Profile Updated',
          message: 'Company profile has been updated successfully.',
          priority: 'low',
          autoClose: true,
        });
      }

      await Promise.resolve(onSave());
      onClose();
    } catch (error) {
      alert('Failed to save company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'stamp') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [field]: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-none text-blue-600">Company Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X className="h-5 md:h-6 w-5 md:w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {fetching ? (
            <div className="flex items-center justify-center p-20">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <form id="companyProfileForm" onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="companyName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="gst" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    GST Number *
                  </label>
                  <input
                    type="text"
                    id="gst"
                    name="gst"
                    required
                    value={formData.gst}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium uppercase"
                    placeholder="Enter GST number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium resize-none"
                    placeholder="Enter company address"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    required
                    value={formData.contact}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Enter contact number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label htmlFor="logo" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Company Logo
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="h-14 w-14 flex-shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-gray-300 text-[10px] font-bold uppercase text-center leading-none">No<br/>Logo</div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="stamp" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Authorized Stamp
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="h-14 w-14 flex-shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                      {formData.stamp ? (
                        <img src={formData.stamp} alt="Stamp preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-gray-300 text-[10px] font-bold uppercase text-center leading-none">No<br/>Stamp</div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="stamp"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'stamp')}
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="bankName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Bank Name</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g. National Innovation Bank"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="accountNumber" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Account Number</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Account Number"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ifscCode" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">IFSC/Swift Code</label>
                    <input
                      type="text"
                      id="ifscCode"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="IFSC/Swift"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="iban" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">IBAN</label>
                    <input
                      type="text"
                      id="iban"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      placeholder="IBAN"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="swiftBic" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Swift/BIC</label>
                    <input
                      type="text"
                      id="swiftBic"
                      name="swiftBic"
                      value={formData.swiftBic}
                      onChange={handleChange}
                      placeholder="Swift/BIC"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm uppercase"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-white transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            form="companyProfileForm"
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

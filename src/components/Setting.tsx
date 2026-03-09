import React, { useState, useEffect } from 'react';
import { Bell, User, Loader, Edit2,Plus } from 'lucide-react';
import { NotificationSettings } from './NotificationSettings';
import { CompanyProfileModal } from './CompanyProfileModal';
import { apiService } from '../services/api';

interface ProfileData {
  companyName: string;
  gst: string;
  address: string;
  email: string;
  contact: string;
}

export const Setting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'profile'>('notifications');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await apiService.companyProfile.getProfile();
      const profile = response?.data || response;
      setProfileData(profile);
    } catch (error) {
      console.error('Failed to fetch company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfileData();
    }
  }, [activeTab, refreshKey]);

  const handleProfileSave = async () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="flex flex-col md:flex-row">
          {/* Settings Navigation */}
          <div className="w-full md:w-64 bg-gray-50/50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 hidden md:block">Settings</h3>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center whitespace-nowrap px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className={`${activeTab === 'notifications' ? 'mr-2' : 'mr-3'}`}>
                  <Bell size={18} />
                </span>
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center whitespace-nowrap px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className={`${activeTab === 'profile' ? 'mr-2' : 'mr-3'}`}>
                  <User size={18} />
                </span>
                Company Profile
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-4 md:p-8">
            {activeTab === 'notifications' && (
              <NotificationSettings />
            )}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-extrabold text-gray-900">Company Profile</h3>
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                      <Edit2 size={18} />
                      Edit Profile
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : profileData && (profileData.companyName || profileData.gst || profileData.address || profileData.email || profileData.contact) ? (
                    <div className="bg-gray-50/50 rounded-2xl p-5 md:p-8 space-y-6 border border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Name</label>
                          <p className="text-lg text-gray-900 font-extrabold">{profileData.companyName || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GST Number</label>
                          <p className="text-lg text-gray-900 font-extrabold uppercase">{profileData.gst || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                          <p className="text-lg text-gray-900 font-extrabold">{profileData.email || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Number</label>
                          <p className="text-lg text-gray-900 font-extrabold">{profileData.contact || '-'}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200/50 space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</label>
                        <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{profileData.address || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 rounded-2xl p-10 md:p-20 text-center border-2 border-dashed border-gray-200">
                      <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <User size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium mb-6">No company profile information added yet.</p>
                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                      >
                        <Plus size={20} />
                        Add Company Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CompanyProfileModal
        key={refreshKey}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleProfileSave}
      />
    </div>
  );
};
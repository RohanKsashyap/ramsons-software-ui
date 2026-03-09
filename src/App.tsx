import { useState, useEffect } from 'react';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import { Link } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { apiService } from './services/api';
import { Calculator, CreditCard, IndianRupee, FileText, Home, PieChart, Settings, Users, Package, Boxes } from 'lucide-react';

// Import all page components
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { CustomerList } from './components/CustomerList';
import { Invoices } from './components/Invoices';
import { Reports } from './components/Reports';
import { Calculator as CalculatorComponent } from './components/Calculator';
import { Payments } from './components/Payments';
import { Setting } from './components/Setting';
import { NotificationManager } from './components/NotificationManager';
import { dueDateNotificationService } from './services/dueDateNotificationService';
import { backgroundNotificationService } from './services/backgroundNotificationService';
import { Products } from './components/Products';
import { Inventory } from './components/Inventory';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'reset'>('login');
  const [companyName, setCompanyName] = useState('Ramsons Accounting');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();

  const handleGoHome = () => {
    setActiveTab('dashboard');
    window.location.hash = '#/dashboard';
    setSidebarOpen(false);
  };

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const response = await apiService.companyProfile.getProfile();
        const profile = response?.data || response;
        if (profile?.companyName) {
          setCompanyName(profile.companyName);
        }
      } catch (error) {
        console.error('Failed to fetch company profile:', error);
      }
    };
    fetchCompanyName();
  }, []);

  // Initialize notification services
  useEffect(() => {
    // Initialize due date notification service
    console.log('Initializing due date notification service...');
    
    // Initialize background notification service
    console.log('Initializing background notification service...');
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Handle URL hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const tabId = hash.split('?')[0] || 'dashboard';
      if (menuItems.some(item => item.id === tabId)) {
        setActiveTab(tabId);
      }
    };

    // Set initial tab based on URL hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'transactions', label: 'Transactions', icon: <IndianRupee size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Boxes size={20} /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText size={20} /> },
    { id: 'reports', label: 'Reports', icon: <PieChart size={20} /> },
    { id: 'calculator', label: 'Calculator', icon: <Calculator size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-2 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100 mr-2"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 
          onClick={handleGoHome}
          className="text-lg font-bold text-gray-800 truncate cursor-pointer flex-1"
        >
          {companyName}
        </h1>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive with Sliding Animation */}
      <div className={`fixed md:static top-0 left-0 h-screen md:h-auto w-64 bg-white shadow-lg md:shadow-md overflow-y-auto transition-transform duration-300 ease-in-out transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 z-40 md:z-auto md:max-h-full max-h-screen`}>
        <div className="p-4 border-b hidden md:block">
          <div className="flex items-center justify-between">
           <h1 
             onClick={handleGoHome}
             className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
           >
             {companyName}
           </h1> 
            {user ? (
              <button
                onClick={logout}
                className="flex items-center space-x-1 rounded-md bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center space-x-1 rounded-md bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
                title="Log in"
              >
                <LogIn size={16} />
              </button>
            )}
          </div>
          {user && (
            <p className="mt-2 text-sm text-gray-600 truncate" title={user.email}>
              Signed in as {user.email}
            </p>
          )}
        </div>
        
        <div className="p-4 md:hidden border-b">
          <div className="flex items-center justify-between gap-2 mb-3">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="flex items-center space-x-1 rounded-md bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 flex-1"
                title="Log out"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                  setSidebarOpen(false);
                }}
                className="flex items-center space-x-1 rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 flex-1"
                title="Log in"
              >
                <LogIn size={16} />
                <span>Login</span>
              </button>
            )}
          </div>
          {user && (
            <p className="text-xs text-gray-600 truncate" title={user.email}>
              {user.email}
            </p>
          )}
        </div>

        <nav className="mt-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    window.location.hash = `#/${item.id}`;
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 text-left ${activeTab === item.id ? 'bg-blue-100 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  disabled={!user}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="text-sm md:text-base">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {!user && (
          <div className="border-t p-4 text-sm text-gray-600 md:absolute md:bottom-0 md:left-0 md:right-0">
            <p className="mb-2 font-semibold">Please log in</p>
            <p className="mb-4 text-xs">Login to access the dashboard, customers, transactions, and more.</p>
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
                setSidebarOpen(false);
              }}
              className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="hidden md:flex mb-6 p-4 md:p-6 items-center justify-between border-b bg-white">
          <h2 className="text-2xl font-semibold text-gray-800">
            {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <div className="text-sm text-gray-500">
            {user ? `Welcome back, ${user.email}` : 'You are browsing as a guest'}
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-6">

          {!user ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 md:p-10 text-center">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">Login required</h3>
              <p className="mt-3 text-sm md:text-base text-gray-600">Please log in to manage customers, transactions, reports, and more features.</p>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="mt-6 rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
              >
                Sign in to continue
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h2>
                  <Dashboard />
                </div>
              )}

              {activeTab === 'transactions' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Transactions</h2>
                  <Transactions />
                </div>
              )}

              {activeTab === 'customers' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Customers</h2>
                  <CustomerList />
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Products</h2>
                  <Products />
                </div>
              )}

              {activeTab === 'inventory' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Inventory Management</h2>
                  <Inventory />
                </div>
              )}

              {activeTab === 'invoices' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Invoices</h2>
                  <Invoices />
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Reports</h2>
                  <Reports />
                </div>
              )}

              {activeTab === 'calculator' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Calculator</h2>
                  <CalculatorComponent />
                </div>
              )}

              {activeTab === 'payments' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Payments</h2>
                  <Payments />
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Settings</h2>
                  <Setting />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notification Manager */}
      <NotificationManager maxNotifications={5} position="bottom-right" />

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchMode={(modeValue) => {
          setAuthMode(modeValue);
          setIsAuthModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;
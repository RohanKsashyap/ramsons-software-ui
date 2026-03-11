import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, AlertCircle, TrendingUp, CreditCard, FileText } from 'lucide-react';
import type { Customer, Transaction } from '../types';
import { apiService } from '../services/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import DueDateAlerts from './DueDateAlerts';
import NotificationTest from './NotificationTest';
import CustomerCreationDemo from './CustomerCreationDemo';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSales: 0,
    totalOutstanding: 0,
    totalAdvance: 0,
    overdueCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats from the new API endpoint
        const dashboardResponse = await apiService.dashboard.getStats();
        
        if (dashboardResponse && dashboardResponse.data) {
          const {
            totalCustomers,
            totalRevenue,
            totalSales,
            totalOutstanding,
            totalAdvance,
            overdueCount,
            recentTransactions: transactions
          } = dashboardResponse.data;

          // Set stats
          setStats({
            totalCustomers,
            totalSales: totalSales || 0,
            totalOutstanding,
            totalAdvance: totalAdvance || 0,
            overdueCount: overdueCount || 0
          });
          
          // Set recent transactions
          if (transactions && transactions.length > 0) {
            setRecentTransactions(transactions);
          }
        }
        
        // Fetch monthly revenue data
        const monthlyRevenueResponse = await apiService.dashboard.getMonthlyRevenue();
        if (monthlyRevenueResponse && monthlyRevenueResponse.data) {
          setMonthlyRevenue(monthlyRevenueResponse.data);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Show error state instead of using mock data
        setStats({
          totalCustomers: 0,
          totalSales: 0,
          totalOutstanding: 0,
          totalAdvance: 0,
          overdueCount: 0,
        });
        
        setRecentTransactions([]);
        setMonthlyRevenue([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Customer Advance',
      value: `₹${stats.totalAdvance.toFixed(2)}`,
      icon: CreditCard,
      color: 'blue',
    },
    {
      title: 'Total Sales',
      value: `₹${stats.totalSales.toFixed(2)}`,
      icon: IndianRupee,
      color: 'green',
    },
    {
      title: 'Outstanding Amount',
      value: `₹${stats.totalOutstanding.toFixed(2)}`,
      icon: TrendingUp,
      color: 'yellow',
    },
    {
      title: 'Overdue Payments',
      value: stats.overdueCount,
      icon: AlertCircle,
      color: 'red',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 break-words">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-full flex-shrink-0 ml-2 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-4 w-4 md:h-6 md:w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Monthly Revenue</h3>
        {monthlyRevenue.length > 0 ? (
          <div className="h-48 md:h-64">
            <Bar
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'Sales',
                    data: monthlyRevenue,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false
                  }
                }
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No revenue data available</p>
        )}
      </div>

      {/* Due Date Alerts */}
      <DueDateAlerts />

      {/* Customer Creation Demo */}
      <CustomerCreationDemo />

      {/* Notification Test (for development) */}
      <NotificationTest />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md overflow-hidden flex flex-col">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 px-1">Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[400px] md:max-h-64 pr-1">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm md:text-base">
                      {transaction.customer?.name ||
                       (transaction.customerId && typeof transaction.customerId === 'object' && (transaction.customerId as any)?.name ? (transaction.customerId as any).name : null) ||
                       transaction.customerName ||
                       'Unknown Customer'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] md:text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded uppercase font-semibold">{transaction.type}</span>
                      <span className="text-[10px] md:text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/50">
                    <p className="font-bold text-gray-900 text-sm md:text-base order-1 sm:order-none">₹{transaction.amount.toLocaleString()}</p>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full order-2 sm:order-none ${
                      transaction.status === 'completed' || transaction.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.paymentMethod === 'advance' ? 'Advance' : transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <button 
              onClick={() => window.location.hash = '#/customers?action=new'}
              className="w-full flex items-center gap-3 p-3 md:p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] border border-blue-100">
              <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-200">
                <Users className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </div>
              <div>
                <span className="font-bold text-blue-900 text-sm md:text-base block">Add Customer</span>
                <span className="text-[10px] md:text-xs text-blue-600/70">Create a new client profile</span>
              </div>
            </button>
            <button 
              onClick={() => window.location.hash = '#/invoices?action=new'}
              className="w-full flex items-center gap-3 p-3 md:p-4 text-left bg-green-50 hover:bg-green-100 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] border border-green-100">
              <div className="bg-green-600 p-2 rounded-lg text-white shadow-md shadow-green-200">
                <IndianRupee className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </div>
              <div>
                <span className="font-bold text-green-900 text-sm md:text-base block">New llll Invoice </span>
                <span className="text-[10px] md:text-xs text-green-600/70">Add a new invoice</span>
              </div>
            </button>
            <button 
              onClick={() => window.location.hash = '#/reports'}
              className="w-full flex items-center gap-3 p-3 md:p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] border border-purple-100 sm:col-span-2 lg:col-span-1">
              <div className="bg-purple-600 p-2 rounded-lg text-white shadow-md shadow-purple-200">
                <FileText className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </div>
              <div>
                <span className="font-bold text-purple-900 text-sm md:text-base block">Generate Report</span>
                <span className="text-[10px] md:text-xs text-purple-600/70">View business insights</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

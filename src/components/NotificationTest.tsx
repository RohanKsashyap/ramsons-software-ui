import React, { useState } from 'react';
import { Bell, TestTube, Clock, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';
import { audioService } from '../services/audioService';

export const NotificationTest: React.FC = () => {
  const [soundType, setSoundType] = useState<'notification' | 'urgent' | 'reminder'>('notification');

  const testNotification = (type: 'due_soon' | 'overdue' | 'payment_received' | 'info') => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      const notifications = {
        due_soon: {
          type: 'due_soon' as const,
          title: 'Payment Due Soon',
          message: 'Payment of ₹5,000 from John Doe is due in 3 days',
          customerName: 'John Doe',
          amount: 5000,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium' as const,
          autoClose: true,
          autoCloseDelay: 5000,
          soundType: soundType
        },
        overdue: {
          type: 'overdue' as const,
          title: 'Payment Overdue',
          message: 'Payment of ₹10,000 from Jane Smith is overdue by 5 days',
          customerName: 'Jane Smith',
          amount: 10000,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent' as const,
          autoClose: false,
          soundType: soundType
        },
        payment_received: {
          type: 'payment_received' as const,
          title: 'Payment Received',
          message: 'Payment of ₹2,500 received from Mike Johnson',
          customerName: 'Mike Johnson',
          amount: 2500,
          priority: 'low' as const,
          autoClose: true,
          autoCloseDelay: 3000,
          soundType: soundType
        },
        info: {
          type: 'info' as const,
          title: 'System Update',
          message: 'Your data has been successfully backed up',
          priority: 'low' as const,
          autoClose: true,
          autoCloseDelay: 4000,
          soundType: soundType
        }
      };

      // Ensure popup plays sound (not silent)
      const payload = { ...notifications[type], silent: false };
      (window as any).addNotification(payload);
    }
  };

  // Function to test sound directly without notification
  const testSound = async () => {
    await audioService.playNotificationSound(soundType);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Notification Test</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Test the notification system by clicking the buttons below. Notifications will appear in the top-right corner.
      </p>

      {/* Sound selection */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Sound Type</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundType('notification')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              soundType === 'notification' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setSoundType('urgent')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              soundType === 'urgent' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Urgent
          </button>
          <button
            onClick={() => setSoundType('reminder')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              soundType === 'reminder' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Reminder
          </button>
          <button
            onClick={testSound}
            className="ml-auto px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Test Sound Only
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => testNotification('due_soon')}
          className="flex items-center gap-2 p-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors"
        >
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Due Soon</span>
        </button>

        <button
          onClick={() => testNotification('overdue')}
          className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">Overdue</span>
        </button>

        <button
          onClick={() => testNotification('payment_received')}
          className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Payment Received</span>
        </button>

        <button
          onClick={() => testNotification('info')}
          className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
        >
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Info</span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> The notification system automatically checks for due dates every 30 minutes. 
          You can also manually trigger a check by refreshing the page or navigating between sections.
        </p>
      </div>
    </div>
  );
};

export default NotificationTest;

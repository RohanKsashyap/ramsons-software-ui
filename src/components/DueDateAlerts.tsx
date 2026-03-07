import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';
import { audioService } from '../services/audioService';

import type { Customer } from '../types';

interface DueDateAlert {
  id: string;
  customerName: string;
  amount: number;
  originalAmount?: number;
  dueDate: string;
  alertType: 'overdue' | 'due_soon';
  daysUntilDue?: number;
  daysOverdue?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer?: Pick<Customer, 'name' | 'phone' | 'balance' | 'totalCredit' | 'totalPaid'>;
}

export const DueDateAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<DueDateAlert[]>([]);
  const [previousAlerts, setPreviousAlerts] = useState<DueDateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.transactions.getDueDateAlerts();
      if (response && response.success) {
        const newAlerts = response.data;
        setAlerts(newAlerts);

        // Play notification sounds for new alerts
        if (newAlerts.length > 0 && hasNewAlerts(previousAlerts, newAlerts)) {
          await playNotificationSounds(newAlerts);
        }

        setPreviousAlerts(newAlerts);
      } else {
        setError('Failed to fetch due date alerts');
      }
    } catch (err) {
      setError('Error fetching due date alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasNewAlerts = (prevAlerts: DueDateAlert[], newAlerts: DueDateAlert[]): boolean => {
    if (prevAlerts.length === 0 && newAlerts.length > 0) {
      // Initial load with alerts
      return true;
    }

    if (newAlerts.length > prevAlerts.length) {
      // More alerts than before
      return true;
    }

    // Check for higher priority alerts
    const getHighestPriority = (alerts: DueDateAlert[]) => {
      if (alerts.length === 0) return 'low';
      const priorities = alerts.map(alert => alert.priority);
      const priorityOrder = ['urgent', 'high', 'medium', 'low'];
      return priorities.reduce((highest, current) => {
        const highestIndex = priorityOrder.indexOf(highest);
        const currentIndex = priorityOrder.indexOf(current);
        return currentIndex < highestIndex ? current : highest;
      }, 'low');
    };

    const prevHighest = getHighestPriority(prevAlerts);
    const newHighest = getHighestPriority(newAlerts);

    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    return priorityOrder.indexOf(newHighest) < priorityOrder.indexOf(prevHighest);
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAmountLabel = (alert: DueDateAlert) => {
    const balance = alert.amount;
    const original = alert.originalAmount ?? alert.amount;

    if (Math.abs(balance - original) < 0.01) {
      return `${formatAmount(balance)} ${alert.alertType === 'overdue' ? 'overdue' : 'due'}`;
    }

    return `${formatAmount(balance)} balance of ${formatAmount(original)}`;
  };

  const playNotificationSounds = async (alerts: DueDateAlert[]) => {
    if (alerts.length === 0) return;

    // Determine the highest priority alert
    const priorities = alerts.map(alert => alert.priority);
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    const highestPriority = priorities.reduce((highest, current) => {
      const highestIndex = priorityOrder.indexOf(highest);
      const currentIndex = priorityOrder.indexOf(current);
      return currentIndex < highestIndex ? current : highest;
    }, 'low');

    try {
      switch (highestPriority) {
        case 'urgent':
          await audioService.playNotificationSound('urgent');
          break;
        case 'high':
          await audioService.playNotificationSound('urgent');
          break;
        case 'medium':
          await audioService.playNotificationSound('reminder');
          break;
        case 'low':
        default:
          await audioService.playNotificationSound('notification');
          break;
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    if (alertType === 'overdue') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getAlertMessage = (alert: DueDateAlert) => {
    if (alert.alertType === 'overdue') {
      return `Overdue by ${alert.daysOverdue} day${alert.daysOverdue === 1 ? '' : 's'}`;
    } else if (alert.daysUntilDue === 0) {
      return 'Due today';
    } else {
      return `Due in ${alert.daysUntilDue} day${alert.daysUntilDue === 1 ? '' : 's'}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Due Date Alerts
          </h3>
          <button
            onClick={fetchAlerts}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No due date alerts</p>
            <p className="text-sm text-gray-400 mt-1">All payments are up to date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.alertType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {alert.customerName}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(alert.priority)}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {getAmountLabel(alert)} • Due {formatDate(alert.dueDate)}
                      </p>
                      
                      <p className="text-sm font-medium">
                        {getAlertMessage(alert)}
                      </p>
                      
                      {alert.customer?.phone && (
                        <p className="text-xs text-gray-500 mt-1">
                          📞 {alert.customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      window.location.href = `#/transactions?highlight=${alert.id}`;
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View transaction"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DueDateAlerts;

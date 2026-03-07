import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Clock, CheckCircle, Info } from 'lucide-react';
import { audioService } from '../services/audioService';

export interface NotificationData {
  id: string;
  type: 'due_soon' | 'overdue' | 'payment_received' | 'info';
  title: string;
  message: string;
  customerName?: string;
  amount?: number;
  dueDate?: string;
  transactionId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  autoClose?: boolean;
  autoCloseDelay?: number;
  // Optional sound controls for popup
  silent?: boolean; // if true, do not auto-play sound on popup
  soundType?: 'notification' | 'urgent' | 'reminder' | 'custom';
  soundUrl?: string;
}

interface NotificationToastProps {
  notification: NotificationData;
  onClose: (id: string) => void;
  onAction?: (notification: NotificationData) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show notification with animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Play sound on popup unless marked silent
    const playOnShow = async () => {
      if (!notification.silent) {
        const type = notification.soundType ||
          (notification.priority === 'urgent' ? 'urgent'
            : notification.priority === 'high' ? 'urgent'
            : notification.priority === 'medium' ? 'reminder'
            : 'notification');
        await audioService.playNotificationSound(type, notification.soundUrl);
      }
    };
    playOnShow();
    
    // Auto-close if enabled
    if (notification.autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, notification.autoCloseDelay || 5000);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(showTimer);
  }, [notification.autoClose, notification.autoCloseDelay, notification.priority, notification.silent, notification.soundType, notification.soundUrl]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'due_soon':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'payment_received':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

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

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isClosing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          border-l-4 rounded-lg shadow-lg p-4
          ${getPriorityStyles()}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              
              <p className="text-sm text-gray-700 mb-2">
                {notification.message}
              </p>
              
              {notification.customerName && (
                <p className="text-xs text-gray-600 mb-1">
                  Customer: <span className="font-medium">{notification.customerName}</span>
                </p>
              )}
              
              {notification.amount && (
                <p className="text-xs text-gray-600 mb-1">
                  Amount: <span className="font-medium">{formatAmount(notification.amount)}</span>
                </p>
              )}
              
              {notification.dueDate && (
                <p className="text-xs text-gray-600 mb-2">
                  Due: <span className="font-medium">{formatDate(notification.dueDate)}</span>
                  {notification.type === 'due_soon' && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      {getDaysUntilDue(notification.dueDate)} days left
                    </span>
                  )}
                </p>
              )}
              
              <div className="flex items-center space-x-2 mt-2">
                {onAction && (
                  <button
                    onClick={handleAction}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                )}
                
                <span className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;

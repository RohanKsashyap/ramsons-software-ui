import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import NotificationToast, { NotificationData } from './NotificationToast';

interface NotificationManagerProps {
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

type ManagedNotification = NotificationData & {
  showInToast?: boolean; // whether the toast popup is visible
  read?: boolean;        // reserved if we introduce mark-as-read later
};

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxNotifications = 5,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<ManagedNotification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Add notification function (kept globally available)
  const addNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const newNotification: ManagedNotification = {
      ...notification as NotificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      autoClose: notification.autoClose ?? true,
      autoCloseDelay: notification.autoCloseDelay ?? 5000,
      // ensure toast shows but list item persists until X is clicked
      showInToast: true,
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });
  }, [maxNotifications]);

  // Remove notification entirely (only via X in the dropdown or Clear All)
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Hide only the toast popup, keep the item in the dropdown list
  const hideToastOnly = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, showInToast: false } : n));
  }, []);

  // Clear all notifications (admin action)
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle notification action navigation (do NOT mark as read/remove)
  const handleNotificationAction = useCallback((notification: NotificationData) => {
    if (notification.transactionId) {
      window.location.href = `#/transactions?highlight=${notification.transactionId}`;
    } else if (notification.customerName) {
      window.location.href = `#/customers?search=${encodeURIComponent(notification.customerName)}`;
    } else {
      // Fallback to dashboard or a generic view if needed
      window.location.href = '#/dashboard';
    }
  }, []);

  // Expose addNotification globally for use in other components/services
  useEffect(() => {
    (window as any).addNotification = addNotification;
    return () => {
      delete (window as any).addNotification;
    };
  }, [addNotification]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4 flex flex-col-reverse items-end';
      case 'bottom-left':
        return 'bottom-4 left-4 flex flex-col-reverse items-start';
      case 'top-right':
      default:
        return 'top-4 right-4 flex flex-col items-end';
    }
  };

  const getDropdownClasses = () => {
    const baseClasses = "absolute w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden";
    if (position.startsWith('bottom')) {
      return `${baseClasses} bottom-full mb-4 ${position.endsWith('right') ? 'right-0' : 'left-0'}`;
    }
    return `${baseClasses} top-full mt-4 ${position.endsWith('right') ? 'right-0' : 'left-0'}`;
  };

  // Unread badge: persist until X is clicked (i.e., item removed)
  const unreadCount = notifications.filter(n => !n.read).length; // currently equals total items

  return (
    <div className={`fixed ${getPositionClasses()} z-50`} ref={containerRef}>
      {/* Notification Bell */}
      <div className="relative order-last">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
          title="Notifications"
        >
          <Bell className="h-6 w-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isExpanded && (
          <div className={getDropdownClasses()}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-2">
                          {/* Small colored dot by type */}
                          {notification.type === 'due_soon' && (
                            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                          )}
                          {notification.type === 'overdue' && (
                            <div className="h-2 w-2 bg-red-500 rounded-full" />
                          )}
                          {notification.type === 'payment_received' && (
                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                          )}
                          {notification.type === 'info' && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.customerName && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.customerName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* X to dismiss from the list (this is the only way to remove/unset the badge) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications (auto-close only hides the toast; list persists) */}
      <div className={`space-y-2 ${position.startsWith('bottom') ? 'mb-4' : 'mt-4'}`}>
        {notifications.filter(n => n.showInToast).slice(0, 3).map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={hideToastOnly}
            onAction={handleNotificationAction}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationManager;
# Improved Notification System

## Overview

The Ramsons Accounting application now includes a comprehensive notification system that provides on-screen alerts when payment due dates are approaching. This system helps users stay on top of their accounts receivable and ensures timely payment collection.

## Features

### 🚨 **On-Screen Notifications**
- **Toast Notifications**: Appear in the top-right corner with smooth animations
- **Priority-Based Styling**: Different colors and styles based on urgency
- **Auto-Close**: Configurable auto-close timing for different notification types
- **Manual Dismiss**: Users can manually close notifications

### 📅 **Due Date Tracking**
- **Automatic Detection**: System automatically detects approaching due dates
- **Configurable Thresholds**: 
  - Urgent: Overdue payments
  - High: Due today
  - Medium: Due in 1-3 days
  - Low: Due in 4-7 days
- **Real-time Updates**: Checks every 30 minutes for new alerts

### 🔔 **Notification Types**
1. **Due Soon**: Payments approaching their due date
2. **Overdue**: Payments that have passed their due date
3. **Payment Received**: Confirmation of received payments
4. **Info**: General system notifications

### 📊 **Dashboard Integration**
- **Due Date Alerts Panel**: Shows all current alerts in the dashboard
- **Quick Actions**: Direct links to view transaction details
- **Priority Indicators**: Visual priority levels for easy identification

## Technical Implementation

### Frontend Components

#### `NotificationToast.tsx`
- Individual notification component with animations
- Supports different notification types and priorities
- Auto-close functionality with configurable timing
- Action buttons for user interaction

#### `NotificationManager.tsx`
- Manages multiple notifications
- Notification bell with unread count
- Dropdown list of all notifications
- Global notification API

#### `DueDateAlerts.tsx`
- Dashboard component showing due date alerts
- Real-time data fetching
- Priority-based styling
- Direct navigation to transactions

#### `dueDateNotificationService.ts`
- Background service for due date monitoring
- API integration for fetching alerts
- Configurable notification thresholds
- Automatic periodic checking

### Backend Services

#### Enhanced Transaction Service
- `getDueDateAlerts()`: Fetches all due date alerts
- `getTransactionsDueSoon()`: Gets transactions due within specified days
- `getOverdueTransactions()`: Retrieves overdue transactions

#### New API Endpoints
- `GET /api/transactions/due-date-alerts`: Get all due date alerts
- `GET /api/transactions/due-soon?days=7`: Get transactions due soon

### Database Schema Updates

#### Transaction Model
- Added `dueDate` field for tracking payment due dates
- Enhanced status enum to include payment states
- Proper indexing for efficient due date queries

## Configuration

### Notification Thresholds
```typescript
const notificationThresholds = {
  urgent: 0,    // Overdue
  high: 1,      // Due today
  medium: 3,    // Due in 3 days
  low: 7        // Due in 7 days
};
```

### Auto-Close Timing
- **Overdue**: No auto-close (manual dismiss only)
- **Due Today**: 10 seconds
- **Due Soon**: 8 seconds
- **Payment Received**: 3 seconds
- **Info**: 4 seconds

## Usage

### For Users

1. **Viewing Alerts**: 
   - Check the notification bell in the top-right corner
   - View the Due Date Alerts panel on the dashboard
   - Click on alerts to navigate to transaction details

2. **Managing Notifications**:
   - Click the X button to dismiss individual notifications
   - Use "Clear All" to dismiss all notifications
   - Notifications auto-refresh every 5 minutes

### For Developers

1. **Adding New Notifications**:
```typescript
// Global notification API
window.addNotification({
  type: 'due_soon',
  title: 'Payment Due Soon',
  message: 'Payment of ₹5,000 from John Doe is due in 3 days',
  customerName: 'John Doe',
  amount: 5000,
  dueDate: '2024-01-15',
  priority: 'medium',
  autoClose: true,
  autoCloseDelay: 5000
});
```

2. **Testing Notifications**:
   - Use the Notification Test component on the dashboard
   - Test different notification types and priorities
   - Verify auto-close timing and manual dismiss functionality

## Benefits

### For Business Users
- **Proactive Management**: Get notified before payments become overdue
- **Reduced Overdue Accounts**: Timely reminders help maintain cash flow
- **Better Customer Relations**: Follow up on payments before they become problematic
- **Visual Priority System**: Quickly identify which payments need immediate attention

### For System Administrators
- **Configurable Thresholds**: Adjust notification timing based on business needs
- **Comprehensive Logging**: Track notification delivery and user interactions
- **Scalable Architecture**: System can handle large numbers of transactions
- **Real-time Updates**: Immediate notification of new due date alerts

## Future Enhancements

### Planned Features
- **Email Notifications**: Send email alerts for critical overdue payments
- **SMS Integration**: Text message notifications for urgent alerts
- **Custom Notification Rules**: User-defined notification criteria
- **Notification History**: Track all sent notifications
- **Bulk Actions**: Mark multiple notifications as read/dismissed
- **Sound Customization**: Different sounds for different notification types

### Technical Improvements
- **WebSocket Integration**: Real-time push notifications
- **Offline Support**: Queue notifications when offline
- **Mobile Responsiveness**: Optimized for mobile devices
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance Optimization**: Efficient handling of large datasets

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**:
   - Check browser notification permissions
   - Verify API endpoints are accessible
   - Check console for JavaScript errors

2. **Incorrect Due Date Alerts**:
   - Verify transaction due dates are properly set
   - Check notification thresholds configuration
   - Ensure database queries are returning correct data

3. **Performance Issues**:
   - Monitor notification frequency
   - Check for memory leaks in notification components
   - Optimize database queries for large datasets

### Debug Mode
Enable debug logging by setting `localStorage.setItem('debug-notifications', 'true')` in the browser console.

## Conclusion

The improved notification system provides a robust, user-friendly solution for managing payment due dates and maintaining healthy cash flow. With its comprehensive feature set and flexible configuration options, it helps businesses stay on top of their accounts receivable while providing a smooth user experience.

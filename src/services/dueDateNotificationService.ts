import { apiService } from './api';
import { audioService } from './audioService';
import { Transaction } from '../types';

export interface DueDateAlert {
  transactionId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class DueDateNotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date | null = null;
  private notificationThresholds = {
    urgent: 0, // Overdue
    high: 1,   // Due today
    medium: 3, // Due in 3 days
    low: 7     // Due in 7 days
  };

  constructor() {
    this.startPeriodicCheck();
  }

  // Start periodic checking for due dates
  startPeriodicCheck() {
    // Check every 5 minutes for more responsive notifications
    this.checkInterval = setInterval(() => {
      this.checkDueDates();
    }, 5 * 60 * 1000);

    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkDueDates();
    }, 5000);
  }

  // Stop periodic checking
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for approaching due dates
  async checkDueDates() {
    try {
      const response = await apiService.transactions.getDueDateAlerts();
      if (response && response.success) {
        const alerts = response.data;
        
        // Show notifications for alerts
        alerts.forEach(alert => {
          this.showNotification(alert);
        });

        this.lastCheckTime = new Date();
      }
    } catch (error) {
      console.error('Error checking due dates:', error);
    }
  }

  // Analyze transactions for due date alerts
  private analyzeTransactions(transactions: Transaction[]): DueDateAlert[] {
    const today = new Date();
    const alerts: DueDateAlert[] = [];

    transactions.forEach(transaction => {
      // Only check transactions with due dates and unpaid status
      if (!transaction.dueDate || transaction.status === 'completed' || transaction.status === 'paid') {
        return;
      }

      const dueDate = new Date(transaction.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if we should alert for this transaction
      if (this.shouldAlert(daysUntilDue)) {
        const alert: DueDateAlert = {
          transactionId: transaction._id,
          customerName: this.getCustomerName(transaction),
          amount: transaction.amount,
          dueDate: transaction.dueDate,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
          priority: this.getPriority(daysUntilDue)
        };

        alerts.push(alert);
      }
    });

    return alerts;
  }

  // Determine if we should show an alert for this transaction
  private shouldAlert(daysUntilDue: number): boolean {
    return daysUntilDue <= this.notificationThresholds.low;
  }

  // Get priority level based on days until due
  private getPriority(daysUntilDue: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (daysUntilDue < 0) return 'urgent';
    if (daysUntilDue === 0) return 'high';
    if (daysUntilDue <= 3) return 'medium';
    return 'low';
  }

  // Get customer name from transaction
  private getCustomerName(transaction: Transaction): string {
    // Safely handle cases where customerId may be null or not populated
    const customerIdObj = (transaction as any).customerId;
    if (customerIdObj && typeof customerIdObj === 'object' && 'name' in customerIdObj && (customerIdObj as any).name) {
      return (customerIdObj as any).name as string;
    }
    if (transaction.customer?.name) {
      return transaction.customer.name;
    }
    if ((transaction as any).customerName) {
      return (transaction as any).customerName as string;
    }
    return 'Unknown Customer';
  }

  // Show notification for due date alert
  private async showNotification(alert: any) {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      const notification = this.createNotification(alert);
      (window as any).addNotification(notification);
      // Play sound immediately for due date alerts
      await this.playNotificationSound(alert);
    }
  }

  // Play appropriate sound based on alert priority
  private async playNotificationSound(alert: any) {
    try {
      const priority = alert.priority || 'low';
      
      switch (priority) {
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
  }

  // Create notification object
  private createNotification(alert: any) {
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

    const customerName = alert.customer?.name || alert.customerName || 'Unknown Customer';
    const amount = parseFloat(alert.amount);
    const dueDate = alert.dueDate;

    if (alert.alertType === 'overdue') {
      return {
        type: 'overdue' as const,
        title: 'Payment Overdue',
        message: `Payment of ${formatAmount(amount)} from ${customerName} is overdue since ${formatDate(dueDate)}`,
        customerName,
        amount,
        dueDate,
        transactionId: alert.id,
        priority: alert.priority || 'urgent',
        autoClose: false, // Don't auto-close overdue notifications
        autoCloseDelay: 0,
        silent: true // sound already played by service
      };
    } else if (alert.alertType === 'due_soon') {
      if (alert.daysUntilDue === 0) {
        return {
          type: 'due_soon' as const,
          title: 'Payment Due Today',
          message: `Payment of ${formatAmount(amount)} from ${customerName} is due today`,
          customerName,
          amount,
          dueDate,
          transactionId: alert.id,
          priority: alert.priority || 'high',
          autoClose: true,
          autoCloseDelay: 10000, // 10 seconds for due today
          silent: true // sound already played by service
        };
      } else {
        return {
          type: 'due_soon' as const,
          title: 'Payment Due Soon',
          message: `Payment of ${formatAmount(amount)} from ${customerName} is due in ${alert.daysUntilDue} day${alert.daysUntilDue === 1 ? '' : 's'}`,
          customerName,
          amount,
          dueDate,
          transactionId: alert.id,
          priority: alert.priority || 'medium',
          autoClose: true,
          autoCloseDelay: 8000, // 8 seconds for due soon
          silent: true // sound already played by service
        };
      }
    }

    // Fallback for unknown alert types
    return {
      type: 'info' as const,
      title: 'Transaction Alert',
      message: `Transaction for ${customerName}`,
      customerName,
      amount,
      dueDate,
      transactionId: alert.id,
      priority: 'low',
      autoClose: true,
      autoCloseDelay: 5000
    };
  }

  // Manual check for due dates (can be called from UI)
  async manualCheck() {
    await this.checkDueDates();
  }

  // Update notification thresholds
  updateThresholds(thresholds: Partial<typeof this.notificationThresholds>) {
    this.notificationThresholds = { ...this.notificationThresholds, ...thresholds };
  }

  // Get current thresholds
  getThresholds() {
    return { ...this.notificationThresholds };
  }

  // Get last check time
  getLastCheckTime() {
    return this.lastCheckTime;
  }
}

// Export singleton instance
export const dueDateNotificationService = new DueDateNotificationService();
export default dueDateNotificationService;

import { apiService } from './api';
import { audioService } from './audioService';

interface NotificationRule {
  id: string;
  name: string;
  type: 'overdue' | 'reminder' | 'followup';
  enabled: boolean;
  conditions: {
    daysOverdue?: number;
    balanceThreshold?: number;
  };
  actions: {
    notification: boolean;
    email: boolean;
    sms: boolean;
  };
  sound: {
    enabled: boolean;
    type: 'notification' | 'urgent' | 'reminder' | 'custom';
    volume: number;
    customUrl?: string;
  };
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM (24h)
    days?: number[]; // For weekly: 0-6 (Sun-Sat). For monthly: 1-31 (optional)
  };
  message: {
    title: string;
    body: string;
  };
  lastRun?: string;
}

class BackgroundNotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCheckTime: Date | null = null;

  constructor() {
    this.start();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting background notification service...');
    
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkNotifications();
    }, 5 * 60 * 1000);

    // Initial check after 10 seconds
    setTimeout(() => {
      this.checkNotifications();
    }, 10000);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Background notification service stopped');
  }

  private async checkNotifications() {
    try {
      console.log('Checking for notifications...');
      
      // Get active notification rules
      const rules = await apiService.notifications.getRules();
      const activeRules = rules.filter((rule: NotificationRule) => rule.enabled);
      
      if (activeRules.length === 0) {
        console.log('No active notification rules found');
        return;
      }

      // Check each rule
      for (const rule of activeRules) {
        await this.executeRule(rule);
      }

      this.lastCheckTime = new Date();
      console.log(`Notification check completed at ${this.lastCheckTime.toISOString()}`);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  private async executeRule(rule: NotificationRule) {
    try {
      // Check if rule should run based on schedule
      if (!this.shouldRunRule(rule)) {
        return;
      }

      // Get due date alerts
      const alertsResponse = await apiService.transactions.getDueDateAlerts();
      if (!alertsResponse || !alertsResponse.success) {
        return;
      }

      const alerts = alertsResponse.data;
      const matchingAlerts = this.filterAlertsByRule(alerts, rule);

      if (matchingAlerts.length > 0) {
        await this.showNotifications(rule, matchingAlerts);
        
        // Update last run time
        await apiService.notifications.updateRule(rule.id, {
          lastRun: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Error executing rule ${rule.name}:`, error);
    }
  }

  private shouldRunRule(rule: NotificationRule): boolean {
    const now = new Date();
    const lastRun = rule.lastRun ? new Date(rule.lastRun) : null;

    // Check frequency
    switch (rule.schedule.frequency) {
      case 'daily':
        if (lastRun && lastRun.toDateString() === now.toDateString()) {
          return false;
        }
        break;
      case 'weekly':
        if (lastRun && (now.getTime() - lastRun.getTime()) < 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
        break;
      case 'monthly':
        if (lastRun && (now.getTime() - lastRun.getTime()) < 30 * 24 * 60 * 60 * 1000) {
          return false;
        }
        break;
    }

    // Respect schedule days for weekly/monthly
    if (rule.schedule.frequency === 'weekly' && Array.isArray(rule.schedule.days) && rule.schedule.days.length > 0) {
      const todayDow = now.getDay(); // 0-6 Sun-Sat
      if (!rule.schedule.days.includes(todayDow)) {
        return false;
      }
    }
    if (rule.schedule.frequency === 'monthly' && Array.isArray(rule.schedule.days) && rule.schedule.days.length > 0) {
      const todayDom = now.getDate(); // 1-31
      if (!rule.schedule.days.includes(todayDom)) {
        return false;
      }
    }

    // Check time
    const [ruleHour, ruleMinute] = rule.schedule.time.split(':').map(n => parseInt(n, 10));
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Allow some tolerance (within 5 minutes)
    const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (ruleHour * 60 + ruleMinute));
    return timeDiff <= 5;
  }

  private filterAlertsByRule(alerts: any[], rule: NotificationRule): any[] {
    return alerts.filter(alert => {
      // Check days overdue condition
      if (rule.conditions.daysOverdue !== undefined) {
        if (rule.type === 'overdue') {
          return alert.alertType === 'overdue' && 
                 alert.daysOverdue >= rule.conditions.daysOverdue;
        } else if (rule.type === 'reminder') {
          return alert.alertType === 'due_soon' && 
                 alert.daysUntilDue <= rule.conditions.daysOverdue;
        }
      }

      // Check balance threshold condition
      if (rule.conditions.balanceThreshold !== undefined) {
        return alert.amount >= rule.conditions.balanceThreshold;
      }

      // Default: show all alerts for this rule type
      return true;
    });
  }

  private async showNotifications(rule: NotificationRule, alerts: any[]) {
    for (const alert of alerts) {
      // Show desktop notification
      if (rule.actions.notification && 'Notification' in window) {
        this.showDesktopNotification(rule, alert);
      }

      // Play sound notification
      if (rule.sound.enabled) {
        await this.playNotificationSound(rule.sound, alert);
      }
    }
  }

  private showDesktopNotification(rule: NotificationRule, alert: any) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(rule.message.title, {
        body: this.formatMessage(rule.message.body, alert),
        icon: '/icon.png',
        tag: `notification-${rule.id}-${alert.id}`,
        requireInteraction: rule.type === 'overdue'
      });

      // Auto-close after 5 seconds for non-overdue notifications
      if (rule.type !== 'overdue') {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    }
  }

  private async playNotificationSound(soundConfig: NotificationRule['sound'], alert: any) {
    try {
      const soundType = this.getSoundTypeForAlert(alert, soundConfig.type);
      await audioService.playNotificationSound(soundType, soundConfig.customUrl);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  private getSoundTypeForAlert(alert: any, defaultType: string): 'notification' | 'urgent' | 'reminder' | 'custom' {
    if (alert.priority === 'urgent' || alert.alertType === 'overdue') {
      return 'urgent';
    } else if (alert.priority === 'high' || alert.alertType === 'due_soon') {
      return 'urgent';
    } else if (alert.priority === 'medium') {
      return 'reminder';
    } else {
      return defaultType as any;
    }
  }

  private formatMessage(message: string, alert: any): string {
    return message
      .replace('{customerName}', alert.customer?.name || alert.customerName || 'Unknown Customer')
      .replace('{amount}', new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(alert.amount))
      .replace('{dueDate}', new Date(alert.dueDate).toLocaleDateString())
      .replace('{daysOverdue}', alert.daysOverdue || 0)
      .replace('{daysUntilDue}', alert.daysUntilDue || 0);
  }

  // Manual check (can be called from UI)
  async manualCheck() {
    await this.checkNotifications();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime
    };
  }
}

// Export singleton instance
export const backgroundNotificationService = new BackgroundNotificationService();
export default backgroundNotificationService;

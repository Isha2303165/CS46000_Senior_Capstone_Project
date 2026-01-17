import { logSystemEvent } from './cloudwatch-logger';

export interface SystemAlert {
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  source: string;
  metadata?: Record<string, any>;
  requiresImmedateAction?: boolean;
}

export interface AlertSubscription {
  id: string;
  userId: string;
  alertTypes: string[];
  channels: ('email' | 'sms' | 'push')[];
  isActive: boolean;
}

class SystemAlertService {
  private subscribers: AlertSubscription[] = [];
  private alertHistory: (SystemAlert & { id: string; timestamp: string })[] = [];

  constructor() {
    this.loadSubscriptions();
    this.loadAlertHistory();
  }

  async sendAlert(alert: SystemAlert): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Store alert in history
    const alertWithMetadata = {
      ...alert,
      id: alertId,
      timestamp,
    };
    
    this.alertHistory.unshift(alertWithMetadata);
    
    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(0, 1000);
    }
    
    this.saveAlertHistory();

    // Log to CloudWatch
    await logSystemEvent({
      type: alert.type === 'critical' ? 'error' : alert.type,
      message: `${alert.title}: ${alert.message}`,
      timestamp,
      metadata: {
        source: alert.source,
        alertId,
        ...alert.metadata,
      },
    });

    // Send to SNS for critical alerts or if subscribers exist
    if (alert.type === 'critical' || alert.requiresImmedateAction) {
      await this.sendSNSAlert(alertWithMetadata);
    }

    // Notify active subscribers
    await this.notifySubscribers(alertWithMetadata);
  }

  private async sendSNSAlert(alert: SystemAlert & { id: string; timestamp: string }): Promise<void> {
    try {
      const snsMessage = {
        subject: `Healthcare App Alert: ${alert.title}`,
        message: `
Alert Details:
- Type: ${alert.type.toUpperCase()}
- Source: ${alert.source}
- Time: ${alert.timestamp}
- Alert ID: ${alert.id}

Message: ${alert.message}

${alert.metadata ? `Additional Info: ${JSON.stringify(alert.metadata, null, 2)}` : ''}

${alert.requiresImmedateAction ? 'IMMEDIATE ACTION REQUIRED' : ''}
        `,
        alertType: alert.type,
        alertId: alert.id,
      };

      // In production, this would call AWS SNS
      const response = await fetch('/api/sns/system-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snsMessage),
      });

      if (!response.ok) {
        console.error('Failed to send SNS alert:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending SNS alert:', error);
    }
  }

  private async notifySubscribers(alert: SystemAlert & { id: string; timestamp: string }): Promise<void> {
    const relevantSubscribers = this.subscribers.filter(sub => 
      sub.isActive && 
      (sub.alertTypes.includes(alert.type) || sub.alertTypes.includes('all'))
    );

    for (const subscriber of relevantSubscribers) {
      try {
        await this.sendNotificationToSubscriber(subscriber, alert);
      } catch (error) {
        console.error(`Failed to notify subscriber ${subscriber.id}:`, error);
      }
    }
  }

  private async sendNotificationToSubscriber(
    subscriber: AlertSubscription,
    alert: SystemAlert & { id: string; timestamp: string }
  ): Promise<void> {
    // Send notifications through selected channels
    for (const channel of subscriber.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(subscriber.userId, alert);
            break;
          case 'sms':
            await this.sendSMSNotification(subscriber.userId, alert);
            break;
          case 'push':
            await this.sendPushNotification(subscriber.userId, alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendEmailNotification(userId: string, alert: SystemAlert & { id: string; timestamp: string }): Promise<void> {
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subject: `Healthcare App Alert: ${alert.title}`,
        message: alert.message,
        alertType: alert.type,
        alertId: alert.id,
      }),
    });
  }

  private async sendSMSNotification(userId: string, alert: SystemAlert & { id: string; timestamp: string }): Promise<void> {
    await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: `Healthcare App Alert: ${alert.title} - ${alert.message}`,
        alertType: alert.type,
        alertId: alert.id,
      }),
    });
  }

  private async sendPushNotification(userId: string, alert: SystemAlert & { id: string; timestamp: string }): Promise<void> {
    await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: alert.title,
        message: alert.message,
        alertType: alert.type,
        alertId: alert.id,
      }),
    });
  }

  // Subscription management
  subscribe(subscription: Omit<AlertSubscription, 'id'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSubscription: AlertSubscription = { ...subscription, id };
    
    this.subscribers.push(newSubscription);
    this.saveSubscriptions();
    
    return id;
  }

  unsubscribe(subscriptionId: string): boolean {
    const index = this.subscribers.findIndex(sub => sub.id === subscriptionId);
    if (index !== -1) {
      this.subscribers.splice(index, 1);
      this.saveSubscriptions();
      return true;
    }
    return false;
  }

  updateSubscription(subscriptionId: string, updates: Partial<AlertSubscription>): boolean {
    const subscription = this.subscribers.find(sub => sub.id === subscriptionId);
    if (subscription) {
      Object.assign(subscription, updates);
      this.saveSubscriptions();
      return true;
    }
    return false;
  }

  getUserSubscriptions(userId: string): AlertSubscription[] {
    return this.subscribers.filter(sub => sub.userId === userId);
  }

  // Alert history
  getAlertHistory(limit = 50): (SystemAlert & { id: string; timestamp: string })[] {
    return this.alertHistory.slice(0, limit);
  }

  getAlertsByType(type: string, limit = 50): (SystemAlert & { id: string; timestamp: string })[] {
    return this.alertHistory
      .filter(alert => alert.type === type)
      .slice(0, limit);
  }

  // Persistence
  private loadSubscriptions(): void {
    try {
      const stored = localStorage.getItem('healthcare_app_alert_subscriptions');
      if (stored) {
        this.subscribers = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load alert subscriptions:', error);
    }
  }

  private saveSubscriptions(): void {
    try {
      localStorage.setItem('healthcare_app_alert_subscriptions', JSON.stringify(this.subscribers));
    } catch (error) {
      console.error('Failed to save alert subscriptions:', error);
    }
  }

  private loadAlertHistory(): void {
    try {
      const stored = localStorage.getItem('healthcare_app_alert_history');
      if (stored) {
        this.alertHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load alert history:', error);
    }
  }

  private saveAlertHistory(): void {
    try {
      localStorage.setItem('healthcare_app_alert_history', JSON.stringify(this.alertHistory));
    } catch (error) {
      console.error('Failed to save alert history:', error);
    }
  }
}

// Create singleton instance
const systemAlertService = new SystemAlertService();

// Export convenience functions
export const sendSystemAlert = (alert: SystemAlert) => systemAlertService.sendAlert(alert);

export const subscribeToAlerts = (subscription: Omit<AlertSubscription, 'id'>) => 
  systemAlertService.subscribe(subscription);

export const unsubscribeFromAlerts = (subscriptionId: string) => 
  systemAlertService.unsubscribe(subscriptionId);

export const getAlertHistory = (limit?: number) => 
  systemAlertService.getAlertHistory(limit);

export const getUserAlertSubscriptions = (userId: string) => 
  systemAlertService.getUserSubscriptions(userId);

// Export service instance
export { systemAlertService };
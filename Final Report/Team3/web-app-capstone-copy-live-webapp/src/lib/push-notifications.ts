// Push notification service for medication reminders
// This would typically integrate with AWS SNS and Amplify Notifications

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface MedicationReminderNotification {
  medicationId: string;
  medicationName: string;
  dosage: string;
  unit: string;
  clientName: string;
  scheduledTime: string;
  isOverdue?: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      // Service worker successfully registered

      // Request notification permission
      this.permission = await Notification.requestPermission();
      // Notification permission obtained

      return this.permission === 'granted';
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  async sendMedicationReminder(notification: MedicationReminderNotification): Promise<void> {
    if (this.permission !== 'granted' || !this.registration) {
      console.warn('Push notifications not available');
      return;
    }

    const payload: NotificationPayload = {
      title: `${notification.medicationName} Reminder`,
      body: `Time to take ${notification.dosage} ${notification.unit}${
        notification.isOverdue ? ' (Overdue)' : ''
      }`,
      data: {
        medicationId: notification.medicationId,
        type: 'medication_reminder',
        scheduledTime: notification.scheduledTime,
        isOverdue: notification.isOverdue,
      },
      actions: [
        {
          action: 'taken',
          title: 'Mark as Taken',
          icon: '/icons/check.png',
        },
        {
          action: 'snooze',
          title: 'Snooze 15min',
          icon: '/icons/snooze.png',
        },
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png',
        },
      ],
    };

    try {
      // Send notification through service worker
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: '/icons/medication.png',
        badge: '/icons/badge.png',
        tag: `medication-${notification.medicationId}`,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: notification.isOverdue, // Keep overdue notifications visible
        silent: false,
        vibrate: notification.isOverdue ? [200, 100, 200, 100, 200] : [200, 100, 200],
      });

      // In production, also send through AWS SNS for reliability
      await this.sendSNSNotification(notification);
    } catch (error) {
      console.error('Error sending medication reminder:', error);
    }
  }

  async sendUrgentAlert(
    title: string, 
    message: string, 
    data?: Record<string, any>
  ): Promise<void> {
    if (this.permission !== 'granted' || !this.registration) {
      console.warn('Push notifications not available');
      return;
    }

    try {
      await this.registration.showNotification(title, {
        body: message,
        icon: '/icons/urgent.png',
        badge: '/icons/badge.png',
        tag: 'urgent-alert',
        data: { type: 'urgent_alert', ...data },
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300, 100, 300],
      });

      // Send through AWS SNS for critical alerts
      await this.sendSNSAlert(title, message, data);
    } catch (error) {
      console.error('Error sending urgent alert:', error);
    }
  }

  async scheduleMedicationReminders(
    medicationId: string,
    scheduledTimes: string[],
    medicationData: {
      name: string;
      dosage: string;
      unit: string;
      clientName: string;
    }
  ): Promise<void> {
    // This would typically integrate with AWS EventBridge
    // For now, we'll use browser's setTimeout as a demo
    
    for (const time of scheduledTimes) {
      const nextReminderTime = this.calculateNextReminderTime(time);
      const delay = nextReminderTime.getTime() - Date.now();

      if (delay > 0) {
        setTimeout(() => {
          this.sendMedicationReminder({
            medicationId,
            medicationName: medicationData.name,
            dosage: medicationData.dosage,
            unit: medicationData.unit,
            clientName: medicationData.clientName,
            scheduledTime: time,
          });
        }, delay);
      }
    }
  }

  async cancelMedicationReminders(medicationId: string): Promise<void> {
    // Cancel any pending notifications for this medication
    if (this.registration) {
      const notifications = await this.registration.getNotifications({
        tag: `medication-${medicationId}`,
      });

      notifications.forEach(notification => notification.close());
    }
  }

  private calculateNextReminderTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    return reminderTime;
  }

  private async sendSNSNotification(notification: MedicationReminderNotification): Promise<void> {
    // Mock implementation - in production this would use AWS SNS
    // Mock implementation - in production this would send actual SNS notification
    
    // Example AWS SNS integration:
    /*
    const sns = new SNSClient({ region: 'us-east-1' });
    
    const message = {
      default: `${notification.medicationName} reminder`,
      GCM: JSON.stringify({
        data: {
          title: `${notification.medicationName} Reminder`,
          body: `Time to take ${notification.dosage} ${notification.unit}`,
          medicationId: notification.medicationId,
          type: 'medication_reminder',
        },
      }),
      APNS: JSON.stringify({
        aps: {
          alert: {
            title: `${notification.medicationName} Reminder`,
            body: `Time to take ${notification.dosage} ${notification.unit}`,
          },
          badge: 1,
          sound: 'default',
        },
        medicationId: notification.medicationId,
        type: 'medication_reminder',
      }),
    };

    await sns.send(new PublishCommand({
      TopicArn: process.env.MEDICATION_REMINDERS_TOPIC_ARN,
      Message: JSON.stringify(message),
      MessageStructure: 'json',
    }));
    */
  }

  private async sendSNSAlert(
    title: string, 
    message: string, 
    data?: Record<string, any>
  ): Promise<void> {
    // Mock implementation - in production this would use AWS SNS
    // Mock implementation - in production this would send actual SNS alert
    
    // Example AWS SNS integration for urgent alerts
    /*
    const sns = new SNSClient({ region: 'us-east-1' });
    
    await sns.send(new PublishCommand({
      TopicArn: process.env.URGENT_ALERTS_TOPIC_ARN,
      Subject: title,
      Message: message,
      MessageAttributes: {
        type: {
          DataType: 'String',
          StringValue: 'urgent_alert',
        },
        ...Object.entries(data || {}).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: {
            DataType: 'String',
            StringValue: String(value),
          },
        }), {}),
      },
    }));
    */
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// React hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    const initializeNotifications = async () => {
      const supported = await pushNotificationService.initialize();
      setIsSupported(supported);
      setPermission(Notification.permission);
    };

    initializeNotifications();
  }, []);

  const sendMedicationReminder = async (notification: MedicationReminderNotification) => {
    await pushNotificationService.sendMedicationReminder(notification);
  };

  const sendUrgentAlert = async (title: string, message: string, data?: Record<string, any>) => {
    await pushNotificationService.sendUrgentAlert(title, message, data);
  };

  const scheduleMedicationReminders = async (
    medicationId: string,
    scheduledTimes: string[],
    medicationData: {
      name: string;
      dosage: string;
      unit: string;
      clientName: string;
    }
  ) => {
    await pushNotificationService.scheduleMedicationReminders(
      medicationId,
      scheduledTimes,
      medicationData
    );
  };

  const cancelMedicationReminders = async (medicationId: string) => {
    await pushNotificationService.cancelMedicationReminders(medicationId);
  };

  return {
    isSupported,
    permission,
    sendMedicationReminder,
    sendUrgentAlert,
    scheduleMedicationReminders,
    cancelMedicationReminders,
  };
}

// Add React import for the hook
import React from 'react';
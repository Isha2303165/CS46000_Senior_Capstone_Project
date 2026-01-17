import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  sendSystemAlert, 
  subscribeToAlerts, 
  unsubscribeFromAlerts, 
  getAlertHistory,
  getUserAlertSubscriptions,
  systemAlertService 
} from '../system-alerts';
import * as cloudWatchLogger from '../cloudwatch-logger';

// Mock dependencies
vi.mock('../cloudwatch-logger', () => ({
  logSystemEvent: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('SystemAlertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendSystemAlert', () => {
    it('sends alert and logs to CloudWatch', async () => {
      const mockLogSystemEvent = vi.mocked(cloudWatchLogger.logSystemEvent);
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const alert = {
        type: 'error' as const,
        title: 'Test Alert',
        message: 'Test alert message',
        source: 'Test Source',
      };

      await sendSystemAlert(alert);

      expect(mockLogSystemEvent).toHaveBeenCalledWith({
        type: 'error',
        message: 'Test Alert: Test alert message',
        timestamp: expect.any(String),
        metadata: expect.objectContaining({
          source: 'Test Source',
          alertId: expect.any(String),
        }),
      });
    });

    it('sends SNS alert for critical alerts', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const alert = {
        type: 'critical' as const,
        title: 'Critical Alert',
        message: 'Critical alert message',
        source: 'Critical Source',
      };

      await sendSystemAlert(alert);

      expect(mockFetch).toHaveBeenCalledWith('/api/sns/system-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Critical Alert'),
      });
    });

    it('sends SNS alert for alerts requiring immediate action', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const alert = {
        type: 'warning' as const,
        title: 'Urgent Alert',
        message: 'Urgent alert message',
        source: 'Urgent Source',
        requiresImmedateAction: true,
      };

      await sendSystemAlert(alert);

      expect(mockFetch).toHaveBeenCalledWith('/api/sns/system-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('IMMEDIATE ACTION REQUIRED'),
      });
    });

    it('stores alert in history', async () => {
      const alert = {
        type: 'info' as const,
        title: 'Info Alert',
        message: 'Info alert message',
        source: 'Info Source',
      };

      await sendSystemAlert(alert);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'healthcare_app_alert_history',
        expect.stringContaining('Info Alert')
      );
    });

    it('limits alert history to 1000 entries', async () => {
      // Create 1005 existing alerts
      const existingAlerts = Array.from({ length: 1005 }, (_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        message: `Message ${i}`,
        type: 'info',
        source: 'Test',
        timestamp: new Date().toISOString(),
      }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingAlerts));

      const alert = {
        type: 'info' as const,
        title: 'New Alert',
        message: 'New alert message',
        source: 'Test Source',
      };

      await sendSystemAlert(alert);

      const setItemCall = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'healthcare_app_alert_history'
      );
      const storedAlerts = JSON.parse(setItemCall![1]);
      
      expect(storedAlerts).toHaveLength(1000);
      expect(storedAlerts[0].title).toBe('New Alert'); // New alert should be first
    });

    it('notifies subscribers', async () => {
      // Set up a subscriber
      const subscription = {
        userId: 'user123',
        alertTypes: ['error'],
        channels: ['email' as const],
        isActive: true,
      };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'healthcare_app_alert_subscriptions') {
          return JSON.stringify([{ ...subscription, id: 'sub1' }]);
        }
        return '[]';
      });

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const alert = {
        type: 'error' as const,
        title: 'Error Alert',
        message: 'Error alert message',
        source: 'Error Source',
      };

      await sendSystemAlert(alert);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('user123'),
      });
    });

    it('handles SNS errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('SNS Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const alert = {
        type: 'critical' as const,
        title: 'Critical Alert',
        message: 'Critical alert message',
        source: 'Critical Source',
      };

      await sendSystemAlert(alert);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sending SNS alert:',
        expect.any(Error)
      );
    });
  });

  describe('subscription management', () => {
    it('creates new subscription', () => {
      const subscription = {
        userId: 'user123',
        alertTypes: ['error', 'critical'],
        channels: ['email' as const, 'sms' as const],
        isActive: true,
      };

      const subscriptionId = subscribeToAlerts(subscription);

      expect(subscriptionId).toMatch(/^sub_\d+_[a-z0-9]+$/);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'healthcare_app_alert_subscriptions',
        expect.stringContaining('user123')
      );
    });

    it('unsubscribes from alerts', () => {
      const existingSubscriptions = [
        { id: 'sub1', userId: 'user123', alertTypes: ['error'], channels: ['email'], isActive: true },
        { id: 'sub2', userId: 'user456', alertTypes: ['warning'], channels: ['sms'], isActive: true },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingSubscriptions));

      const result = unsubscribeFromAlerts('sub1');

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'healthcare_app_alert_subscriptions',
        expect.not.stringContaining('sub1')
      );
    });

    it('returns false when unsubscribing non-existent subscription', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');

      const result = unsubscribeFromAlerts('non-existent');

      expect(result).toBe(false);
    });

    it('gets user subscriptions', () => {
      const subscriptions = [
        { id: 'sub1', userId: 'user123', alertTypes: ['error'], channels: ['email'], isActive: true },
        { id: 'sub2', userId: 'user456', alertTypes: ['warning'], channels: ['sms'], isActive: true },
        { id: 'sub3', userId: 'user123', alertTypes: ['critical'], channels: ['push'], isActive: false },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(subscriptions));

      const userSubscriptions = getUserAlertSubscriptions('user123');

      expect(userSubscriptions).toHaveLength(2);
      expect(userSubscriptions.every(sub => sub.userId === 'user123')).toBe(true);
    });
  });

  describe('alert history', () => {
    it('returns alert history with limit', () => {
      const alerts = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        message: `Message ${i}`,
        type: 'info',
        source: 'Test',
        timestamp: new Date().toISOString(),
      }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(alerts));

      const history = getAlertHistory(10);

      expect(history).toHaveLength(10);
    });

    it('returns all alerts when no limit specified', () => {
      const alerts = Array.from({ length: 25 }, (_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        message: `Message ${i}`,
        type: 'info',
        source: 'Test',
        timestamp: new Date().toISOString(),
      }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(alerts));

      const history = getAlertHistory();

      expect(history).toHaveLength(25);
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const history = getAlertHistory();

      expect(history).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load alert history:',
        expect.any(Error)
      );
    });
  });

  describe('notification channels', () => {
    it('sends email notifications', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const subscription = {
        userId: 'user123',
        alertTypes: ['all'],
        channels: ['email' as const],
        isActive: true,
      };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'healthcare_app_alert_subscriptions') {
          return JSON.stringify([{ ...subscription, id: 'sub1' }]);
        }
        return '[]';
      });

      const alert = {
        type: 'info' as const,
        title: 'Test Alert',
        message: 'Test message',
        source: 'Test',
      };

      await sendSystemAlert(alert);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test Alert'),
      });
    });

    it('sends SMS notifications', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const subscription = {
        userId: 'user123',
        alertTypes: ['warning'],
        channels: ['sms' as const],
        isActive: true,
      };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'healthcare_app_alert_subscriptions') {
          return JSON.stringify([{ ...subscription, id: 'sub1' }]);
        }
        return '[]';
      });

      const alert = {
        type: 'warning' as const,
        title: 'Warning Alert',
        message: 'Warning message',
        source: 'Test',
      };

      await sendSystemAlert(alert);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Warning Alert'),
      });
    });

    it('sends push notifications', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const subscription = {
        userId: 'user123',
        alertTypes: ['error'],
        channels: ['push' as const],
        isActive: true,
      };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'healthcare_app_alert_subscriptions') {
          return JSON.stringify([{ ...subscription, id: 'sub1' }]);
        }
        return '[]';
      });

      const alert = {
        type: 'error' as const,
        title: 'Error Alert',
        message: 'Error message',
        source: 'Test',
      };

      await sendSystemAlert(alert);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Error Alert'),
      });
    });

    it('handles notification failures gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Notification error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const subscription = {
        userId: 'user123',
        alertTypes: ['error'],
        channels: ['email' as const],
        isActive: true,
      };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'healthcare_app_alert_subscriptions') {
          return JSON.stringify([{ ...subscription, id: 'sub1' }]);
        }
        return '[]';
      });

      const alert = {
        type: 'error' as const,
        title: 'Error Alert',
        message: 'Error message',
        source: 'Test',
      };

      await sendSystemAlert(alert);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send email notification:',
        expect.any(Error)
      );
    });
  });
});
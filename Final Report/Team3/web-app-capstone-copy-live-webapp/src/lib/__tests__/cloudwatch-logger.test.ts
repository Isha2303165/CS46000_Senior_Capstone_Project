import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  logErrorToCloudWatch, 
  logSystemEvent, 
  getErrorLogs, 
  clearErrorLogs,
  cloudWatchLogger 
} from '../cloudwatch-logger';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockLocalStorage,
  },
  writable: true,
});

describe('CloudWatchLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logErrorToCloudWatch', () => {
    it('logs error in development mode to console and localStorage', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('[]');

      const errorData = {
        error: new Error('Test error'),
        errorId: 'test-error-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        userAgent: 'test-agent',
        url: 'http://test.com',
        userId: 'user123',
      };

      await logErrorToCloudWatch(errorData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch Error Log:',
        expect.stringContaining('test-error-id')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch Error Log:',
        expect.stringContaining('Test error')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch Error Log:',
        expect.stringContaining('user123')
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'healthcare_app_error_logs',
        expect.stringContaining('test-error-id')
      );
    });

    it('sends to CloudWatch in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const errorData = {
        error: new Error('Production error'),
        errorId: 'prod-error-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        userAgent: 'prod-agent',
        url: 'http://prod.com',
        userId: 'user456',
      };

      await logErrorToCloudWatch(errorData);

      expect(mockFetch).toHaveBeenCalledWith('/api/cloudwatch/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('prod-error-id'),
      });
    });

    it('sends critical alert for critical errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const errorData = {
        error: new Error('Critical error'),
        errorId: 'critical-error-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        userAgent: 'test-agent',
        url: 'http://test.com',
        userId: 'user123',
        severity: 'critical' as const,
      };

      await logErrorToCloudWatch(errorData);

      expect(mockFetch).toHaveBeenCalledWith('/api/sns/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Critical error occurred'),
      });
    });

    it('handles CloudWatch API failures gracefully', async () => {
      process.env.NODE_ENV = 'production';
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('API Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('[]');

      const errorData = {
        error: new Error('Test error'),
        errorId: 'test-error-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        userAgent: 'test-agent',
        url: 'http://test.com',
        userId: 'user123',
      };

      await logErrorToCloudWatch(errorData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch API call failed:',
        expect.any(Error)
      );

      // Should fallback to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('handles localStorage errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorData = {
        error: new Error('Test error'),
        errorId: 'test-error-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        userAgent: 'test-agent',
        url: 'http://test.com',
        userId: 'user123',
      };

      await logErrorToCloudWatch(errorData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store log locally:',
        expect.any(Error)
      );
    });
  });

  describe('logSystemEvent', () => {
    it('logs system event to console in development', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('[]');

      const event = {
        type: 'info' as const,
        message: 'System event',
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: { key: 'value' },
      };

      await logSystemEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch System Event:',
        expect.stringContaining('INFO')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch System Event:',
        expect.stringContaining('System event')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'CloudWatch System Event:',
        expect.stringContaining('key')
      );
    });

    it('sends to CloudWatch in production', async () => {
      process.env.NODE_ENV = 'production';
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const event = {
        type: 'warning' as const,
        message: 'Warning event',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      await logSystemEvent(event);

      expect(mockFetch).toHaveBeenCalledWith('/api/cloudwatch/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('WARNING'),
      });
    });
  });

  describe('getErrorLogs', () => {
    it('returns parsed logs from localStorage', () => {
      const mockLogs = [
        { errorId: 'error1', message: 'Error 1' },
        { errorId: 'error2', message: 'Error 2' },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));

      const logs = getErrorLogs();

      expect(logs).toEqual(mockLogs);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('healthcare_app_error_logs');
    });

    it('returns empty array when no logs exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const logs = getErrorLogs();

      expect(logs).toEqual([]);
    });

    it('returns empty array when localStorage throws error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const logs = getErrorLogs();

      expect(logs).toEqual([]);
    });
  });

  describe('clearErrorLogs', () => {
    it('removes error logs from localStorage', () => {
      clearErrorLogs();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('healthcare_app_error_logs');
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      clearErrorLogs();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear local logs:',
        expect.any(Error)
      );
    });
  });

  describe('log storage management', () => {
    it('limits stored logs to 100 entries', async () => {
      // Create 105 existing logs
      const existingLogs = Array.from({ length: 105 }, (_, i) => ({
        errorId: `error-${i}`,
        message: `Error ${i}`,
      }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingLogs));

      const errorData = {
        error: new Error('New error'),
        errorId: 'new-error-id',
        timestamp: '2023-01-01T00:00:00.000Z',
        userAgent: 'test-agent',
        url: 'http://test.com',
        userId: 'user123',
      };

      await logErrorToCloudWatch(errorData);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const storedLogs = JSON.parse(setItemCall[1]);
      
      expect(storedLogs).toHaveLength(100);
      expect(storedLogs[0].errorId).toBe('new-error-id'); // New log should be first
    });
  });
});
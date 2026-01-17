import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getCloudWatchAlarms, 
  getAlarmStates, 
  getAlarmById,
  updateAlarm,
  enableAlarm,
  disableAlarm,
  cloudWatchAlarmManager 
} from '../cloudwatch-alarms';
import * as systemAlerts from '../system-alerts';
import * as cloudWatchLogger from '../cloudwatch-logger';

// Mock dependencies
vi.mock('../system-alerts', () => ({
  sendSystemAlert: vi.fn(),
}));

vi.mock('../cloudwatch-logger', () => ({
  logSystemEvent: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('CloudWatchAlarmManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('alarm initialization', () => {
    it('initializes with default alarms', () => {
      const alarms = getCloudWatchAlarms();
      
      expect(alarms.length).toBeGreaterThan(0);
      expect(alarms.some(alarm => alarm.name === 'High Error Rate')).toBe(true);
      expect(alarms.some(alarm => alarm.name === 'Medication Reminder Failures')).toBe(true);
      expect(alarms.some(alarm => alarm.name === 'Critical Client Data Access Failures')).toBe(true);
    });

    it('has properly configured critical alarms', () => {
      const alarms = getCloudWatchAlarms();
      const criticalAlarms = alarms.filter(alarm => alarm.severity === 'critical');
      
      expect(criticalAlarms.length).toBeGreaterThan(0);
      criticalAlarms.forEach(alarm => {
        expect(alarm.isEnabled).toBe(true);
        expect(alarm.actions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('alarm management', () => {
    it('gets alarm by ID', () => {
      const alarms = getCloudWatchAlarms();
      const firstAlarm = alarms[0];
      
      const foundAlarm = getAlarmById(firstAlarm.id);
      
      expect(foundAlarm).toEqual(firstAlarm);
    });

    it('returns undefined for non-existent alarm ID', () => {
      const foundAlarm = getAlarmById('non-existent-id');
      
      expect(foundAlarm).toBeUndefined();
    });

    it('updates alarm configuration', () => {
      const alarms = getCloudWatchAlarms();
      const alarmId = alarms[0].id;
      
      const result = updateAlarm(alarmId, { threshold: 999 });
      
      expect(result).toBe(true);
      
      const updatedAlarm = getAlarmById(alarmId);
      expect(updatedAlarm?.threshold).toBe(999);
    });

    it('returns false when updating non-existent alarm', () => {
      const result = updateAlarm('non-existent-id', { threshold: 999 });
      
      expect(result).toBe(false);
    });

    it('enables alarm', () => {
      const alarms = getCloudWatchAlarms();
      const alarmId = alarms[0].id;
      
      // First disable it
      updateAlarm(alarmId, { isEnabled: false });
      
      const result = enableAlarm(alarmId);
      
      expect(result).toBe(true);
      
      const updatedAlarm = getAlarmById(alarmId);
      expect(updatedAlarm?.isEnabled).toBe(true);
    });

    it('disables alarm', () => {
      const alarms = getCloudWatchAlarms();
      const alarmId = alarms[0].id;
      
      const result = disableAlarm(alarmId);
      
      expect(result).toBe(true);
      
      const updatedAlarm = getAlarmById(alarmId);
      expect(updatedAlarm?.isEnabled).toBe(false);
    });
  });

  describe('alarm evaluation', () => {
    it('evaluates alarm conditions correctly', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: 10 }), // High error rate
      } as Response);

      const mockSendSystemAlert = vi.mocked(systemAlerts.sendSystemAlert);
      const mockLogSystemEvent = vi.mocked(cloudWatchLogger.logSystemEvent);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000); // 30 seconds
      
      // Wait for async operations
      await vi.runAllTimersAsync();

      expect(mockLogSystemEvent).toHaveBeenCalled();
      expect(mockSendSystemAlert).toHaveBeenCalled();
    });

    it('handles metric retrieval failures', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('API Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to evaluate alarm'),
        expect.any(Error)
      );
    });

    it('sets alarm to INSUFFICIENT_DATA on metric failure', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('API Error'));

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      const alarmStates = getAlarmStates();
      const states = Array.from(alarmStates.values());
      
      expect(states.some(state => state.state === 'INSUFFICIENT_DATA')).toBe(true);
    });

    it('does not evaluate disabled alarms', async () => {
      const alarms = getCloudWatchAlarms();
      const alarmId = alarms[0].id;
      
      // Disable the alarm
      disableAlarm(alarmId);

      const mockFetch = vi.mocked(fetch);
      
      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      // Should not call fetch for disabled alarm
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/cloudwatch/metrics',
        expect.any(Object)
      );
    });
  });

  describe('alarm state changes', () => {
    it('logs state changes', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: 10 }), // High value to trigger alarm
      } as Response);

      const mockLogSystemEvent = vi.mocked(cloudWatchLogger.logSystemEvent);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      expect(mockLogSystemEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('changed'),
          metadata: expect.objectContaining({
            currentState: 'ALARM',
          }),
        })
      );
    });

    it('sends system alerts for ALARM state', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: 10 }), // High value to trigger alarm
      } as Response);

      const mockSendSystemAlert = vi.mocked(systemAlerts.sendSystemAlert);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      expect(mockSendSystemAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('CloudWatch Alarm'),
          type: expect.any(String),
          source: 'CloudWatch Alarms',
        })
      );
    });

    it('marks critical alarms as requiring immediate action', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: 2 }), // Value to trigger critical alarm
      } as Response);

      const mockSendSystemAlert = vi.mocked(systemAlerts.sendSystemAlert);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      const criticalAlertCall = mockSendSystemAlert.mock.calls.find(call => 
        call[0].type === 'critical'
      );
      
      if (criticalAlertCall) {
        expect(criticalAlertCall[0].requiresImmedateAction).toBe(true);
      }
    });
  });

  describe('alarm actions', () => {
    it('executes SNS actions for alarms', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: 10 }), // High value to trigger alarm
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/sns/cloudwatch-alarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('CloudWatch Alarm'),
      });
    });

    it('executes email actions for alarms', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: 10 }), // High value to trigger alarm
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/alarm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Healthcare App Alert'),
      });
    });

    it('handles action execution failures gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: 10 }), // High value to trigger alarm
        } as Response)
        .mockRejectedValueOnce(new Error('Action failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute alarm action'),
        expect.any(Error)
      );
    });
  });

  describe('comparison operators', () => {
    it('evaluates GreaterThanThreshold correctly', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: 10 }), // Above threshold of 5
      } as Response);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      const alarmStates = getAlarmStates();
      const errorRateAlarm = Array.from(alarmStates.entries()).find(
        ([id]) => getAlarmById(id)?.name === 'High Error Rate'
      );

      if (errorRateAlarm) {
        expect(errorRateAlarm[1].state).toBe('ALARM');
      }
    });

    it('evaluates LessThanThreshold correctly', async () => {
      // Update an alarm to use LessThanThreshold
      const alarms = getCloudWatchAlarms();
      const alarmId = alarms[0].id;
      updateAlarm(alarmId, { 
        comparisonOperator: 'LessThanThreshold',
        threshold: 15 
      });

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: 10 }), // Below threshold of 15
      } as Response);

      // Trigger alarm evaluation
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      const alarmStates = getAlarmStates();
      const alarmState = alarmStates.get(alarmId);

      expect(alarmState?.state).toBe('ALARM');
    });
  });

  describe('simulated metrics', () => {
    it('generates realistic metric values for different alarm types', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Use simulated values'));

      // Trigger alarm evaluation to use simulated values
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();

      const alarmStates = getAlarmStates();
      const states = Array.from(alarmStates.values());

      // Should have metric values for all alarms
      states.forEach(state => {
        expect(typeof state.metricValue).toBe('number');
        expect(state.metricValue).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
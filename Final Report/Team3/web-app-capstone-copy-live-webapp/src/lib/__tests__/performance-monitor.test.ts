/**
 * Performance Monitor Tests
 * 
 * Tests for the performance monitoring service including metrics collection,
 * event tracking, and CloudWatch integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { performanceMonitor, trackMedicationReminder, trackAppointmentScheduled } from '../performance-monitor';

// Mock Amplify Analytics
vi.mock('@aws-amplify/analytics', () => ({
  Analytics: {
    configure: vi.fn(),
    record: vi.fn(),
  },
}));

// Mock performance APIs
const mockPerformanceObserver = vi.fn();
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => []),
};

Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  value: mockPerformanceObserver,
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance,
});

Object.defineProperty(global, 'navigator', {
  writable: true,
  value: {
    onLine: true,
  },
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Metric Recording', () => {
    it('should record performance metrics correctly', () => {
      performanceMonitor.recordMetric('PageLoadTime', 1500, 'ms', { page: '/dashboard' });
      
      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.averagePageLoadTime).toBe(1500);
    });

    it('should identify critical performance issues', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Record a metric that exceeds critical threshold
      performanceMonitor.recordMetric('PageLoadTime', 5000, 'ms', { page: '/dashboard' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical performance issue detected'),
        expect.any(Object)
      );
    });

    it('should track GraphQL query performance', () => {
      performanceMonitor.trackGraphQLQuery('listClients', 250, true, false);
      
      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.averageGraphQLTime).toBe(250);
      expect(summary.cacheHitRate).toBe(0);
    });

    it('should calculate cache hit rate correctly', () => {
      performanceMonitor.trackGraphQLQuery('listClients', 250, true, true);
      performanceMonitor.trackGraphQLQuery('getClient', 150, true, false);
      
      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.cacheHitRate).toBe(0.5);
    });
  });

  describe('Healthcare Event Tracking', () => {
    it('should track medication reminder events', () => {
      trackMedicationReminder('med-123', 'client-456');
      
      const exported = performanceMonitor.exportMetrics();
      const medicationEvents = exported.events.filter(e => 
        e.eventType === 'MEDICATION_REMINDER_VIEW'
      );
      
      expect(medicationEvents).toHaveLength(1);
      expect(medicationEvents[0].metadata).toEqual({
        medicationId: 'med-123',
        clientId: 'client-456',
      });
    });

    it('should track appointment scheduling events', () => {
      trackAppointmentScheduled('appt-789', 'client-456', 'Dr. Smith');
      
      const exported = performanceMonitor.exportMetrics();
      const appointmentEvents = exported.events.filter(e => 
        e.eventType === 'APPOINTMENT_SCHEDULED'
      );
      
      expect(appointmentEvents).toHaveLength(1);
      expect(appointmentEvents[0].metadata).toEqual({
        appointmentId: 'appt-789',
        clientId: 'client-456',
        provider: 'Dr. Smith',
      });
    });

    it('should track medication taken events with timing', () => {
      performanceMonitor.trackMedicationEvent('TAKEN', 'med-123', 'client-456', { onTime: true });
      
      const exported = performanceMonitor.exportMetrics();
      const medicationEvents = exported.events.filter(e => 
        e.eventType === 'MEDICATION_TAKEN'
      );
      
      expect(medicationEvents).toHaveLength(1);
      expect(medicationEvents[0].metadata?.onTime).toBe(true);
    });

    it('should track communication events', () => {
      performanceMonitor.trackCommunicationEvent('MESSAGE_SENT', 'client-456', {
        messageType: 'urgent',
        recipientCount: 3,
      });
      
      const exported = performanceMonitor.exportMetrics();
      const commEvents = exported.events.filter(e => 
        e.eventType === 'COMMUNICATION_MESSAGE_SENT'
      );
      
      expect(commEvents).toHaveLength(1);
      expect(commEvents[0].metadata).toEqual({
        clientId: 'client-456',
        messageType: 'urgent',
        recipientCount: 3,
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track GraphQL errors', () => {
      const error = new Error('GraphQL query failed');
      performanceMonitor.trackError('GRAPHQL', error, { query: 'listClients' });
      
      const exported = performanceMonitor.exportMetrics();
      const errorEvents = exported.events.filter(e => 
        e.eventType === 'ERROR_GRAPHQL'
      );
      
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].metadata?.message).toBe('GraphQL query failed');
      expect(errorEvents[0].metadata?.query).toBe('listClients');
    });

    it('should calculate error rate correctly', () => {
      // Track some successful events
      performanceMonitor.trackEvent('DASHBOARD_VIEW');
      performanceMonitor.trackEvent('CLIENT_PROFILE_VIEW');
      
      // Track an error
      const error = new Error('Network error');
      performanceMonitor.trackError('NETWORK', error);
      
      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.errorRate).toBeCloseTo(0.33, 2);
    });
  });

  describe('Offline Mode Tracking', () => {
    it('should track offline mode activation', () => {
      performanceMonitor.trackOfflineEvent('ACTIVATED');
      
      const exported = performanceMonitor.exportMetrics();
      const offlineEvents = exported.events.filter(e => 
        e.eventType === 'OFFLINE_ACTIVATED'
      );
      
      expect(offlineEvents).toHaveLength(1);
      expect(offlineEvents[0].metadata?.isOnline).toBe(true);
    });

    it('should track offline data access', () => {
      performanceMonitor.trackOfflineEvent('DATA_ACCESS');
      
      const exported = performanceMonitor.exportMetrics();
      const offlineEvents = exported.events.filter(e => 
        e.eventType === 'OFFLINE_DATA_ACCESS'
      );
      
      expect(offlineEvents).toHaveLength(1);
    });
  });

  describe('Performance Summary', () => {
    it('should provide accurate performance summary', () => {
      // Add various metrics
      performanceMonitor.recordMetric('PageLoadTime', 1000, 'ms');
      performanceMonitor.recordMetric('PageLoadTime', 2000, 'ms');
      performanceMonitor.trackGraphQLQuery('listClients', 100, true, true);
      performanceMonitor.trackGraphQLQuery('getClient', 200, true, false);
      
      // Add an error
      const error = new Error('Test error');
      performanceMonitor.trackError('APPLICATION', error);
      
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.averagePageLoadTime).toBe(1500);
      expect(summary.averageGraphQLTime).toBe(150);
      expect(summary.cacheHitRate).toBe(0.5);
      expect(summary.errorRate).toBeGreaterThan(0);
    });

    it('should handle empty metrics gracefully', () => {
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.averagePageLoadTime).toBe(0);
      expect(summary.averageGraphQLTime).toBe(0);
      expect(summary.errorRate).toBe(0);
      expect(summary.cacheHitRate).toBe(0);
    });
  });

  describe('Data Export', () => {
    it('should export metrics and events correctly', () => {
      performanceMonitor.recordMetric('TestMetric', 100, 'ms');
      performanceMonitor.trackEvent('TEST_EVENT', { test: true });
      
      const exported = performanceMonitor.exportMetrics();
      
      expect(exported.metrics).toHaveLength(1);
      expect(exported.events).toHaveLength(1);
      expect(exported.summary).toBeDefined();
      expect(exported.metrics[0].name).toBe('TestMetric');
      expect(exported.events[0].eventType).toBe('TEST_EVENT');
    });

    it('should clear metrics when requested', () => {
      performanceMonitor.recordMetric('TestMetric', 100, 'ms');
      performanceMonitor.trackEvent('TEST_EVENT');
      
      let exported = performanceMonitor.exportMetrics();
      expect(exported.metrics).toHaveLength(1);
      expect(exported.events).toHaveLength(1);
      
      performanceMonitor.clearMetrics();
      
      exported = performanceMonitor.exportMetrics();
      expect(exported.metrics).toHaveLength(0);
      expect(exported.events).toHaveLength(0);
    });
  });
});

describe('Healthcare-Specific Tracking Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  it('should track medication reminders with correct metadata', () => {
    trackMedicationReminder('med-123', 'client-456');
    
    const exported = performanceMonitor.exportMetrics();
    const event = exported.events.find(e => e.eventType === 'MEDICATION_REMINDER_VIEW');
    
    expect(event).toBeDefined();
    expect(event?.metadata).toEqual({
      medicationId: 'med-123',
      clientId: 'client-456',
    });
  });

  it('should track appointment scheduling with provider info', () => {
    trackAppointmentScheduled('appt-789', 'client-456', 'Dr. Smith');
    
    const exported = performanceMonitor.exportMetrics();
    const event = exported.events.find(e => e.eventType === 'APPOINTMENT_SCHEDULED');
    
    expect(event).toBeDefined();
    expect(event?.metadata).toEqual({
      appointmentId: 'appt-789',
      clientId: 'client-456',
      provider: 'Dr. Smith',
    });
  });
});
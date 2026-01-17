/**
 * Performance Monitoring Service for Healthcare App
 * 
 * This service tracks performance metrics, user behavior, and system health
 * to ensure optimal healthcare application performance.
 */

import { Analytics } from '@aws-amplify/analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserBehaviorEvent {
  eventType: string;
  userId?: string;
  clientId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private events: UserBehaviorEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeMonitoring();
  }

  private async initializeMonitoring(): Promise<void> {
    try {
      // Configure Amplify Analytics
      await Analytics.configure({
        // Pinpoint configuration for user behavior tracking
        Pinpoint: {
          appId: process.env.NEXT_PUBLIC_PINPOINT_APP_ID,
          region: process.env.NEXT_PUBLIC_AWS_REGION,
        },
        // Kinesis configuration for real-time analytics
        Kinesis: {
          region: process.env.NEXT_PUBLIC_AWS_REGION,
        },
      });

      this.isInitialized = true;
      this.startPerformanceObserver();
      this.trackPageLoadMetrics();
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Start performance observer for Web Vitals and other metrics
   */
  private startPerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('LCP', entry.startTime, 'ms', {
            element: entry.element?.tagName,
            url: entry.url,
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms', {
            eventType: entry.name,
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        if (clsValue > 0) {
          this.recordMetric('CLS', clsValue, 'score');
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('TTFB', navEntry.responseStart - navEntry.requestStart, 'ms');
          this.recordMetric('DOMContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart, 'ms');
          this.recordMetric('LoadComplete', navEntry.loadEventEnd - navEntry.navigationStart, 'ms');
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * Track page load metrics specific to healthcare workflows
   */
  private trackPageLoadMetrics(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Track time to interactive for healthcare-critical pages
      const now = performance.now();
      const page = window.location.pathname;
      
      // Identify healthcare-critical pages
      const criticalPages = ['/dashboard', '/calendar', '/clients'];
      const isCriticalPage = criticalPages.some(criticalPage => page.includes(criticalPage));
      
      this.recordMetric('PageLoadTime', now, 'ms', {
        page,
        isCritical: isCriticalPage,
      });

      if (isCriticalPage) {
        this.trackEvent('CRITICAL_PAGE_LOAD', {
          page,
          loadTime: now,
        });
      }
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string, 
    value: number, 
    unit: string = 'ms', 
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Send to Amplify Analytics
    if (this.isInitialized) {
      Analytics.record({
        name: `performance_${name.toLowerCase()}`,
        attributes: {
          value: value.toString(),
          unit,
          ...metadata,
        },
      });
    }

    // Log critical performance issues
    if (this.isCriticalMetric(name, value)) {
      console.warn(`Critical performance issue detected: ${name} = ${value}${unit}`, metadata);
      this.trackEvent('PERFORMANCE_ISSUE', {
        metric: name,
        value,
        unit,
        ...metadata,
      });
    }
  }

  /**
   * Track user behavior events
   */
  trackEvent(eventType: string, metadata?: Record<string, any>): void {
    const event: UserBehaviorEvent = {
      eventType,
      timestamp: Date.now(),
      metadata,
    };

    this.events.push(event);

    // Send to Amplify Analytics
    if (this.isInitialized) {
      Analytics.record({
        name: eventType.toLowerCase(),
        attributes: {
          timestamp: event.timestamp.toString(),
          ...metadata,
        },
      });
    }
  }

  /**
   * Track GraphQL query performance
   */
  trackGraphQLQuery(
    operationName: string,
    duration: number,
    success: boolean,
    cacheHit: boolean = false
  ): void {
    this.recordMetric('GraphQLQueryTime', duration, 'ms', {
      operation: operationName,
      success,
      cacheHit,
    });

    this.trackEvent('GRAPHQL_QUERY', {
      operation: operationName,
      duration,
      success,
      cacheHit,
    });
  }

  /**
   * Track healthcare-specific user actions
   */
  trackHealthcareAction(action: string, clientId?: string, metadata?: Record<string, any>): void {
    this.trackEvent(`HEALTHCARE_${action.toUpperCase()}`, {
      clientId,
      ...metadata,
    });
  }

  /**
   * Track medication-related events
   */
  trackMedicationEvent(
    eventType: 'REMINDER_VIEW' | 'TAKEN' | 'MISSED' | 'SCHEDULE_UPDATE',
    medicationId: string,
    clientId: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent(`MEDICATION_${eventType}`, {
      medicationId,
      clientId,
      ...metadata,
    });
  }

  /**
   * Track appointment-related events
   */
  trackAppointmentEvent(
    eventType: 'SCHEDULED' | 'VIEW' | 'REMINDER_SENT' | 'COMPLETED',
    appointmentId: string,
    clientId: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent(`APPOINTMENT_${eventType}`, {
      appointmentId,
      clientId,
      ...metadata,
    });
  }

  /**
   * Track communication events
   */
  trackCommunicationEvent(
    eventType: 'MESSAGE_SENT' | 'MESSAGE_READ' | 'URGENT_MESSAGE',
    clientId: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent(`COMMUNICATION_${eventType}`, {
      clientId,
      ...metadata,
    });
  }

  /**
   * Track offline mode usage
   */
  trackOfflineEvent(eventType: 'ACTIVATED' | 'DEACTIVATED' | 'DATA_ACCESS'): void {
    this.trackEvent(`OFFLINE_${eventType}`, {
      isOnline: navigator.onLine,
      timestamp: Date.now(),
    });
  }

  /**
   * Track error events
   */
  trackError(
    errorType: 'GRAPHQL' | 'NETWORK' | 'AUTHENTICATION' | 'APPLICATION',
    error: Error,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent(`ERROR_${errorType}`, {
      message: error.message,
      stack: error.stack,
      ...metadata,
    });
  }

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary(): {
    averagePageLoadTime: number;
    averageGraphQLTime: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const pageLoadMetrics = this.metrics.filter(m => m.name === 'PageLoadTime');
    const graphqlMetrics = this.metrics.filter(m => m.name === 'GraphQLQueryTime');
    const errorEvents = this.events.filter(e => e.eventType.includes('ERROR'));
    const cacheHitEvents = this.events.filter(e => 
      e.eventType === 'GRAPHQL_QUERY' && e.metadata?.cacheHit === true
    );
    const totalGraphQLEvents = this.events.filter(e => e.eventType === 'GRAPHQL_QUERY');

    return {
      averagePageLoadTime: pageLoadMetrics.length > 0 
        ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length 
        : 0,
      averageGraphQLTime: graphqlMetrics.length > 0
        ? graphqlMetrics.reduce((sum, m) => sum + m.value, 0) / graphqlMetrics.length
        : 0,
      errorRate: this.events.length > 0 
        ? errorEvents.length / this.events.length 
        : 0,
      cacheHitRate: totalGraphQLEvents.length > 0
        ? cacheHitEvents.length / totalGraphQLEvents.length
        : 0,
    };
  }

  /**
   * Check if a metric indicates a critical performance issue
   */
  private isCriticalMetric(name: string, value: number): boolean {
    const thresholds = {
      'LCP': 2500, // 2.5 seconds
      'FID': 100,  // 100ms
      'CLS': 0.1,  // 0.1 score
      'TTFB': 600, // 600ms
      'PageLoadTime': 3000, // 3 seconds
      'GraphQLQueryTime': 1000, // 1 second
    };

    return thresholds[name] ? value > thresholds[name] : false;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    events: UserBehaviorEvent[];
    summary: ReturnType<typeof this.getPerformanceSummary>;
  } {
    return {
      metrics: [...this.metrics],
      events: [...this.events],
      summary: this.getPerformanceSummary(),
    };
  }

  /**
   * Clear stored metrics and events
   */
  clearMetrics(): void {
    this.metrics = [];
    this.events = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Healthcare-specific tracking functions
export const trackMedicationReminder = (medicationId: string, clientId: string) => {
  performanceMonitor.trackMedicationEvent('REMINDER_VIEW', medicationId, clientId);
};

export const trackMedicationTaken = (medicationId: string, clientId: string, onTime: boolean) => {
  performanceMonitor.trackMedicationEvent('TAKEN', medicationId, clientId, { onTime });
};

export const trackAppointmentScheduled = (appointmentId: string, clientId: string, provider: string) => {
  performanceMonitor.trackAppointmentEvent('SCHEDULED', appointmentId, clientId, { provider });
};

export const trackClientProfileAccess = (clientId: string, viewType: 'summary' | 'detail' | 'edit') => {
  performanceMonitor.trackHealthcareAction('CLIENT_PROFILE_ACCESS', clientId, { viewType });
};

export const trackDashboardView = (clientCount: number, urgentTasks: number) => {
  performanceMonitor.trackEvent('DASHBOARD_VIEW', { clientCount, urgentTasks });
};

export const trackCalendarView = (viewType: 'month' | 'week' | 'day', appointmentCount: number) => {
  performanceMonitor.trackEvent('CALENDAR_VIEW', { viewType, appointmentCount });
};
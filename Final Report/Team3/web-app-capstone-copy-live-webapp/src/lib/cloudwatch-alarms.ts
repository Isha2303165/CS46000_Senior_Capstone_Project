import { sendSystemAlert } from './system-alerts';
import { logSystemEvent } from './cloudwatch-logger';

export interface CloudWatchAlarm {
  id: string;
  name: string;
  description: string;
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number; // in seconds
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum' | 'SampleCount';
  isEnabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: string[]; // SNS topic ARNs or action identifiers
}

export interface AlarmState {
  alarmId: string;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  reason: string;
  timestamp: string;
  metricValue?: number;
}

class CloudWatchAlarmManager {
  private alarms: CloudWatchAlarm[] = [];
  private alarmStates: Map<string, AlarmState> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultAlarms();
    this.startMonitoring();
  }

  private initializeDefaultAlarms(): void {
    // Critical healthcare system alarms
    this.alarms = [
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        description: 'Application error rate exceeds acceptable threshold',
        metricName: 'ErrorRate',
        namespace: 'HealthcareApp/Frontend',
        threshold: 5, // 5% error rate
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300, // 5 minutes
        statistic: 'Average',
        isEnabled: true,
        severity: 'critical',
        actions: ['sns:critical-alerts', 'email:dev-team'],
      },
      {
        id: 'medication-reminder-failures',
        name: 'Medication Reminder Failures',
        description: 'High number of failed medication reminders',
        metricName: 'MedicationReminderFailures',
        namespace: 'HealthcareApp/Medications',
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 300,
        statistic: 'Sum',
        isEnabled: true,
        severity: 'high',
        actions: ['sns:healthcare-alerts', 'email:care-team'],
      },
      {
        id: 'appointment-sync-failures',
        name: 'Appointment Sync Failures',
        description: 'Appointment synchronization is failing',
        metricName: 'AppointmentSyncFailures',
        namespace: 'HealthcareApp/Appointments',
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 600, // 10 minutes
        statistic: 'Sum',
        isEnabled: true,
        severity: 'high',
        actions: ['sns:healthcare-alerts'],
      },
      {
        id: 'user-authentication-failures',
        name: 'High Authentication Failures',
        description: 'Unusual number of authentication failures detected',
        metricName: 'AuthenticationFailures',
        namespace: 'HealthcareApp/Auth',
        threshold: 50,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 300,
        statistic: 'Sum',
        isEnabled: true,
        severity: 'medium',
        actions: ['sns:security-alerts'],
      },
      {
        id: 'data-export-failures',
        name: 'Data Export Failures',
        description: 'Client data export operations are failing',
        metricName: 'DataExportFailures',
        namespace: 'HealthcareApp/DataExport',
        threshold: 3,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 900, // 15 minutes
        statistic: 'Sum',
        isEnabled: true,
        severity: 'high',
        actions: ['sns:healthcare-alerts', 'email:compliance-team'],
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        description: 'Application memory usage is critically high',
        metricName: 'MemoryUtilization',
        namespace: 'HealthcareApp/Performance',
        threshold: 85, // 85% memory usage
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        period: 300,
        statistic: 'Average',
        isEnabled: true,
        severity: 'medium',
        actions: ['sns:performance-alerts'],
      },
      {
        id: 'response-time-high',
        name: 'High Response Time',
        description: 'Application response time is degraded',
        metricName: 'ResponseTime',
        namespace: 'HealthcareApp/Performance',
        threshold: 5000, // 5 seconds
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Average',
        isEnabled: true,
        severity: 'medium',
        actions: ['sns:performance-alerts'],
      },
      {
        id: 'critical-client-data-access-failures',
        name: 'Critical Client Data Access Failures',
        description: 'Unable to access critical client data',
        metricName: 'ClientDataAccessFailures',
        namespace: 'HealthcareApp/Data',
        threshold: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        period: 60, // 1 minute
        statistic: 'Sum',
        isEnabled: true,
        severity: 'critical',
        actions: ['sns:critical-alerts', 'email:dev-team', 'email:care-team'],
      },
    ];
  }

  private startMonitoring(): void {
    // Start monitoring alarms every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.evaluateAlarms();
    }, 30000);
  }

  private async evaluateAlarms(): Promise<void> {
    for (const alarm of this.alarms) {
      if (!alarm.isEnabled) continue;

      try {
        const metricValue = await this.getMetricValue(alarm);
        const currentState = this.evaluateAlarmCondition(alarm, metricValue);
        const previousState = this.alarmStates.get(alarm.id);

        // Update alarm state
        this.alarmStates.set(alarm.id, currentState);

        // Check for state changes
        if (!previousState || previousState.state !== currentState.state) {
          await this.handleAlarmStateChange(alarm, currentState, previousState);
        }
      } catch (error) {
        console.error(`Failed to evaluate alarm ${alarm.id}:`, error);
        
        // Set alarm to INSUFFICIENT_DATA state
        const insufficientDataState: AlarmState = {
          alarmId: alarm.id,
          state: 'INSUFFICIENT_DATA',
          reason: 'Failed to retrieve metric data',
          timestamp: new Date().toISOString(),
        };
        
        this.alarmStates.set(alarm.id, insufficientDataState);
      }
    }
  }

  private async getMetricValue(alarm: CloudWatchAlarm): Promise<number> {
    // In a real implementation, this would query CloudWatch metrics
    // For now, we'll simulate metric values based on application state
    
    try {
      // Simulate CloudWatch API call
      const response = await fetch('/api/cloudwatch/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace: alarm.namespace,
          metricName: alarm.metricName,
          statistic: alarm.statistic,
          period: alarm.period,
          startTime: new Date(Date.now() - alarm.period * 1000).toISOString(),
          endTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`CloudWatch API error: ${response.status}`);
      }

      const data = await response.json();
      return data.value || 0;
    } catch (error) {
      // Fallback to simulated values for development
      return this.getSimulatedMetricValue(alarm);
    }
  }

  private getSimulatedMetricValue(alarm: CloudWatchAlarm): number {
    // Simulate different metric values for testing
    switch (alarm.metricName) {
      case 'ErrorRate':
        return Math.random() * 10; // 0-10% error rate
      case 'MedicationReminderFailures':
        return Math.floor(Math.random() * 20); // 0-20 failures
      case 'AppointmentSyncFailures':
        return Math.floor(Math.random() * 10); // 0-10 failures
      case 'AuthenticationFailures':
        return Math.floor(Math.random() * 100); // 0-100 failures
      case 'DataExportFailures':
        return Math.floor(Math.random() * 5); // 0-5 failures
      case 'MemoryUtilization':
        return 60 + Math.random() * 40; // 60-100% memory usage
      case 'ResponseTime':
        return 1000 + Math.random() * 8000; // 1-9 seconds
      case 'ClientDataAccessFailures':
        return Math.floor(Math.random() * 3); // 0-3 failures
      default:
        return 0;
    }
  }

  private evaluateAlarmCondition(alarm: CloudWatchAlarm, metricValue: number): AlarmState {
    let isInAlarmState = false;

    switch (alarm.comparisonOperator) {
      case 'GreaterThanThreshold':
        isInAlarmState = metricValue > alarm.threshold;
        break;
      case 'LessThanThreshold':
        isInAlarmState = metricValue < alarm.threshold;
        break;
      case 'GreaterThanOrEqualToThreshold':
        isInAlarmState = metricValue >= alarm.threshold;
        break;
      case 'LessThanOrEqualToThreshold':
        isInAlarmState = metricValue <= alarm.threshold;
        break;
    }

    return {
      alarmId: alarm.id,
      state: isInAlarmState ? 'ALARM' : 'OK',
      reason: isInAlarmState 
        ? `Metric value ${metricValue} ${alarm.comparisonOperator.replace('Threshold', '')} ${alarm.threshold}`
        : `Metric value ${metricValue} is within acceptable range`,
      timestamp: new Date().toISOString(),
      metricValue,
    };
  }

  private async handleAlarmStateChange(
    alarm: CloudWatchAlarm,
    currentState: AlarmState,
    previousState?: AlarmState
  ): Promise<void> {
    const stateChangeMessage = previousState 
      ? `Alarm ${alarm.name} changed from ${previousState.state} to ${currentState.state}`
      : `Alarm ${alarm.name} is now in ${currentState.state} state`;

    // Log state change
    await logSystemEvent({
      type: currentState.state === 'ALARM' ? 'error' : 'info',
      message: stateChangeMessage,
      timestamp: currentState.timestamp,
      metadata: {
        alarmId: alarm.id,
        alarmName: alarm.name,
        previousState: previousState?.state,
        currentState: currentState.state,
        metricValue: currentState.metricValue,
        threshold: alarm.threshold,
        reason: currentState.reason,
      },
    });

    // Send alerts for ALARM state
    if (currentState.state === 'ALARM') {
      await this.triggerAlarmActions(alarm, currentState);
    }
  }

  private async triggerAlarmActions(alarm: CloudWatchAlarm, alarmState: AlarmState): Promise<void> {
    // Send system alert
    await sendSystemAlert({
      type: alarm.severity === 'critical' ? 'critical' : 'error',
      title: `CloudWatch Alarm: ${alarm.name}`,
      message: `${alarm.description}\n\nCurrent value: ${alarmState.metricValue}\nThreshold: ${alarm.threshold}\nReason: ${alarmState.reason}`,
      source: 'CloudWatch Alarms',
      requiresImmedateAction: alarm.severity === 'critical',
      metadata: {
        alarmId: alarm.id,
        severity: alarm.severity,
        metricName: alarm.metricName,
        namespace: alarm.namespace,
      },
    });

    // Execute configured actions
    for (const action of alarm.actions) {
      try {
        await this.executeAlarmAction(action, alarm, alarmState);
      } catch (error) {
        console.error(`Failed to execute alarm action ${action}:`, error);
      }
    }
  }

  private async executeAlarmAction(
    action: string,
    alarm: CloudWatchAlarm,
    alarmState: AlarmState
  ): Promise<void> {
    if (action.startsWith('sns:')) {
      // Send SNS notification
      const topicName = action.replace('sns:', '');
      await this.sendSNSNotification(topicName, alarm, alarmState);
    } else if (action.startsWith('email:')) {
      // Send email notification
      const recipient = action.replace('email:', '');
      await this.sendEmailNotification(recipient, alarm, alarmState);
    }
  }

  private async sendSNSNotification(
    topicName: string,
    alarm: CloudWatchAlarm,
    alarmState: AlarmState
  ): Promise<void> {
    await fetch('/api/sns/cloudwatch-alarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicName,
        subject: `CloudWatch Alarm: ${alarm.name}`,
        message: `
Alarm: ${alarm.name}
Description: ${alarm.description}
Severity: ${alarm.severity.toUpperCase()}
State: ${alarmState.state}
Metric Value: ${alarmState.metricValue}
Threshold: ${alarm.threshold}
Reason: ${alarmState.reason}
Timestamp: ${alarmState.timestamp}
        `,
        alarmId: alarm.id,
        severity: alarm.severity,
      }),
    });
  }

  private async sendEmailNotification(
    recipient: string,
    alarm: CloudWatchAlarm,
    alarmState: AlarmState
  ): Promise<void> {
    await fetch('/api/notifications/alarm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient,
        subject: `Healthcare App Alert: ${alarm.name}`,
        alarmName: alarm.name,
        description: alarm.description,
        severity: alarm.severity,
        state: alarmState.state,
        metricValue: alarmState.metricValue,
        threshold: alarm.threshold,
        reason: alarmState.reason,
        timestamp: alarmState.timestamp,
      }),
    });
  }

  // Public methods for alarm management
  getAlarms(): CloudWatchAlarm[] {
    return [...this.alarms];
  }

  getAlarmStates(): Map<string, AlarmState> {
    return new Map(this.alarmStates);
  }

  getAlarmById(id: string): CloudWatchAlarm | undefined {
    return this.alarms.find(alarm => alarm.id === id);
  }

  updateAlarm(id: string, updates: Partial<CloudWatchAlarm>): boolean {
    const alarmIndex = this.alarms.findIndex(alarm => alarm.id === id);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = { ...this.alarms[alarmIndex], ...updates };
      return true;
    }
    return false;
  }

  enableAlarm(id: string): boolean {
    return this.updateAlarm(id, { isEnabled: true });
  }

  disableAlarm(id: string): boolean {
    return this.updateAlarm(id, { isEnabled: false });
  }

  // Cleanup
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Create singleton instance
const cloudWatchAlarmManager = new CloudWatchAlarmManager();

// Export convenience functions
export const getCloudWatchAlarms = () => cloudWatchAlarmManager.getAlarms();
export const getAlarmStates = () => cloudWatchAlarmManager.getAlarmStates();
export const getAlarmById = (id: string) => cloudWatchAlarmManager.getAlarmById(id);
export const updateAlarm = (id: string, updates: Partial<CloudWatchAlarm>) => 
  cloudWatchAlarmManager.updateAlarm(id, updates);
export const enableAlarm = (id: string) => cloudWatchAlarmManager.enableAlarm(id);
export const disableAlarm = (id: string) => cloudWatchAlarmManager.disableAlarm(id);

// Export manager instance
export { cloudWatchAlarmManager };
import { ErrorInfo } from 'react';

export interface ErrorLogData {
  error: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId: string | null;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface SystemAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class CloudWatchLogger {
  private isEnabled: boolean;
  private logGroup: string;
  private logStream: string;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.logGroup = process.env.NEXT_PUBLIC_CLOUDWATCH_LOG_GROUP || 'healthcare-app-errors';
    this.logStream = process.env.NEXT_PUBLIC_CLOUDWATCH_LOG_STREAM || 'frontend-errors';
  }

  async logError(errorData: ErrorLogData): Promise<void> {
    try {
      // In a real implementation, this would use AWS SDK to send logs to CloudWatch
      // For now, we'll simulate the logging and store locally for development
      
      const logEntry = {
        timestamp: errorData.timestamp,
        level: 'ERROR',
        errorId: errorData.errorId,
        message: errorData.error.message,
        stack: errorData.error.stack,
        componentStack: errorData.errorInfo?.componentStack,
        userAgent: errorData.userAgent,
        url: errorData.url,
        userId: errorData.userId,
        severity: errorData.severity || 'medium',
        context: errorData.context,
      };

      if (this.isEnabled) {
        // In production, send to CloudWatch
        await this.sendToCloudWatch(logEntry);
      } else {
        // In development, log to console and localStorage
        try {
          console.error('CloudWatch Error Log:', JSON.stringify(logEntry, null, 2));
        } catch (serializationError) {
          // Fallback if JSON.stringify fails due to circular references
          console.error('CloudWatch Error Log (serialization failed):', {
            errorId: logEntry.errorId,
            message: logEntry.message,
            timestamp: logEntry.timestamp,
            severity: logEntry.severity,
            url: logEntry.url,
            userId: logEntry.userId
          });
          console.error('Full error object:', errorData.error);
        }
        this.storeLocalLog(logEntry);
      }

      // Send critical errors to SNS for immediate alerts
      if (errorData.severity === 'critical') {
        await this.sendCriticalAlert(errorData);
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      // Fallback to basic console logging
      console.error('Original error:', errorData.error);
    }
  }

  async logSystemEvent(event: SystemAlert): Promise<void> {
    try {
      const logEntry = {
        timestamp: event.timestamp,
        level: event.type.toUpperCase(),
        message: event.message,
        metadata: event.metadata,
      };

      if (this.isEnabled) {
        await this.sendToCloudWatch(logEntry);
      } else {
        console.log('CloudWatch System Event:', JSON.stringify(logEntry, null, 2));
        this.storeLocalLog(logEntry);
      }
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  private async sendToCloudWatch(logEntry: any): Promise<void> {
    // In a real implementation, this would use AWS CloudWatch Logs SDK
    // For now, we'll simulate the API call
    
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      // Simulate CloudWatch API call
      const response = await fetch('/api/cloudwatch/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logGroupName: this.logGroup,
          logStreamName: this.logStream,
          logEvents: [
            {
              timestamp: Date.now(),
              message: JSON.stringify(logEntry),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`CloudWatch API error: ${response.status}`);
      }
    } catch (error) {
      console.error('CloudWatch API call failed:', error);
      // Fallback to local storage
      this.storeLocalLog(logEntry);
    }
  }

  private async sendCriticalAlert(errorData: ErrorLogData): Promise<void> {
    try {
      // Send SNS notification for critical errors
      await fetch('/api/sns/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `Critical Error in Healthcare App - ${errorData.errorId}`,
          message: `
Critical error occurred in Healthcare Tracking App:

Error ID: ${errorData.errorId}
Timestamp: ${errorData.timestamp}
User ID: ${errorData.userId || 'Anonymous'}
URL: ${errorData.url}
Error: ${errorData.error.message}

Stack Trace:
${errorData.error.stack}

Please investigate immediately.
          `,
          severity: 'critical',
        }),
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  private storeLocalLog(logEntry: any): void {
    try {
      const logs = JSON.parse(localStorage.getItem('healthcare_app_error_logs') || '[]');
      
      // Create a serializable version of the log entry
      const serializableEntry = {
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        errorId: logEntry.errorId,
        message: logEntry.message,
        stack: typeof logEntry.stack === 'string' ? logEntry.stack : String(logEntry.stack),
        componentStack: logEntry.componentStack,
        userAgent: logEntry.userAgent,
        url: logEntry.url,
        userId: logEntry.userId,
        severity: logEntry.severity,
        context: logEntry.context,
        metadata: logEntry.metadata,
      };
      
      logs.unshift(serializableEntry); // Add to beginning for newest first
      
      // Keep only last 100 logs to prevent storage overflow
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      localStorage.setItem('healthcare_app_error_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log locally:', error);
    }
  }

  // Method to retrieve logs for debugging
  getLocalLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('healthcare_app_error_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Method to clear local logs
  clearLocalLogs(): void {
    try {
      localStorage.removeItem('healthcare_app_error_logs');
    } catch (error) {
      console.error('Failed to clear local logs:', error);
    }
  }
}

// Create singleton instance
const cloudWatchLogger = new CloudWatchLogger();

// Export convenience functions
export const logErrorToCloudWatch = (errorData: ErrorLogData) => 
  cloudWatchLogger.logError(errorData);

export const logSystemEvent = (event: SystemAlert) => 
  cloudWatchLogger.logSystemEvent(event);

export const getErrorLogs = () => cloudWatchLogger.getLocalLogs();

export const clearErrorLogs = () => cloudWatchLogger.clearLocalLogs();

// Export logger instance for advanced usage
export { cloudWatchLogger };
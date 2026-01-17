// Note: defineAnalytics is not available in current Amplify v2
// Using custom analytics implementation instead
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kinesisAnalytics from 'aws-cdk-lib/aws-kinesisanalytics';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { defineFunction } from '@aws-amplify/backend';

// Custom analytics configuration for healthcare app
export const analytics = defineFunction({
  entry: './analytics-handler.ts',
});

/**
 * Enhanced analytics configuration for healthcare performance monitoring
 */
export class HealthcareAnalytics extends Construct {
  public readonly kinesisStream: kinesis.Stream;
  public readonly logGroup: logs.LogGroup;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Kinesis stream for real-time healthcare analytics
    this.kinesisStream = new kinesis.Stream(this, 'HealthcareEventsStream', {
      streamName: 'healthcare-app-performance-events',
      shardCount: 3, // Scale for healthcare workloads
      retentionPeriod: Duration.hours(24),
      encryption: kinesis.StreamEncryption.MANAGED,
      streamMode: kinesis.StreamMode.PROVISIONED,
    });

    // Create CloudWatch log group for application logs
    this.logGroup = new logs.LogGroup(this, 'HealthcareAppLogs', {
      logGroupName: '/aws/healthcare-app/performance',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create CloudWatch dashboard for healthcare app monitoring
    this.dashboard = new cloudwatch.Dashboard(this, 'HealthcareAppDashboard', {
      dashboardName: 'Healthcare-App-Performance-Dashboard',
      widgets: [
        // Row 1: Application Performance Metrics
        [
          // GraphQL API performance
          new cloudwatch.GraphWidget({
            title: 'GraphQL API Performance',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/AppSync',
                metricName: 'Latency',
                dimensionsMap: {
                  GraphQLAPIId: 'healthcare-app-api',
                },
                statistic: 'Average',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/AppSync',
                metricName: '4XXError',
                dimensionsMap: {
                  GraphQLAPIId: 'healthcare-app-api',
                },
                statistic: 'Sum',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/AppSync',
                metricName: 'ConnectSuccess',
                dimensionsMap: {
                  GraphQLAPIId: 'healthcare-app-api',
                },
                statistic: 'Sum',
              }),
            ],
            width: 12,
            height: 6,
          }),
          // DynamoDB performance
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Performance',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'SuccessfulRequestLatency',
                dimensionsMap: {
                  TableName: 'Patient',
                  Operation: 'Query',
                },
                statistic: 'Average',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: {
                  TableName: 'Patient',
                },
                statistic: 'Sum',
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        // Row 2: DAX Performance Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'DAX Cluster Performance',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DAX',
                metricName: 'QueryLatency',
                dimensionsMap: {
                  ClusterName: 'healthcare-app-dax-cluster',
                },
                statistic: 'Average',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DAX',
                metricName: 'ItemCacheHitRate',
                dimensionsMap: {
                  ClusterName: 'healthcare-app-dax-cluster',
                },
                statistic: 'Average',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/DAX',
                metricName: 'QueryCacheHitRate',
                dimensionsMap: {
                  ClusterName: 'healthcare-app-dax-cluster',
                },
                statistic: 'Average',
              }),
            ],
            width: 24,
            height: 6,
          }),
        ],
        // Row 3: CloudFront Performance
        [
          new cloudwatch.GraphWidget({
            title: 'CloudFront Performance',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'Requests',
                dimensionsMap: {
                  DistributionId: 'healthcare-app-distribution',
                },
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'BytesDownloaded',
                dimensionsMap: {
                  DistributionId: 'healthcare-app-distribution',
                },
                statistic: 'Sum',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'CacheHitRate',
                dimensionsMap: {
                  DistributionId: 'healthcare-app-distribution',
                },
                statistic: 'Average',
              }),
            ],
            width: 24,
            height: 6,
          }),
        ],
        // Row 4: Healthcare-Specific Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'Healthcare App Usage Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'HealthcareApp/Usage',
                metricName: 'MedicationRemindersViewed',
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'HealthcareApp/Usage',
                metricName: 'AppointmentsScheduled',
                statistic: 'Sum',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'HealthcareApp/Usage',
                metricName: 'MessagesExchanged',
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'HealthcareApp/Usage',
                metricName: 'PatientProfilesAccessed',
                statistic: 'Sum',
              }),
            ],
            width: 24,
            height: 6,
          }),
        ],
      ],
    });

    // Create alarms for critical healthcare metrics
    this.createHealthcareAlarms();
  }

  private createHealthcareAlarms(): void {
    // Alarm for high GraphQL API latency (critical for healthcare)
    new cloudwatch.Alarm(this, 'HighGraphQLLatencyAlarm', {
      alarmName: 'Healthcare-App-High-GraphQL-Latency',
      alarmDescription: 'GraphQL API latency is too high for healthcare operations',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AppSync',
        metricName: 'Latency',
        dimensionsMap: {
          GraphQLAPIId: 'healthcare-app-api',
        },
        statistic: 'Average',
      }),
      threshold: 1000, // 1 second threshold for healthcare queries
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm for DAX cluster health
    new cloudwatch.Alarm(this, 'DAXClusterUnhealthyAlarm', {
      alarmName: 'Healthcare-App-DAX-Cluster-Unhealthy',
      alarmDescription: 'DAX cluster is unhealthy, affecting healthcare query performance',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DAX',
        metricName: 'FaultRequestCount',
        dimensionsMap: {
          ClusterName: 'healthcare-app-dax-cluster',
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm for low cache hit rate (performance degradation)
    new cloudwatch.Alarm(this, 'LowCacheHitRateAlarm', {
      alarmName: 'Healthcare-App-Low-Cache-Hit-Rate',
      alarmDescription: 'Cache hit rate is low, indicating performance issues',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DAX',
        metricName: 'ItemCacheHitRate',
        dimensionsMap: {
          ClusterName: 'healthcare-app-dax-cluster',
        },
        statistic: 'Average',
      }),
      threshold: 0.8, // 80% cache hit rate threshold
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
  }
}

/**
 * Healthcare-specific analytics events
 */
export const HEALTHCARE_ANALYTICS_EVENTS = {
  // User engagement events
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  DASHBOARD_VIEW: 'dashboard_view',
  
  // Patient management events
  PATIENT_PROFILE_VIEW: 'patient_profile_view',
  PATIENT_PROFILE_EDIT: 'patient_profile_edit',
  PATIENT_ADDED: 'patient_added',
  
  // Medication tracking events
  MEDICATION_REMINDER_VIEW: 'medication_reminder_view',
  MEDICATION_TAKEN: 'medication_taken',
  MEDICATION_MISSED: 'medication_missed',
  MEDICATION_SCHEDULE_UPDATE: 'medication_schedule_update',
  
  // Appointment management events
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  APPOINTMENT_VIEW: 'appointment_view',
  APPOINTMENT_REMINDER_SENT: 'appointment_reminder_sent',
  CALENDAR_VIEW: 'calendar_view',
  
  // Communication events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  URGENT_MESSAGE_SENT: 'urgent_message_sent',
  
  // Performance events
  PAGE_LOAD_TIME: 'page_load_time',
  GRAPHQL_QUERY_TIME: 'graphql_query_time',
  OFFLINE_MODE_ACTIVATED: 'offline_mode_activated',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
  
  // Error events
  GRAPHQL_ERROR: 'graphql_error',
  NETWORK_ERROR: 'network_error',
  AUTHENTICATION_ERROR: 'authentication_error',
};
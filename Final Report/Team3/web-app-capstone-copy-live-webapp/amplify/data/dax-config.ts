import * as dax from 'aws-cdk-lib/aws-dax';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DAXClusterProps {
  tables: dynamodb.Table[];
  vpc?: ec2.Vpc;
  subnetGroup?: dax.CfnSubnetGroup;
}

export class DAXCluster extends Construct {
  public readonly cluster: dax.CfnCluster;
  public readonly endpoint: string;

  constructor(scope: Construct, id: string, props: DAXClusterProps) {
    super(scope, id);

    // Create VPC if not provided
    const vpc = props.vpc || new ec2.Vpc(this, 'DAXVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create subnet group for DAX
    const subnetGroup = props.subnetGroup || new dax.CfnSubnetGroup(this, 'DAXSubnetGroup', {
      subnetGroupName: 'healthcare-app-dax-subnet-group',
      description: 'Subnet group for Healthcare App DAX cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    // Create security group for DAX
    const securityGroup = new ec2.SecurityGroup(this, 'DAXSecurityGroup', {
      vpc,
      description: 'Security group for Healthcare App DAX cluster',
      allowAllOutbound: true,
    });

    // Allow inbound connections on DAX port (8111)
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(8111),
      'Allow DAX connections from VPC'
    );

    // Create IAM role for DAX
    const daxRole = new iam.Role(this, 'DAXServiceRole', {
      assumedBy: new iam.ServicePrincipal('dax.amazonaws.com'),
      inlinePolicies: {
        DAXServicePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:DescribeTable',
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:ConditionCheckItem',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Grant DAX access to DynamoDB tables
    props.tables.forEach((table, index) => {
      table.grantReadWriteData(daxRole);
    });

    // Create parameter group for DAX with healthcare-optimized settings
    const parameterGroup = new dax.CfnParameterGroup(this, 'DAXParameterGroup', {
      parameterGroupName: 'healthcare-app-dax-params',
      description: 'Parameter group optimized for healthcare queries',
      parameterNameValues: {
        // Optimize for healthcare query patterns
        'query-ttl-millis': '300000', // 5 minutes TTL for query cache
        'record-ttl-millis': '300000', // 5 minutes TTL for item cache
      },
    });

    // Create DAX cluster
    this.cluster = new dax.CfnCluster(this, 'DAXCluster', {
      clusterName: 'healthcare-app-dax-cluster',
      description: 'DAX cluster for Healthcare App with microsecond latency',
      nodeType: 'dax.r4.large', // Optimized for healthcare workloads
      replicationFactor: 3, // High availability for healthcare data
      iamRoleArn: daxRole.roleArn,
      subnetGroupName: subnetGroup.subnetGroupName,
      securityGroupIds: [securityGroup.securityGroupId],
      parameterGroupName: parameterGroup.parameterGroupName,
      // Enable encryption at rest
      sseSpecification: {
        sseEnabled: true,
      },
      // Configure cluster endpoint encryption
      clusterEndpointEncryptionType: 'TLS',
      // Tags for compliance and cost tracking
      tags: {
        'Application': 'HealthcareTrackingApp',
        'Environment': 'Production',
        'DataClassification': 'HealthcareData',
        'Compliance': 'HIPAA',
      },
    });

    // Set dependencies
    this.cluster.addDependency(subnetGroup);
    this.cluster.addDependency(parameterGroup);

    // Store endpoint for client configuration
    this.endpoint = this.cluster.attrClusterDiscoveryEndpoint;
  }

  /**
   * Get the DAX client configuration for the application
   */
  public getClientConfig(): {
    endpoint: string;
    region: string;
    encryption: boolean;
  } {
    return {
      endpoint: this.endpoint,
      region: this.cluster.stack.region,
      encryption: true,
    };
  }
}

/**
 * Configuration for critical healthcare queries that benefit from DAX caching
 */
export const CRITICAL_QUERY_PATTERNS = {
  // Patient emergency information - needs microsecond access
  PATIENT_EMERGENCY: [
    'getPatient',
    'listPatientsByCaregiver',
  ],
  // Medication due now - time-critical queries
  MEDICATION_DUE: [
    'listMedicationsByNextDue',
    'getMedicationLog',
  ],
  // Upcoming appointments - frequently accessed
  APPOINTMENTS_TODAY: [
    'listAppointmentsByDate',
    'getAppointment',
  ],
  // Real-time messaging - high frequency reads
  MESSAGES_RECENT: [
    'listMessagesByPatient',
    'listNotificationsByUser',
  ],
  // User authentication and profiles - session data
  USER_SESSION: [
    'getUserProfile',
    'listUserProfilesByEmail',
  ],
};

/**
 * DAX-optimized query configurations
 */
export const DAX_QUERY_CONFIG = {
  // Emergency queries - no TTL, always fresh
  EMERGENCY: {
    ttl: 0,
    consistentRead: true,
  },
  // Medication queries - 1 minute TTL
  MEDICATION: {
    ttl: 60000,
    consistentRead: false,
  },
  // Appointment queries - 5 minute TTL
  APPOINTMENT: {
    ttl: 300000,
    consistentRead: false,
  },
  // Message queries - 30 second TTL
  MESSAGE: {
    ttl: 30000,
    consistentRead: false,
  },
  // User profile queries - 15 minute TTL
  USER_PROFILE: {
    ttl: 900000,
    consistentRead: false,
  },
};
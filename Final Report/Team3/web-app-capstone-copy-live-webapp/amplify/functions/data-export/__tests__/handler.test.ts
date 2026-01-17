import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { handler } from '../handler';
import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

// Helper function to ensure proper typing
const callHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return handler(event, context, vi.fn()) as Promise<APIGatewayProxyResult>;
};

// Mock AWS SDK clients
const mockSend = vi.fn();
const mockGetSignedUrl = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: mockSend,
    })),
  },
  QueryCommand: vi.fn((params) => params),
  ScanCommand: vi.fn((params) => params),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({})),
  PutObjectCommand: vi.fn((params) => params),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'mock-password'),
  })),
  createCipher: vi.fn(() => ({
    update: vi.fn(() => 'encrypted-'),
    final: vi.fn(() => 'data'),
  })),
}));

describe('Data Export Handler', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'data-export-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:data-export-handler',
    memoryLimitInMB: '256',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/data-export-handler',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.USERPROFILE_TABLE_NAME = 'UserProfile-test';
    process.env.PATIENT_TABLE_NAME = 'Patient-test';
    process.env.PATIENTCAREGIVER_TABLE_NAME = 'PatientCaregiver-test';
    process.env.MEDICATION_TABLE_NAME = 'Medication-test';
    process.env.MEDICATIONLOG_TABLE_NAME = 'MedicationLog-test';
    process.env.APPOINTMENT_TABLE_NAME = 'Appointment-test';
    process.env.MESSAGE_TABLE_NAME = 'Message-test';
    process.env.NOTIFICATION_TABLE_NAME = 'Notification-test';
    process.env.CAREGIVERINVITATION_TABLE_NAME = 'CaregiverInvitation-test';
    process.env.STORAGE_BUCKET_NAME = 'test-bucket';
  });

  it('should return 400 when userId is missing', async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({}),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'User ID is required',
    });
  });

  it('should export user data successfully', async () => {
    const userId = 'test-user-123';
    
    // Mock DynamoDB responses
    mockSend
      // User profile query
      .mockResolvedValueOnce({
        Items: [{
          id: 'profile-1',
          userId: userId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }],
      })
      // Patient caregiver relationships
      .mockResolvedValueOnce({
        Items: [{
          id: 'relationship-1',
          patientId: 'patient-1',
          caregiverId: userId,
          role: 'primary',
        }],
      })
      // Patient details
      .mockResolvedValueOnce({
        Items: [{
          id: 'patient-1',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1980-01-01',
        }],
      })
      // Medications for patient
      .mockResolvedValueOnce({
        Items: [{
          id: 'medication-1',
          patientId: 'patient-1',
          name: 'Test Medication',
          dosage: '10mg',
        }],
      })
      // Medication logs
      .mockResolvedValueOnce({
        Items: [{
          id: 'log-1',
          medicationId: 'medication-1',
          takenAt: '2023-01-01T10:00:00Z',
          status: 'taken',
        }],
      })
      // Appointments for patient
      .mockResolvedValueOnce({
        Items: [{
          id: 'appointment-1',
          patientId: 'patient-1',
          title: 'Doctor Visit',
          appointmentDate: '2023-01-15',
        }],
      })
      // Messages for patient
      .mockResolvedValueOnce({
        Items: [{
          id: 'message-1',
          patientId: 'patient-1',
          senderId: userId,
          content: 'Test message',
        }],
      })
      // Notifications for user
      .mockResolvedValueOnce({
        Items: [{
          id: 'notification-1',
          userId: userId,
          type: 'medication_due',
          title: 'Medication Reminder',
        }],
      })
      // Sent invitations
      .mockResolvedValueOnce({
        Items: [{
          id: 'invitation-1',
          invitedBy: userId,
          invitedEmail: 'invited@example.com',
          status: 'pending',
        }],
      })
      // Received invitations
      .mockResolvedValueOnce({
        Items: [],
      });

    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com');

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({ userId }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(200);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.success).toBe(true);
    expect(responseBody.downloadUrl).toBe('https://signed-url.example.com');
    expect(responseBody.exportPassword).toBe('mock-password');
    expect(responseBody.metadata).toEqual({
      exportedAt: expect.any(String),
      exportedBy: userId,
      version: '1.0',
      totalRecords: 8, // 1 profile + 1 patient + 1 medication + 1 log + 1 appointment + 1 message + 1 notification + 1 invitation
    });
    expect(responseBody.message).toContain('Data export completed successfully');
  });

  it('should handle DynamoDB query errors gracefully', async () => {
    const userId = 'test-user-123';
    
    // Mock DynamoDB error for user profile query
    mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({ userId }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(500);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('Failed to export data');
    expect(responseBody.details).toBe('DynamoDB error');
  });

  it('should handle S3 upload errors', async () => {
    const userId = 'test-user-123';
    
    // Mock successful DynamoDB queries
    mockSend
      .mockResolvedValueOnce({ Items: [] }) // User profile
      .mockResolvedValueOnce({ Items: [] }); // Patient caregiver relationships

    // Mock S3 upload error
    mockSend.mockRejectedValueOnce(new Error('S3 upload failed'));

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({ userId }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(500);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('Failed to generate download link');
    expect(responseBody.details).toBe('S3 upload failed');
  });

  it('should handle malformed JSON in request body', async () => {
    const event: APIGatewayProxyEvent = {
      body: 'invalid json',
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(500);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('Internal server error');
  });

  it('should handle empty patient caregiver relationships', async () => {
    const userId = 'test-user-123';
    
    // Mock DynamoDB responses with no patient relationships
    mockSend
      .mockResolvedValueOnce({
        Items: [{
          id: 'profile-1',
          userId: userId,
          email: 'test@example.com',
        }],
      })
      .mockResolvedValueOnce({ Items: [] }) // No patient relationships
      .mockResolvedValueOnce({ Items: [] }) // No notifications
      .mockResolvedValueOnce({ Items: [] }) // No sent invitations
      .mockResolvedValueOnce({ Items: [] }); // No received invitations

    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com');

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({ userId }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(200);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.success).toBe(true);
    expect(responseBody.metadata.totalRecords).toBe(1); // Only user profile
  });

  it('should deduplicate invitations correctly', async () => {
    const userId = 'test-user-123';
    const userEmail = 'test@example.com';
    
    // Mock DynamoDB responses
    mockSend
      .mockResolvedValueOnce({
        Items: [{
          id: 'profile-1',
          userId: userId,
          email: userEmail,
        }],
      })
      .mockResolvedValueOnce({ Items: [] }) // No patient relationships
      .mockResolvedValueOnce({ Items: [] }) // No notifications
      .mockResolvedValueOnce({
        Items: [{
          id: 'invitation-1',
          invitedBy: userId,
          invitedEmail: 'other@example.com',
        }],
      }) // Sent invitations
      .mockResolvedValueOnce({
        Items: [{
          id: 'invitation-1', // Same ID as sent invitation
          invitedBy: 'other-user',
          invitedEmail: userEmail,
        }],
      }); // Received invitations (duplicate)

    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com');

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({ userId }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/export',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await callHandler(event, mockContext);

    expect(result.statusCode).toBe(200);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.success).toBe(true);
    expect(responseBody.metadata.totalRecords).toBe(2); // User profile + 1 unique invitation
  });
});
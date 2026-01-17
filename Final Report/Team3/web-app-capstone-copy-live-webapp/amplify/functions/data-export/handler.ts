import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface ExportData {
  userProfile: any;
  patients: any[];
  medications: any[];
  medicationLogs: any[];
  appointments: any[];
  messages: any[];
  notifications: any[];
  invitations: any[];
  exportMetadata: {
    exportedAt: string;
    exportedBy: string;
    version: string;
    totalRecords: number;
  };
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  try {
    const { userId } = JSON.parse(event.body || '{}');
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'User ID is required',
        }),
      };
    }

    console.log(`Starting data export for user: ${userId}`);

    // Initialize export data structure
    const exportData: ExportData = {
      userProfile: null,
      patients: [],
      medications: [],
      medicationLogs: [],
      appointments: [],
      messages: [],
      notifications: [],
      invitations: [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        version: '1.0',
        totalRecords: 0,
      },
    };

    // Get user profile
    try {
      const userProfileResult = await docClient.send(new QueryCommand({
        TableName: process.env.USERPROFILE_TABLE_NAME,
        IndexName: 'byUserId',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));
      
      if (userProfileResult.Items && userProfileResult.Items.length > 0) {
        exportData.userProfile = userProfileResult.Items[0];
        exportData.exportMetadata.totalRecords += 1;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }

    // Get patients where user is a caregiver
    try {
      const patientCaregiverResult = await docClient.send(new QueryCommand({
        TableName: process.env.PATIENTCAREGIVER_TABLE_NAME,
        IndexName: 'byCaregiverId',
        KeyConditionExpression: 'caregiverId = :caregiverId',
        ExpressionAttributeValues: {
          ':caregiverId': userId,
        },
      }));

      const patientIds: string[] = [];
      
      if (patientCaregiverResult.Items) {
        for (const relationship of patientCaregiverResult.Items) {
          patientIds.push(relationship.patientId);
          
          // Get patient details
          const patientResult = await docClient.send(new QueryCommand({
            TableName: process.env.PATIENT_TABLE_NAME,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
              ':id': relationship.patientId,
            },
          }));
          
          if (patientResult.Items && patientResult.Items.length > 0) {
            exportData.patients.push(patientResult.Items[0]);
            exportData.exportMetadata.totalRecords += 1;
          }
        }
      }

      // Get medications for all patients
      for (const patientId of patientIds) {
        try {
          const medicationsResult = await docClient.send(new QueryCommand({
            TableName: process.env.MEDICATION_TABLE_NAME,
            IndexName: 'byPatientId',
            KeyConditionExpression: 'patientId = :patientId',
            ExpressionAttributeValues: {
              ':patientId': patientId,
            },
          }));
          
          if (medicationsResult.Items) {
            exportData.medications.push(...medicationsResult.Items);
            exportData.exportMetadata.totalRecords += medicationsResult.Items.length;
            
            // Get medication logs for each medication
            for (const medication of medicationsResult.Items) {
              const logsResult = await docClient.send(new QueryCommand({
                TableName: process.env.MEDICATIONLOG_TABLE_NAME,
                IndexName: 'byMedicationId',
                KeyConditionExpression: 'medicationId = :medicationId',
                ExpressionAttributeValues: {
                  ':medicationId': medication.id,
                },
              }));
              
              if (logsResult.Items) {
                exportData.medicationLogs.push(...logsResult.Items);
                exportData.exportMetadata.totalRecords += logsResult.Items.length;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching medications for patient ${patientId}:`, error);
        }
      }

      // Get appointments for all patients
      for (const patientId of patientIds) {
        try {
          const appointmentsResult = await docClient.send(new QueryCommand({
            TableName: process.env.APPOINTMENT_TABLE_NAME,
            IndexName: 'byPatientId',
            KeyConditionExpression: 'patientId = :patientId',
            ExpressionAttributeValues: {
              ':patientId': patientId,
            },
          }));
          
          if (appointmentsResult.Items) {
            exportData.appointments.push(...appointmentsResult.Items);
            exportData.exportMetadata.totalRecords += appointmentsResult.Items.length;
          }
        } catch (error) {
          console.error(`Error fetching appointments for patient ${patientId}:`, error);
        }
      }

      // Get messages for all patients
      for (const patientId of patientIds) {
        try {
          const messagesResult = await docClient.send(new QueryCommand({
            TableName: process.env.MESSAGE_TABLE_NAME,
            IndexName: 'byPatientId',
            KeyConditionExpression: 'patientId = :patientId',
            ExpressionAttributeValues: {
              ':patientId': patientId,
            },
          }));
          
          if (messagesResult.Items) {
            exportData.messages.push(...messagesResult.Items);
            exportData.exportMetadata.totalRecords += messagesResult.Items.length;
          }
        } catch (error) {
          console.error(`Error fetching messages for patient ${patientId}:`, error);
        }
      }

      // Get notifications for user
      try {
        const notificationsResult = await docClient.send(new QueryCommand({
          TableName: process.env.NOTIFICATION_TABLE_NAME,
          IndexName: 'byUserId',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId,
          },
        }));
        
        if (notificationsResult.Items) {
          exportData.notifications.push(...notificationsResult.Items);
          exportData.exportMetadata.totalRecords += notificationsResult.Items.length;
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }

      // Get invitations sent and received by user
      try {
        const sentInvitationsResult = await docClient.send(new QueryCommand({
          TableName: process.env.CAREGIVERINVITATION_TABLE_NAME,
          IndexName: 'byInvitedBy',
          KeyConditionExpression: 'invitedBy = :invitedBy',
          ExpressionAttributeValues: {
            ':invitedBy': userId,
          },
        }));
        
        if (sentInvitationsResult.Items) {
          exportData.invitations.push(...sentInvitationsResult.Items);
          exportData.exportMetadata.totalRecords += sentInvitationsResult.Items.length;
        }

        // Get received invitations
        const receivedInvitationsResult = await docClient.send(new QueryCommand({
          TableName: process.env.CAREGIVERINVITATION_TABLE_NAME,
          IndexName: 'byInvitedEmail',
          KeyConditionExpression: 'invitedEmail = :invitedEmail',
          ExpressionAttributeValues: {
            ':invitedEmail': exportData.userProfile?.email || '',
          },
        }));
        
        if (receivedInvitationsResult.Items) {
          // Avoid duplicates
          const existingIds = new Set(exportData.invitations.map(inv => inv.id));
          const newInvitations = receivedInvitationsResult.Items.filter(inv => !existingIds.has(inv.id));
          exportData.invitations.push(...newInvitations);
          exportData.exportMetadata.totalRecords += newInvitations.length;
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }

    } catch (error) {
      console.error('Error during data export:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to export data',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }

    // Generate export file
    const exportJson = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportKey = `exports/${userId}/healthcare-data-export-${timestamp}.json`;

    // Encrypt the export data (in a real implementation, you'd use proper encryption)
    const exportPassword = crypto.randomBytes(16).toString('hex');
    const cipher = crypto.createCipher('aes-256-cbc', exportPassword);
    let encryptedData = cipher.update(exportJson, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    // Upload to S3
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.STORAGE_BUCKET_NAME,
        Key: exportKey,
        Body: encryptedData,
        ContentType: 'application/json',
        Metadata: {
          'user-id': userId,
          'export-password': exportPassword,
          'total-records': exportData.exportMetadata.totalRecords.toString(),
        },
      }));

      // Generate presigned URL for download (expires in 24 hours)
      const downloadUrl = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: process.env.STORAGE_BUCKET_NAME,
          Key: exportKey,
        }),
        { expiresIn: 86400 } // 24 hours
      );

      console.log(`Data export completed for user ${userId}. Total records: ${exportData.exportMetadata.totalRecords}`);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          downloadUrl,
          exportPassword,
          metadata: exportData.exportMetadata,
          message: 'Data export completed successfully. The download link will expire in 24 hours.',
        }),
      };

    } catch (error) {
      console.error('Error uploading export to S3:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to generate download link',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }

  } catch (error) {
    console.error('Unexpected error in data export handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
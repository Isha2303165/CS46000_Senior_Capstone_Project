import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomBytes } from 'crypto';

const sesClient = new SESClient({ region: process.env.SES_REGION || 'us-east-1' });

export interface InvitationEvent {
  action: 'send' | 'validate' | 'accept';
  invitationData?: {
    invitedEmail: string;
    inviterName: string;
    patientName: string;
    role: string;
    personalMessage?: string;
  };
  token?: string;
  acceptanceData?: {
    userId: string;
    invitationId: string;
  };
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    expiresAt?: string;
    isValid?: boolean;
    invitationId?: string;
  };
  error?: string;
}

export const handler = async (event: InvitationEvent): Promise<InvitationResponse> => {
  try {
    switch (event.action) {
      case 'send':
        return await sendInvitation(event.invitationData!);
      case 'validate':
        return await validateToken(event.token!);
      case 'accept':
        return await acceptInvitation(event.acceptanceData!);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Invitation handler error:', error);
    return {
      success: false,
      message: 'An error occurred processing the invitation',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

async function sendInvitation(invitationData: InvitationEvent['invitationData']): Promise<InvitationResponse> {
  if (!invitationData) {
    throw new Error('Invitation data is required');
  }

  // Generate secure token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Create invitation link
  const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;

  // Prepare email content
  const emailHtml = createInvitationEmailTemplate({
    inviterName: invitationData.inviterName,
    patientName: invitationData.patientName,
    role: invitationData.role,
    personalMessage: invitationData.personalMessage,
    invitationLink,
  });

  const emailText = createInvitationEmailText({
    inviterName: invitationData.inviterName,
    patientName: invitationData.patientName,
    role: invitationData.role,
    personalMessage: invitationData.personalMessage,
    invitationLink,
  });

  // Send email via SES
  const sendEmailCommand = new SendEmailCommand({
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [invitationData.invitedEmail],
    },
    Message: {
      Subject: {
        Data: `Healthcare caregiver Invitation - ${invitationData.patientName}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailHtml,
          Charset: 'UTF-8',
        },
        Text: {
          Data: emailText,
          Charset: 'UTF-8',
        },
      },
    },
  });

  await sesClient.send(sendEmailCommand);

  return {
    success: true,
    message: 'Invitation sent successfully',
    data: {
      token,
      expiresAt,
    },
  };
}

async function validateToken(token: string): Promise<InvitationResponse> {
  // In a real implementation, this would check the token against the database
  // For now, we'll do basic validation
  if (!token || token.length < 32) {
    return {
      success: false,
      message: 'Invalid token format',
      data: { isValid: false },
    };
  }

  return {
    success: true,
    message: 'Token is valid',
    data: { isValid: true },
  };
}

async function acceptInvitation(acceptanceData: InvitationEvent['acceptanceData']): Promise<InvitationResponse> {
  if (!acceptanceData) {
    throw new Error('Acceptance data is required');
  }

  // In a real implementation, this would:
  // 1. Validate the invitation exists and is not expired
  // 2. Create the PatientCaregiver relationship
  // 3. Update the invitation status to 'accepted'
  // 4. Send confirmation emails

  return {
    success: true,
    message: 'Invitation accepted successfully',
    data: {
      invitationId: acceptanceData.invitationId,
    },
  };
}

function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

function createInvitationEmailTemplate(data: {
  inviterName: string;
  patientName: string;
  role: string;
  personalMessage?: string;
  invitationLink: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Healthcare caregiver Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .personal-message {
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 4px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏥 Healthcare Tracker</div>
            <h1 class="title">You've been invited to join a caregiver</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p><strong>${data.inviterName}</strong> has invited you to join the caregiver for <strong>${data.patientName}</strong> as a <strong>${data.role}</strong> caregiver.</p>
            
            ${data.personalMessage ? `
            <div class="personal-message">
                <strong>Personal message from ${data.inviterName}:</strong><br>
                "${data.personalMessage}"
            </div>
            ` : ''}
            
            <p>As a member of the caregiver, you'll be able to:</p>
            <ul>
                <li>View and manage patient information</li>
                <li>Track medications and schedules</li>
                <li>Coordinate appointments</li>
                <li>Communicate with other caregivers</li>
                <li>Receive important notifications</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="${data.invitationLink}" class="cta-button">Accept Invitation</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> This invitation will expire in 7 days. If you don't have an account, you'll be able to create one when you accept the invitation.
            </div>
            
            <p>If you're unable to click the button above, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${data.invitationLink}
            </p>
        </div>
        
        <div class="footer">
            <p>This invitation was sent by ${data.inviterName} through the Healthcare Tracker app.</p>
            <p>If you believe you received this email in error, please ignore it.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

function createInvitationEmailText(data: {
  inviterName: string;
  patientName: string;
  role: string;
  personalMessage?: string;
  invitationLink: string;
}): string {
  return `
Healthcare caregiver Invitation

Hello,

${data.inviterName} has invited you to join the caregiver for ${data.patientName} as a ${data.role} caregiver.

${data.personalMessage ? `Personal message from ${data.inviterName}: "${data.personalMessage}"` : ''}

As a member of the caregiver, you'll be able to:
- View and manage patient information
- Track medications and schedules
- Coordinate appointments
- Communicate with other caregivers
- Receive important notifications

To accept this invitation, please visit:
${data.invitationLink}

IMPORTANT: This invitation will expire in 7 days. If you don't have an account, you'll be able to create one when you accept the invitation.

This invitation was sent by ${data.inviterName} through the Healthcare Tracker app.
If you believe you received this email in error, please ignore it.
  `.trim();
}
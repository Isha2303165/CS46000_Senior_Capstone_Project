// AWS SES integration for appointment reminders and notifications
// This would typically use AWS SDK in a real implementation

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface AppointmentReminderData {
  appointmentId: string;
  clientName: string;
  appointmentTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  providerName: string;
  providerPhone?: string;
  locationType: 'in_person' | 'telehealth' | 'phone';
  address?: string;
  roomNumber?: string;
  teleHealthLink?: string;
  preparationInstructions?: string;
  documentsNeeded?: string[];
  caregiverEmails: string[];
  hoursBeforeAppointment: number;
}

export interface AppointmentUpdateData {
  appointmentId: string;
  clientName: string;
  appointmentTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  providerName: string;
  changeType: 'created' | 'updated' | 'cancelled' | 'confirmed';
  changedBy: string;
  caregiverEmails: string[];
  changes?: Record<string, { old: any; new: any }>;
}

export interface InvitationEmailData {
  to: string;
  inviterName: string;
  clientName: string;
  role: string;
  personalMessage?: string;
  invitationLink: string;
}

class SESEmailService {
  private fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@healthcareapp.com';
  private sentEmails: Map<string, any> = new Map(); // Mock storage for sent emails

  async sendAppointmentReminder(data: AppointmentReminderData): Promise<void> {
    const template = this.generateAppointmentReminderTemplate(data);
    
    for (const email of data.caregiverEmails) {
      try {
        await this.sendEmail({
          to: email,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          messageId: `appointment-reminder-${data.appointmentId}-${data.hoursBeforeAppointment}h-${email}`,
        });
      } catch (error) {
        console.error(`Failed to send appointment reminder to ${email}:`, error);
      }
    }
  }

  async sendAppointmentUpdate(data: AppointmentUpdateData): Promise<void> {
    const template = this.generateAppointmentUpdateTemplate(data);
    
    for (const email of data.caregiverEmails) {
      try {
        await this.sendEmail({
          to: email,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          messageId: `appointment-update-${data.appointmentId}-${data.changeType}-${email}`,
        });
      } catch (error) {
        console.error(`Failed to send appointment update to ${email}:`, error);
      }
    }
  }

  async sendUrgentAppointmentAlert(
    appointmentId: string,
    clientName: string,
    message: string,
    caregiverEmails: string[]
  ): Promise<void> {
    const subject = `🚨 Urgent: ${clientName} Appointment Alert`;
    const htmlBody = this.generateUrgentAlertTemplate(clientName, message);
    const textBody = `URGENT APPOINTMENT ALERT\n\nClient: ${clientName}\n\n${message}`;

    for (const email of caregiverEmails) {
      try {
        await this.sendEmail({
          to: email,
          subject,
          htmlBody,
          textBody,
          messageId: `urgent-appointment-${appointmentId}-${email}`,
          priority: 'high',
        });
      } catch (error) {
        console.error(`Failed to send urgent appointment alert to ${email}:`, error);
      }
    }
  }

  async sendCaregiverInvitation(data: InvitationEmailData): Promise<void> {
    const template = this.generateInvitationTemplate(data);
    
    try {
      await this.sendEmail({
        to: data.to,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        messageId: `caregiver-invitation-${data.clientName}-${data.to}`,
        priority: 'normal',
      });
    } catch (error) {
      console.error(`Failed to send caregiver invitation to ${data.to}:`, error);
      throw error;
    }
  }

  private async sendEmail({
    to,
    subject,
    htmlBody,
    textBody,
    messageId,
    priority = 'normal',
  }: {
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    messageId: string;
    priority?: 'normal' | 'high';
  }): Promise<void> {
    // Mock implementation - in production this would use AWS SES
    const emailData = {
      messageId,
      to,
      from: this.fromEmail,
      subject,
      htmlBody,
      textBody,
      priority,
      sentAt: new Date().toISOString(),
    };

    this.sentEmails.set(messageId, emailData);
    

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Example AWS SES implementation:
    /*
    const ses = new SESClient({ region: 'us-east-1' });
    
    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
      Tags: [
        {
          Name: 'MessageType',
          Value: 'AppointmentReminder',
        },
        {
          Name: 'Priority',
          Value: priority,
        },
      ],
    };

    if (priority === 'high') {
      params.MessageAttributes = {
        priority: {
          DataType: 'String',
          StringValue: 'high',
        },
      };
    }

    const result = await ses.send(new SendEmailCommand(params));
    */
  }

  private generateAppointmentReminderTemplate(data: AppointmentReminderData): EmailTemplate {
    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const subject = `Reminder: ${data.clientName}'s ${data.appointmentTitle} - ${formattedDate} at ${formattedTime}`;

    const locationInfo = this.getLocationInfo(data);
    const preparationSection = this.getPreparationSection(data);

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { font-weight: bold; min-width: 120px; }
    .detail-value { flex: 1; }
    .preparation { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    .documents { background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px; }
    .urgent { background: #fef2f2; border-left-color: #ef4444; }
    .high-priority { background: #fff7ed; border-left-color: #f97316; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📅 Appointment Reminder</h1>
    <p>${data.hoursBeforeAppointment} hours until your appointment</p>
  </div>
  
  <div class="content">
    <div class="appointment-card ${data.hoursBeforeAppointment <= 2 ? 'urgent' : ''}">
      <h2>${data.appointmentTitle}</h2>
      
      <div class="detail-row">
        <div class="detail-label">Client:</div>
        <div class="detail-value">${data.clientName}</div>
      </div>
      
      <div class="detail-row">
        <div class="detail-label">Date:</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      
      <div class="detail-row">
        <div class="detail-label">Time:</div>
        <div class="detail-value">${formattedTime} (${data.duration} minutes)</div>
      </div>
      
      <div class="detail-row">
        <div class="detail-label">Provider:</div>
        <div class="detail-value">${data.providerName}${data.providerPhone ? ` - ${data.providerPhone}` : ''}</div>
      </div>
      
      ${locationInfo}
    </div>
    
    ${preparationSection}
    
    <div class="footer">
      <p>This is an automated reminder from your Healthcare Tracking App.</p>
      <p>If you need to reschedule or cancel, please contact your healthcare provider.</p>
    </div>
  </div>
</body>
</html>`;

    const textBody = `
APPOINTMENT REMINDER - ${data.hoursBeforeAppointment} hours until your appointment

${data.appointmentTitle}
Client: ${data.clientName}
Date: ${formattedDate}
Time: ${formattedTime} (${data.duration} minutes)
Provider: ${data.providerName}${data.providerPhone ? ` - ${data.providerPhone}` : ''}

${this.getLocationInfoText(data)}

${this.getPreparationSectionText(data)}

This is an automated reminder from your Healthcare Tracking App.
If you need to reschedule or cancel, please contact your healthcare provider.
`;

    return { subject, htmlBody, textBody };
  }

  private generateAppointmentUpdateTemplate(data: AppointmentUpdateData): EmailTemplate {
    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const actionText = {
      created: 'scheduled',
      updated: 'updated',
      cancelled: 'cancelled',
      confirmed: 'confirmed',
    }[data.changeType];

    const subject = `Appointment ${actionText}: ${data.clientName}'s ${data.appointmentTitle}`;

    const changesSection = data.changes ? this.getChangesSection(data.changes) : '';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .header.cancelled { background: #dc2626; }
    .header.updated { background: #d97706; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .appointment-card.cancelled { border-left-color: #dc2626; }
    .appointment-card.updated { border-left-color: #d97706; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { font-weight: bold; min-width: 120px; }
    .detail-value { flex: 1; }
    .changes { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .change-item { margin: 5px 0; }
    .old-value { text-decoration: line-through; color: #6b7280; }
    .new-value { font-weight: bold; color: #059669; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header ${data.changeType}">
    <h1>📅 Appointment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h1>
    <p>Updated by ${data.changedBy}</p>
  </div>
  
  <div class="content">
    <div class="appointment-card ${data.changeType}">
      <h2>${data.appointmentTitle}</h2>
      
      <div class="detail-row">
        <div class="detail-label">Client:</div>
        <div class="detail-value">${data.clientName}</div>
      </div>
      
      <div class="detail-row">
        <div class="detail-label">Date:</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      
      <div class="detail-row">
        <div class="detail-label">Time:</div>
        <div class="detail-value">${formattedTime}</div>
      </div>
      
      <div class="detail-row">
        <div class="detail-label">Provider:</div>
        <div class="detail-value">${data.providerName}</div>
      </div>
    </div>
    
    ${changesSection}
    
    <div class="footer">
      <p>This notification was sent from your Healthcare Tracking App.</p>
      <p>All caregivers for ${data.clientName} have been notified of this change.</p>
    </div>
  </div>
</body>
</html>`;

    const textBody = `
APPOINTMENT ${actionText.toUpperCase()}

${data.appointmentTitle}
Client: ${data.clientName}
Date: ${formattedDate}
Time: ${formattedTime}
Provider: ${data.providerName}

Updated by: ${data.changedBy}

${data.changes ? this.getChangesSectionText(data.changes) : ''}

This notification was sent from your Healthcare Tracking App.
All caregivers for ${data.clientName} have been notified of this change.
`;

    return { subject, htmlBody, textBody };
  }

  private generateUrgentAlertTemplate(clientName: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent Appointment Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #fef2f2; padding: 20px; border: 2px solid #dc2626; border-top: none; }
    .alert-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #fca5a5; color: #7f1d1d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 URGENT APPOINTMENT ALERT</h1>
    <p>Immediate attention required</p>
  </div>
  
  <div class="content">
    <div class="alert-box">
      <h2>Client: ${clientName}</h2>
      <p>${message}</p>
    </div>
    
    <div class="footer">
      <p><strong>This is an urgent alert from your Healthcare Tracking App.</strong></p>
      <p>Please take immediate action as required.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateInvitationTemplate(data: InvitationEmailData): EmailTemplate {
    const subject = `Healthcare caregiver Invitation - ${data.clientName}`;

    const htmlBody = `
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
            
            <p><strong>${data.inviterName}</strong> has invited you to join the caregiver for <strong>${data.clientName}</strong> as a <strong>${data.role}</strong> caregiver.</p>
            
            ${data.personalMessage ? `
            <div class="personal-message">
                <strong>Personal message from ${data.inviterName}:</strong><br>
                "${data.personalMessage}"
            </div>
            ` : ''}
            
            <p>As a member of the caregiver, you'll be able to:</p>
            <ul>
                <li>View and manage client information</li>
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
</html>`;

    const textBody = `
Healthcare caregiver Invitation

Hello,

${data.inviterName} has invited you to join the caregiver for ${data.clientName} as a ${data.role} caregiver.

${data.personalMessage ? `Personal message from ${data.inviterName}: "${data.personalMessage}"` : ''}

As a member of the caregiver, you'll be able to:
- View and manage client information
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

    return { subject, htmlBody, textBody };
  }

  private getLocationInfo(data: AppointmentReminderData): string {
    switch (data.locationType) {
      case 'in_person':
        return `
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">
              📍 In Person<br>
              ${data.address || 'Address not specified'}
              ${data.roomNumber ? `<br>Room: ${data.roomNumber}` : ''}
            </div>
          </div>`;
      case 'telehealth':
        return `
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">
              💻 Telehealth<br>
              ${data.teleHealthLink ? `<a href="${data.teleHealthLink}">Join Video Call</a>` : 'Video link will be provided'}
            </div>
          </div>`;
      case 'phone':
        return `
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">📞 Phone Call</div>
          </div>`;
      default:
        return '';
    }
  }

  private getLocationInfoText(data: AppointmentReminderData): string {
    switch (data.locationType) {
      case 'in_person':
        return `Location: In Person\n${data.address || 'Address not specified'}${data.roomNumber ? `\nRoom: ${data.roomNumber}` : ''}`;
      case 'telehealth':
        return `Location: Telehealth\n${data.teleHealthLink ? `Video Link: ${data.teleHealthLink}` : 'Video link will be provided'}`;
      case 'phone':
        return 'Location: Phone Call';
      default:
        return '';
    }
  }

  private getPreparationSection(data: AppointmentReminderData): string {
    let section = '';

    if (data.preparationInstructions) {
      section += `
        <div class="preparation">
          <h3>📋 Preparation Instructions</h3>
          <p>${data.preparationInstructions}</p>
        </div>`;
    }

    if (data.documentsNeeded && data.documentsNeeded.length > 0) {
      section += `
        <div class="documents">
          <h3>📄 Documents to Bring</h3>
          <ul>
            ${data.documentsNeeded.map(doc => `<li>${doc}</li>`).join('')}
          </ul>
        </div>`;
    }

    return section;
  }

  private getPreparationSectionText(data: AppointmentReminderData): string {
    let section = '';

    if (data.preparationInstructions) {
      section += `\nPREPARATION INSTRUCTIONS:\n${data.preparationInstructions}\n`;
    }

    if (data.documentsNeeded && data.documentsNeeded.length > 0) {
      section += `\nDOCUMENTS TO BRING:\n${data.documentsNeeded.map(doc => `- ${doc}`).join('\n')}\n`;
    }

    return section;
  }

  private getChangesSection(changes: Record<string, { old: any; new: any }>): string {
    const changeItems = Object.entries(changes).map(([field, change]) => {
      const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `
        <div class="change-item">
          <strong>${fieldLabel}:</strong>
          <span class="old-value">${change.old}</span> → 
          <span class="new-value">${change.new}</span>
        </div>`;
    }).join('');

    return `
      <div class="changes">
        <h3>📝 Changes Made</h3>
        ${changeItems}
      </div>`;
  }

  private getChangesSectionText(changes: Record<string, { old: any; new: any }>): string {
    const changeItems = Object.entries(changes).map(([field, change]) => {
      const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `${fieldLabel}: ${change.old} → ${change.new}`;
    }).join('\n');

    return `\nCHANGES MADE:\n${changeItems}\n`;
  }

  // Utility methods for testing and monitoring
  getSentEmails(): Array<any> {
    return Array.from(this.sentEmails.values());
  }

  clearSentEmails(): void {
    this.sentEmails.clear();
  }

  getEmailById(messageId: string): any {
    return this.sentEmails.get(messageId);
  }
}

// Export singleton instance
export const sesEmailService = new SESEmailService();

// React hook for SES email integration
export function useAppointmentEmails() {
  const sendReminder = async (data: AppointmentReminderData) => {
    try {
      await sesEmailService.sendAppointmentReminder(data);
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      throw error;
    }
  };

  const sendUpdate = async (data: AppointmentUpdateData) => {
    try {
      await sesEmailService.sendAppointmentUpdate(data);
    } catch (error) {
      console.error('Error sending appointment update:', error);
      throw error;
    }
  };

  const sendUrgentAlert = async (
    appointmentId: string,
    clientName: string,
    message: string,
    caregiverEmails: string[]
  ) => {
    try {
      await sesEmailService.sendUrgentAppointmentAlert(appointmentId, clientName, message, caregiverEmails);
    } catch (error) {
      console.error('Error sending urgent appointment alert:', error);
      throw error;
    }
  };

  return {
    sendReminder,
    sendUpdate,
    sendUrgentAlert,
  };
}

// React hook for invitation emails
export function useInvitationEmails() {
  const sendInvitation = async (data: InvitationEmailData) => {
    try {
      await sesEmailService.sendCaregiverInvitation(data);
    } catch (error) {
      console.error('Error sending caregiver invitation:', error);
      throw error;
    }
  };

  return {
    sendInvitation,
  };
}
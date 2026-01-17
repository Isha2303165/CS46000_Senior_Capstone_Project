/**
 * Appointment Reminder System
 * Handles scheduling and sending reminders for appointments via multiple channels
 */

import { addHours, addDays, isBefore, isAfter, differenceInMinutes } from 'date-fns';
import { sendEmailReminder } from './ses-email-service';
import { pushNotificationService } from './push-notifications';
import { scheduleEventBridgeTask } from './eventbridge-scheduler';
import type { Appointment } from '@/types';

export interface ReminderConfig {
  id: string;
  appointmentId: string;
  clientId: string;
  type: 'email' | 'sms' | 'push' | 'all';
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata?: {
    emailSent?: boolean;
    smsSent?: boolean;
    pushSent?: boolean;
    error?: string;
  };
}

export interface AppointmentReminderSettings {
  enabled: boolean;
  channels: ('email' | 'sms' | 'push')[];
  timings: number[]; // Hours before appointment (e.g., [24, 2] for 24h and 2h before)
  includeInstructions: boolean;
  includeLocation: boolean;
  includeProviderInfo: boolean;
}

class AppointmentReminderService {
  private defaultSettings: AppointmentReminderSettings = {
    enabled: true,
    channels: ['email', 'push'],
    timings: [24, 2], // 24 hours and 2 hours before
    includeInstructions: true,
    includeLocation: true,
    includeProviderInfo: true,
  };

  /**
   * Schedule reminders for an appointment
   */
  async scheduleReminders(
    appointment: Appointment,
    settings?: Partial<AppointmentReminderSettings>
  ): Promise<ReminderConfig[]> {
    const config = { ...this.defaultSettings, ...settings };
    
    if (!config.enabled) {
      return [];
    }

    const reminders: ReminderConfig[] = [];
    const appointmentDate = new Date(appointment.scheduledAt);

    // Schedule reminders for each timing
    for (const hoursBefo

re of config.timings) {
      const reminderTime = addHours(appointmentDate, -hoursBefore);
      
      // Only schedule if reminder time is in the future
      if (isAfter(reminderTime, new Date())) {
        const reminderId = `reminder_${appointment.id}_${hoursBefore}h`;
        
        const reminder: ReminderConfig = {
          id: reminderId,
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          type: 'all',
          scheduledFor: reminderTime,
          status: 'pending',
        };

        // Schedule with EventBridge for production reliability
        await this.scheduleWithEventBridge(reminder, appointment, config);
        
        // Also schedule locally for immediate testing
        this.scheduleLocalReminder(reminder, appointment, config);
        
        reminders.push(reminder);
      }
    }

    return reminders;
  }

  /**
   * Send appointment reminder immediately
   */
  async sendReminder(
    appointment: Appointment,
    settings?: Partial<AppointmentReminderSettings>
  ): Promise<void> {
    const config = { ...this.defaultSettings, ...settings };
    const errors: string[] = [];

    // Send via each configured channel
    if (config.channels.includes('email')) {
      try {
        await this.sendEmailReminder(appointment, config);
      } catch (error) {
        errors.push(`Email: ${error}`);
      }
    }

    if (config.channels.includes('push')) {
      try {
        await this.sendPushReminder(appointment, config);
      } catch (error) {
        errors.push(`Push: ${error}`);
      }
    }

    if (config.channels.includes('sms')) {
      try {
        await this.sendSMSReminder(appointment, config);
      } catch (error) {
        errors.push(`SMS: ${error}`);
      }
    }

    if (errors.length > 0) {
      console.error('Reminder sending errors:', errors);
    }
  }

  /**
   * Cancel reminders for an appointment
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    // Cancel EventBridge scheduled tasks
    // In production, this would call AWS EventBridge API
    console.log(`Cancelling reminders for appointment ${appointmentId}`);
  }

  /**
   * Send email reminder
   */
  private async sendEmailReminder(
    appointment: Appointment,
    config: AppointmentReminderSettings
  ): Promise<void> {
    const timeUntil = this.getTimeUntilAppointment(appointment);
    
    const emailData = {
      to: appointment.clientEmail || '',
      subject: `Appointment Reminder: ${appointment.title}`,
      html: this.generateEmailHTML(appointment, config, timeUntil),
      text: this.generateEmailText(appointment, config, timeUntil),
    };

    await sendEmailReminder(emailData);
  }

  /**
   * Send push notification reminder
   */
  private async sendPushReminder(
    appointment: Appointment,
    config: AppointmentReminderSettings
  ): Promise<void> {
    const timeUntil = this.getTimeUntilAppointment(appointment);
    
    await pushNotificationService.sendUrgentAlert(
      `Appointment Reminder`,
      `${appointment.title} ${timeUntil}`,
      {
        appointmentId: appointment.id,
        type: 'appointment_reminder',
        scheduledAt: appointment.scheduledAt,
      }
    );
  }

  /**
   * Send SMS reminder
   */
  private async sendSMSReminder(
    appointment: Appointment,
    config: AppointmentReminderSettings
  ): Promise<void> {
    // Mock implementation - would integrate with AWS SNS or Twilio
    const timeUntil = this.getTimeUntilAppointment(appointment);
    const message = `Reminder: ${appointment.title} ${timeUntil}. ${
      config.includeLocation ? `Location: ${appointment.location}` : ''
    }`;
    
    console.log(`SMS Reminder: ${message}`);
    // await smsService.send(appointment.clientPhone, message);
  }

  /**
   * Schedule reminder with EventBridge
   */
  private async scheduleWithEventBridge(
    reminder: ReminderConfig,
    appointment: Appointment,
    config: AppointmentReminderSettings
  ): Promise<void> {
    await scheduleEventBridgeTask({
      taskName: `appointment-reminder-${reminder.id}`,
      scheduledTime: reminder.scheduledFor,
      taskType: 'appointment_reminder',
      payload: {
        reminderId: reminder.id,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        config,
      },
    });
  }

  /**
   * Schedule local reminder (for testing/development)
   */
  private scheduleLocalReminder(
    reminder: ReminderConfig,
    appointment: Appointment,
    config: AppointmentReminderSettings
  ): void {
    const delay = reminder.scheduledFor.getTime() - Date.now();
    
    if (delay > 0 && delay < 2147483647) { // Max setTimeout value
      setTimeout(() => {
        this.sendReminder(appointment, config);
      }, delay);
    }
  }

  /**
   * Calculate time until appointment
   */
  private getTimeUntilAppointment(appointment: Appointment): string {
    const now = new Date();
    const appointmentDate = new Date(appointment.scheduledAt);
    const minutesUntil = differenceInMinutes(appointmentDate, now);
    
    if (minutesUntil < 60) {
      return `in ${minutesUntil} minutes`;
    } else if (minutesUntil < 1440) {
      const hours = Math.floor(minutesUntil / 60);
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutesUntil / 1440);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Generate email HTML content
   */
  private generateEmailHTML(
    appointment: Appointment,
    config: AppointmentReminderSettings,
    timeUntil: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; width: 120px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Reminder</h1>
              <p style="font-size: 18px;">Your appointment is ${timeUntil}</p>
            </div>
            <div class="content">
              <div class="appointment-details">
                <h2>${appointment.title}</h2>
                <div class="detail-row">
                  <span class="detail-label">Date & Time:</span>
                  <span>${new Date(appointment.scheduledAt).toLocaleString()}</span>
                </div>
                ${config.includeProviderInfo && appointment.provider ? `
                  <div class="detail-row">
                    <span class="detail-label">Provider:</span>
                    <span>${appointment.provider}</span>
                  </div>
                ` : ''}
                ${config.includeLocation && appointment.location ? `
                  <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${appointment.location}</span>
                  </div>
                ` : ''}
                ${appointment.duration ? `
                  <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span>${appointment.duration} minutes</span>
                  </div>
                ` : ''}
              </div>
              
              ${config.includeInstructions && appointment.notes ? `
                <div class="appointment-details">
                  <h3>Instructions</h3>
                  <p>${appointment.notes}</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointment.id}" class="button">
                  View Appointment Details
                </a>
                <a href="tel:${appointment.providerPhone || ''}" class="button" style="background: #10B981;">
                  Call Provider
                </a>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #FEF3C7; border-radius: 8px;">
                <p style="margin: 0;"><strong>Need to reschedule?</strong></p>
                <p style="margin: 5px 0;">Please call us at least 24 hours in advance to reschedule or cancel your appointment.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated reminder from Levelup Meds Healthcare System</p>
              <p>To update your reminder preferences, visit your account settings</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate email text content
   */
  private generateEmailText(
    appointment: Appointment,
    config: AppointmentReminderSettings,
    timeUntil: string
  ): string {
    let text = `APPOINTMENT REMINDER\n\n`;
    text += `Your appointment is ${timeUntil}\n\n`;
    text += `${appointment.title}\n`;
    text += `Date & Time: ${new Date(appointment.scheduledAt).toLocaleString()}\n`;
    
    if (config.includeProviderInfo && appointment.provider) {
      text += `Provider: ${appointment.provider}\n`;
    }
    
    if (config.includeLocation && appointment.location) {
      text += `Location: ${appointment.location}\n`;
    }
    
    if (appointment.duration) {
      text += `Duration: ${appointment.duration} minutes\n`;
    }
    
    if (config.includeInstructions && appointment.notes) {
      text += `\nInstructions:\n${appointment.notes}\n`;
    }
    
    text += `\nView details: ${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointment.id}\n`;
    text += `\nNeed to reschedule? Please call us at least 24 hours in advance.\n`;
    
    return text;
  }
}

// Export singleton instance
export const appointmentReminderService = new AppointmentReminderService();

/**
 * React hook for appointment reminders
 */
export function useAppointmentReminders() {
  const scheduleReminders = async (
    appointment: Appointment,
    settings?: Partial<AppointmentReminderSettings>
  ) => {
    return await appointmentReminderService.scheduleReminders(appointment, settings);
  };

  const sendReminderNow = async (
    appointment: Appointment,
    settings?: Partial<AppointmentReminderSettings>
  ) => {
    await appointmentReminderService.sendReminder(appointment, settings);
  };

  const cancelReminders = async (appointmentId: string) => {
    await appointmentReminderService.cancelReminders(appointmentId);
  };

  return {
    scheduleReminders,
    sendReminderNow,
    cancelReminders,
  };
}
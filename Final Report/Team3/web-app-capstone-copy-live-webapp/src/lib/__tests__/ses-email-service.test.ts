import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  sesEmailService, 
  useAppointmentEmails,
  AppointmentReminderData,
  AppointmentUpdateData 
} from '../ses-email-service';
import { renderHook, act } from '@testing-library/react';

// Mock React for the hook
vi.mock('react', () => ({
  default: {
    useEffect: vi.fn(),
    useState: vi.fn(),
  },
}));

describe('SESEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sesEmailService.clearSentEmails();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendAppointmentReminder', () => {
    const mockReminderData: AppointmentReminderData = {
      appointmentId: 'apt-1',
      clientName: 'John Doe',
      appointmentTitle: 'Annual Checkup',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      duration: 60,
      providerName: 'Dr. Johnson',
      providerPhone: '555-0123',
      locationType: 'in_person',
      address: '123 Medical Center Dr, Suite 100',
      roomNumber: 'Room 205',
      preparationInstructions: 'Please bring your insurance card',
      documentsNeeded: ['Insurance Card', 'Photo ID'],
      caregiverEmails: ['caregiver1@example.com', 'caregiver2@example.com'],
      hoursBeforeAppointment: 24,
    };

    it('should send reminder emails to all caregivers', async () => {
      await sesEmailService.sendAppointmentReminder(mockReminderData);

      const sentEmails = sesEmailService.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      expect(sentEmails[0].to).toBe('caregiver1@example.com');
      expect(sentEmails[1].to).toBe('caregiver2@example.com');

      expect(sentEmails[0].subject).toContain('John Doe');
      expect(sentEmails[0].subject).toContain('Annual Checkup');
      expect(sentEmails[0].subject).toContain('Reminder');
    });

    it('should include appointment details in email content', async () => {
      await sesEmailService.sendAppointmentReminder(mockReminderData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('John Doe');
      expect(email.htmlBody).toContain('Annual Checkup');
      expect(email.htmlBody).toContain('Dr. Johnson');
      expect(email.htmlBody).toContain('123 Medical Center Dr');
      expect(email.htmlBody).toContain('Room 205');
      expect(email.htmlBody).toContain('Please bring your insurance card');
      expect(email.htmlBody).toContain('Insurance Card');
      expect(email.htmlBody).toContain('Photo ID');

      expect(email.textBody).toContain('John Doe');
      expect(email.textBody).toContain('Annual Checkup');
      expect(email.textBody).toContain('Dr. Johnson');
    });

    it('should handle telehealth appointments', async () => {
      const telehealthData = {
        ...mockReminderData,
        locationType: 'telehealth' as const,
        teleHealthLink: 'https://example.com/video-call',
        address: undefined,
        roomNumber: undefined,
      };

      await sesEmailService.sendAppointmentReminder(telehealthData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('Telehealth');
      expect(email.htmlBody).toContain('https://example.com/video-call');
      expect(email.htmlBody).not.toContain('123 Medical Center Dr');
    });

    it('should handle phone appointments', async () => {
      const phoneData = {
        ...mockReminderData,
        locationType: 'phone' as const,
        address: undefined,
        roomNumber: undefined,
        teleHealthLink: undefined,
      };

      await sesEmailService.sendAppointmentReminder(phoneData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('Phone Call');
      expect(email.textBody).toContain('Phone Call');
    });

    it('should handle appointments without optional fields', async () => {
      const minimalData = {
        appointmentId: 'apt-1',
        clientName: 'John Doe',
        appointmentTitle: 'Basic Appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 30,
        providerName: 'Dr. Smith',
        locationType: 'in_person' as const,
        caregiverEmails: ['caregiver@example.com'],
        hoursBeforeAppointment: 2,
      };

      await sesEmailService.sendAppointmentReminder(minimalData);

      const sentEmails = sesEmailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      const email = sentEmails[0];
      expect(email.htmlBody).toContain('Basic Appointment');
      expect(email.htmlBody).not.toContain('Preparation needed');
      expect(email.htmlBody).not.toContain('Documents to bring');
    });

    it('should use urgent styling for reminders 2 hours or less', async () => {
      const urgentData = {
        ...mockReminderData,
        hoursBeforeAppointment: 2,
      };

      await sesEmailService.sendAppointmentReminder(urgentData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('urgent');
    });

    it('should handle email sending errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should not throw even if individual emails fail
      await expect(sesEmailService.sendAppointmentReminder(mockReminderData)).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('sendAppointmentUpdate', () => {
    const mockUpdateData: AppointmentUpdateData = {
      appointmentId: 'apt-1',
      clientName: 'John Doe',
      appointmentTitle: 'Annual Checkup',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      providerName: 'Dr. Johnson',
      changeType: 'updated',
      changedBy: 'Alice Smith',
      caregiverEmails: ['caregiver1@example.com', 'caregiver2@example.com'],
      changes: {
        appointmentTime: { old: '14:00', new: '14:30' },
        providerName: { old: 'Dr. Smith', new: 'Dr. Johnson' },
      },
    };

    it('should send update emails to all caregivers', async () => {
      await sesEmailService.sendAppointmentUpdate(mockUpdateData);

      const sentEmails = sesEmailService.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      expect(sentEmails[0].to).toBe('caregiver1@example.com');
      expect(sentEmails[1].to).toBe('caregiver2@example.com');

      expect(sentEmails[0].subject).toContain('Appointment updated');
      expect(sentEmails[0].subject).toContain('John Doe');
      expect(sentEmails[0].subject).toContain('Annual Checkup');
    });

    it('should include change details in email content', async () => {
      await sesEmailService.sendAppointmentUpdate(mockUpdateData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('Updated by Alice Smith');
      expect(email.htmlBody).toContain('Changes Made');
      expect(email.htmlBody).toContain('14:00');
      expect(email.htmlBody).toContain('14:30');
      expect(email.htmlBody).toContain('Dr. Smith');
      expect(email.htmlBody).toContain('Dr. Johnson');

      expect(email.textBody).toContain('Updated by: Alice Smith');
      expect(email.textBody).toContain('CHANGES MADE');
    });

    it('should handle different change types', async () => {
      const changeTypes: Array<AppointmentUpdateData['changeType']> = [
        'created', 'updated', 'cancelled', 'confirmed'
      ];

      for (const changeType of changeTypes) {
        sesEmailService.clearSentEmails();
        
        const data = {
          ...mockUpdateData,
          changeType,
        };

        await sesEmailService.sendAppointmentUpdate(data);

        const sentEmails = sesEmailService.getSentEmails();
        const email = sentEmails[0];

        const expectedSubjectText = changeType === 'created' ? 'scheduled' : changeType;
        expect(email.subject).toContain(`Appointment ${expectedSubjectText}`);
        const expectedBodyText = changeType === 'created' ? 'Scheduled' : changeType.charAt(0).toUpperCase() + changeType.slice(1);
        expect(email.htmlBody).toContain(expectedBodyText);
      }
    });

    it('should handle updates without changes', async () => {
      const dataWithoutChanges = {
        ...mockUpdateData,
        changes: undefined,
      };

      await sesEmailService.sendAppointmentUpdate(dataWithoutChanges);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).not.toContain('Changes Made');
      expect(email.textBody).not.toContain('CHANGES MADE');
    });

    it('should use appropriate styling for cancelled appointments', async () => {
      const cancelledData = {
        ...mockUpdateData,
        changeType: 'cancelled' as const,
      };

      await sesEmailService.sendAppointmentUpdate(cancelledData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('cancelled');
      expect(email.htmlBody).toContain('#dc2626'); // Red color for cancelled
    });
  });

  describe('sendUrgentAppointmentAlert', () => {
    it('should send urgent alerts to all caregivers', async () => {
      const caregiverEmails = ['caregiver1@example.com', 'caregiver2@example.com'];
      
      await sesEmailService.sendUrgentAppointmentAlert(
        'apt-1',
        'John Doe',
        'Client missed appointment and needs immediate attention',
        caregiverEmails
      );

      const sentEmails = sesEmailService.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      expect(sentEmails[0].to).toBe('caregiver1@example.com');
      expect(sentEmails[1].to).toBe('caregiver2@example.com');

      expect(sentEmails[0].subject).toContain('🚨 Urgent');
      expect(sentEmails[0].subject).toContain('John Doe');
      expect(sentEmails[0].priority).toBe('high');
    });

    it('should include alert message in email content', async () => {
      await sesEmailService.sendUrgentAppointmentAlert(
        'apt-1',
        'John Doe',
        'Emergency situation requires immediate attention',
        ['caregiver@example.com']
      );

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('URGENT APPOINTMENT ALERT');
      expect(email.htmlBody).toContain('John Doe');
      expect(email.htmlBody).toContain('Emergency situation requires immediate attention');

      expect(email.textBody).toContain('URGENT APPOINTMENT ALERT');
      expect(email.textBody).toContain('Emergency situation requires immediate attention');
    });

    it('should use urgent styling', async () => {
      await sesEmailService.sendUrgentAppointmentAlert(
        'apt-1',
        'John Doe',
        'Test urgent message',
        ['caregiver@example.com']
      );

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      expect(email.htmlBody).toContain('#dc2626'); // Red color for urgent
      expect(email.htmlBody).toContain('🚨');
    });
  });

  describe('utility methods', () => {
    it('should track sent emails', async () => {
      const reminderData: AppointmentReminderData = {
        appointmentId: 'apt-1',
        clientName: 'John Doe',
        appointmentTitle: 'Test Appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 30,
        providerName: 'Dr. Test',
        locationType: 'in_person',
        caregiverEmails: ['test@example.com'],
        hoursBeforeAppointment: 24,
      };

      await sesEmailService.sendAppointmentReminder(reminderData);

      const sentEmails = sesEmailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      const email = sentEmails[0];
      expect(email.messageId).toBeDefined();
      expect(email.to).toBe('test@example.com');
      expect(email.sentAt).toBeDefined();
    });

    it('should clear sent emails', async () => {
      const reminderData: AppointmentReminderData = {
        appointmentId: 'apt-1',
        clientName: 'John Doe',
        appointmentTitle: 'Test Appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 30,
        providerName: 'Dr. Test',
        locationType: 'in_person',
        caregiverEmails: ['test@example.com'],
        hoursBeforeAppointment: 24,
      };

      await sesEmailService.sendAppointmentReminder(reminderData);
      expect(sesEmailService.getSentEmails()).toHaveLength(1);

      sesEmailService.clearSentEmails();
      expect(sesEmailService.getSentEmails()).toHaveLength(0);
    });

    it('should get email by ID', async () => {
      const reminderData: AppointmentReminderData = {
        appointmentId: 'apt-1',
        clientName: 'John Doe',
        appointmentTitle: 'Test Appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 30,
        providerName: 'Dr. Test',
        locationType: 'in_person',
        caregiverEmails: ['test@example.com'],
        hoursBeforeAppointment: 24,
      };

      await sesEmailService.sendAppointmentReminder(reminderData);

      const sentEmails = sesEmailService.getSentEmails();
      const messageId = sentEmails[0].messageId;

      const retrievedEmail = sesEmailService.getEmailById(messageId);
      expect(retrievedEmail).toBeDefined();
      expect(retrievedEmail.messageId).toBe(messageId);
    });
  });

  describe('template generation', () => {
    it('should format dates and times correctly', async () => {
      const reminderData: AppointmentReminderData = {
        appointmentId: 'apt-1',
        clientName: 'John Doe',
        appointmentTitle: 'Test Appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 90, // 1 hour 30 minutes
        providerName: 'Dr. Test',
        locationType: 'in_person',
        caregiverEmails: ['test@example.com'],
        hoursBeforeAppointment: 24,
      };

      await sesEmailService.sendAppointmentReminder(reminderData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      // Should format date as readable format
      expect(email.htmlBody).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
      expect(email.htmlBody).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December/);
      
      // Should format time in 12-hour format
      expect(email.htmlBody).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      
      // Should show duration
      expect(email.htmlBody).toContain('90 minutes');
    });

    it('should handle missing optional data gracefully', async () => {
      const minimalData: AppointmentReminderData = {
        appointmentId: 'apt-1',
        clientName: 'John Doe',
        appointmentTitle: 'Basic Appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 30,
        providerName: 'Dr. Test',
        locationType: 'phone',
        caregiverEmails: ['test@example.com'],
        hoursBeforeAppointment: 24,
      };

      await sesEmailService.sendAppointmentReminder(minimalData);

      const sentEmails = sesEmailService.getSentEmails();
      const email = sentEmails[0];

      // Should not contain undefined or null values
      expect(email.htmlBody).not.toContain('undefined');
      expect(email.htmlBody).not.toContain('null');
      expect(email.textBody).not.toContain('undefined');
      expect(email.textBody).not.toContain('null');
    });
  });
});

describe('useAppointmentEmails hook', () => {
  it('should provide email sending functions', () => {
    const { result } = renderHook(() => useAppointmentEmails());

    expect(result.current.sendReminder).toBeDefined();
    expect(result.current.sendUpdate).toBeDefined();
    expect(result.current.sendUrgentAlert).toBeDefined();
  });

  it('should handle errors in sendReminder', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock sesEmailService to throw an error
    const originalSendReminder = sesEmailService.sendAppointmentReminder;
    sesEmailService.sendAppointmentReminder = vi.fn().mockRejectedValue(new Error('Email failed'));

    const { result } = renderHook(() => useAppointmentEmails());

    const reminderData: AppointmentReminderData = {
      appointmentId: 'apt-1',
      clientName: 'John Doe',
      appointmentTitle: 'Test Appointment',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      duration: 30,
      providerName: 'Dr. Test',
      locationType: 'in_person',
      caregiverEmails: ['test@example.com'],
      hoursBeforeAppointment: 24,
    };

    await act(async () => {
      await expect(result.current.sendReminder(reminderData)).rejects.toThrow('Email failed');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error sending appointment reminder:', expect.any(Error));

    // Restore original method
    sesEmailService.sendAppointmentReminder = originalSendReminder;
    consoleSpy.mockRestore();
  });

  it('should handle errors in sendUpdate', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock sesEmailService to throw an error
    const originalSendUpdate = sesEmailService.sendAppointmentUpdate;
    sesEmailService.sendAppointmentUpdate = vi.fn().mockRejectedValue(new Error('Email failed'));

    const { result } = renderHook(() => useAppointmentEmails());

    const updateData: AppointmentUpdateData = {
      appointmentId: 'apt-1',
      clientName: 'John Doe',
      appointmentTitle: 'Test Appointment',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      providerName: 'Dr. Test',
      changeType: 'updated',
      changedBy: 'Alice Smith',
      caregiverEmails: ['test@example.com'],
    };

    await act(async () => {
      await expect(result.current.sendUpdate(updateData)).rejects.toThrow('Email failed');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error sending appointment update:', expect.any(Error));

    // Restore original method
    sesEmailService.sendAppointmentUpdate = originalSendUpdate;
    consoleSpy.mockRestore();
  });

  it('should handle errors in sendUrgentAlert', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock sesEmailService to throw an error
    const originalSendAlert = sesEmailService.sendUrgentAppointmentAlert;
    sesEmailService.sendUrgentAppointmentAlert = vi.fn().mockRejectedValue(new Error('Email failed'));

    const { result } = renderHook(() => useAppointmentEmails());

    await act(async () => {
      await expect(result.current.sendUrgentAlert(
        'apt-1',
        'John Doe',
        'Test urgent message',
        ['test@example.com']
      )).rejects.toThrow('Email failed');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error sending urgent appointment alert:', expect.any(Error));

    // Restore original method
    sesEmailService.sendUrgentAppointmentAlert = originalSendAlert;
    consoleSpy.mockRestore();
  });
});
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler, InvitationEvent, InvitationResponse } from '../handler';

// Mock AWS SDK
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  SendEmailCommand: vi.fn(),
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'mock-secure-token-12345678901234567890123456789012'),
  })),
}));

const mockSESClient = {
  send: vi.fn(),
};

const mockSendEmailCommand = vi.fn();

// Set up environment variables
process.env.SES_REGION = 'us-east-1';
process.env.FROM_EMAIL = 'noreply@healthcare-app.com';
process.env.FRONTEND_URL = 'https://localhost:3000';

describe('Invitation Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSESClient.send.mockResolvedValue({});
  });

  describe('send action', () => {
    it('should send invitation email successfully', async () => {
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
          personalMessage: 'Please join our caregiver',
        },
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation sent successfully');
      expect(result.data?.token).toBe('mock-secure-token-12345678901234567890123456789012');
      expect(result.data?.expiresAt).toBeDefined();
    });

    it('should handle missing invitation data', async () => {
      const event: InvitationEvent = {
        action: 'send',
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred processing the invitation');
      expect(result.error).toBe('Invitation data is required');
    });

    it('should generate secure token with correct length', async () => {
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
        },
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.data?.token).toHaveLength(64); // 32 bytes * 2 hex chars per byte
    });

    it('should set expiration to 7 days from now', async () => {
      const beforeTest = Date.now();
      
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
        },
      };

      const result = await handler(event);
      const afterTest = Date.now();

      expect(result.success).toBe(true);
      
      const expiresAt = new Date(result.data!.expiresAt!).getTime();
      const expectedMin = beforeTest + 7 * 24 * 60 * 60 * 1000;
      const expectedMax = afterTest + 7 * 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should include personal message in email when provided', async () => {
      const personalMessage = 'Welcome to our caregiver!';
      
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
          personalMessage,
        },
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(mockSendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining(personalMessage),
              }),
              Text: expect.objectContaining({
                Data: expect.stringContaining(personalMessage),
              }),
            }),
          }),
        })
      );
    });
  });

  describe('validate action', () => {
    it('should validate valid token format', async () => {
      const event: InvitationEvent = {
        action: 'validate',
        token: 'valid-token-with-sufficient-length-12345678',
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token is valid');
      expect(result.data?.isValid).toBe(true);
    });

    it('should reject invalid token format', async () => {
      const event: InvitationEvent = {
        action: 'validate',
        token: 'short',
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid token format');
      expect(result.data?.isValid).toBe(false);
    });

    it('should reject empty token', async () => {
      const event: InvitationEvent = {
        action: 'validate',
        token: '',
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid token format');
      expect(result.data?.isValid).toBe(false);
    });
  });

  describe('accept action', () => {
    it('should accept invitation successfully', async () => {
      const event: InvitationEvent = {
        action: 'accept',
        acceptanceData: {
          userId: 'user-123',
          invitationId: 'inv-456',
        },
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation accepted successfully');
      expect(result.data?.invitationId).toBe('inv-456');
    });

    it('should handle missing acceptance data', async () => {
      const event: InvitationEvent = {
        action: 'accept',
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred processing the invitation');
      expect(result.error).toBe('Acceptance data is required');
    });
  });

  describe('invalid action', () => {
    it('should handle invalid action', async () => {
      const event: InvitationEvent = {
        action: 'invalid' as any,
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred processing the invitation');
      expect(result.error).toBe('Invalid action');
    });
  });

  describe('email template generation', () => {
    it('should generate HTML email with all required elements', async () => {
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
          personalMessage: 'Welcome to the team!',
        },
      };

      await handler(event);

      const emailCall = mockSendEmailCommand.mock.calls[0]?.[0];
      const htmlContent = emailCall?.Message?.Body?.Html?.Data;

      expect(htmlContent).toContain('John Doe');
      expect(htmlContent).toContain('Jane Smith');
      expect(htmlContent).toContain('secondary caregiver');
      expect(htmlContent).toContain('Welcome to the team!');
      expect(htmlContent).toContain('Healthcare Tracker');
      expect(htmlContent).toContain('accept-invitation?token=');
    });

    it('should generate text email with all required elements', async () => {
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
        },
      };

      await handler(event);

      const emailCall = mockSendEmailCommand.mock.calls[0]?.[0];
      const textContent = emailCall?.Message?.Body?.Text?.Data;

      expect(textContent).toContain('John Doe');
      expect(textContent).toContain('Jane Smith');
      expect(textContent).toContain('secondary caregiver');
      expect(textContent).toContain('Healthcare caregiver Invitation');
    });

    it('should set correct email subject', async () => {
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
        },
      };

      await handler(event);

      const emailCall = mockSendEmailCommand.mock.calls[0]?.[0];
      const subject = emailCall?.Message?.Subject?.Data;

      expect(subject).toBe('Healthcare caregiver Invitation - Jane Smith');
    });

    it('should set correct sender and recipient', async () => {
      const event: InvitationEvent = {
        action: 'send',
        invitationData: {
          invitedEmail: 'test@example.com',
          inviterName: 'John Doe',
          patientName: 'Jane Smith',
          role: 'secondary caregiver',
        },
      };

      await handler(event);

      const emailCall = mockSendEmailCommand.mock.calls[0]?.[0];

      expect(emailCall?.Source).toBe('noreply@healthcare-app.com');
      expect(emailCall?.Destination?.ToAddresses).toEqual(['test@example.com']);
    });
  });
});
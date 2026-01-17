import { describe, it, expect } from 'vitest';
import {
  userRegistrationSchema,
  userLoginSchema,
  clientSchema,
  medicationSchema,
  appointmentSchema,
  messageSchema,
  invitationSchema,
  validateFormData,
  validateGraphQLInput,
} from '../validation-schemas';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('validates valid user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'primary' as const,
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'primary' as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('valid email');
      }
    });

    it('rejects weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        role: 'primary' as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message.includes('8 characters'))).toBe(true);
      }
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'primary' as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message.includes('do not match'))).toBe(true);
      }
    });

    it('rejects invalid names with special characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John123',
        lastName: 'Doe@#',
        role: 'primary' as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userLoginSchema', () => {
    it('validates valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty fields', () => {
      const invalidData = {
        email: '',
        password: '',
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('clientSchema', () => {
    it('validates valid client data', () => {
      const validData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        medicalConditions: ['Diabetes', 'Hypertension'],
        allergies: ['Penicillin'],
        emergencyContactName: 'John Smith',
        emergencyContactPhone: '+1234567890',
        insuranceInfo: {
          provider: 'Blue Cross',
          policyNumber: 'BC123456789',
        },
      };

      const result = clientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid date of birth', () => {
      const invalidData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '2050-01-01', // Future date
        emergencyContactName: 'John Smith',
        emergencyContactPhone: '+1234567890',
        insuranceInfo: {
          provider: 'Blue Cross',
          policyNumber: 'BC123456789',
        },
      };

      const result = clientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid phone number format', () => {
      const invalidData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        emergencyContactName: 'John Smith',
        emergencyContactPhone: 'invalid-phone',
        insuranceInfo: {
          provider: 'Blue Cross',
          policyNumber: 'BC123456789',
        },
      };

      const result = clientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('medicationSchema', () => {
    it('validates valid medication data', () => {
      const validData = {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        instructions: 'Take with food',
        prescribingDoctor: 'Dr. Johnson',
        startDate: '2023-01-01',
        clientId: 'client123',
      };

      const result = medicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid dosage format', () => {
      const invalidData = {
        name: 'Metformin',
        dosage: 'invalid dosage',
        frequency: 'Twice daily',
        prescribingDoctor: 'Dr. Johnson',
        startDate: '2023-01-01',
        clientId: 'client123',
      };

      const result = medicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects future start date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        prescribingDoctor: 'Dr. Johnson',
        startDate: futureDate.toISOString().split('T')[0],
        clientId: 'client123',
      };

      const result = medicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects end date before start date', () => {
      const invalidData = {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        prescribingDoctor: 'Dr. Johnson',
        startDate: '2023-01-01',
        endDate: '2022-12-31',
        clientId: 'client123',
      };

      const result = medicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('appointmentSchema', () => {
    it('validates valid appointment data', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const validData = {
        title: 'Annual Checkup',
        dateTime: futureDate.toISOString(),
        duration: 60,
        providerName: 'Dr. Smith',
        location: '123 Medical Center',
        appointmentType: 'Routine',
        clientId: 'client123',
      };

      const result = appointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects past appointment dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidData = {
        title: 'Past Appointment',
        dateTime: pastDate.toISOString(),
        duration: 60,
        providerName: 'Dr. Smith',
        location: '123 Medical Center',
        appointmentType: 'Routine',
        clientId: 'client123',
      };

      const result = appointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid duration', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        title: 'Short Appointment',
        dateTime: futureDate.toISOString(),
        duration: 5, // Too short
        providerName: 'Dr. Smith',
        location: '123 Medical Center',
        appointmentType: 'Routine',
        clientId: 'client123',
      };

      const result = appointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('messageSchema', () => {
    it('validates valid message data', () => {
      const validData = {
        content: 'This is a test message',
        clientId: 'client123',
        messageType: 'text' as const,
        mentions: ['user456'],
      };

      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty message content', () => {
      const invalidData = {
        content: '',
        clientId: 'client123',
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects message content that is too long', () => {
      const invalidData = {
        content: 'a'.repeat(2001), // Too long
        clientId: 'client123',
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('invitationSchema', () => {
    it('validates valid invitation data', () => {
      const validData = {
        email: 'invite@example.com',
        role: 'family' as const,
        clientIds: ['client123', 'client456'],
        message: 'Please join our caregiver',
      };

      const result = invitationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invitation without clients', () => {
      const invalidData = {
        email: 'invite@example.com',
        role: 'family' as const,
        clientIds: [],
      };

      const result = invitationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects primary role in invitations', () => {
      const invalidData = {
        email: 'invite@example.com',
        role: 'primary' as any, // Should not be allowed
        clientIds: ['client123'],
      };

      const result = invitationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateFormData helper', () => {
    it('returns success for valid data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateFormData(userLoginSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('returns errors for invalid data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };

      const result = validateFormData(userLoginSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.email).toContain('valid email');
      expect(result.errors!.password).toContain('required');
    });

    it('handles nested validation errors', () => {
      const invalidData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        emergencyContactName: 'John Smith',
        emergencyContactPhone: '+1234567890',
        insuranceInfo: {
          provider: '', // Invalid
          policyNumber: 'BC123456789',
        },
      };

      const result = validateFormData(clientSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.errors!['insuranceInfo.provider']).toContain('required');
    });
  });

  describe('validateGraphQLInput helper', () => {
    it('returns validated data for valid input', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateGraphQLInput(userLoginSchema, validData);

      expect(result).toEqual(validData);
    });

    it('throws error for invalid input', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };

      expect(() => {
        validateGraphQLInput(userLoginSchema, invalidData);
      }).toThrow('GraphQL input validation failed');
    });

    it('includes validation details in error message', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };

      expect(() => {
        validateGraphQLInput(userLoginSchema, invalidData);
      }).toThrow(/email.*valid email/);
    });
  });

  describe('dosage validation', () => {
    it('accepts various valid dosage formats', () => {
      const validDosages = [
        '10mg',
        '2.5mg',
        '1 tablet',
        '2 tablets',
        '5ml',
        '1 unit',
        '3 units',
        '2 drops',
        '1 spray',
        '2 puffs',
        '500mg twice daily',
        '10mg 3 times a day',
      ];

      validDosages.forEach(dosage => {
        const data = {
          name: 'Test Med',
          dosage,
          frequency: 'Daily',
          prescribingDoctor: 'Dr. Test',
          startDate: '2023-01-01',
          clientId: 'client123',
        };

        const result = medicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid dosage formats', () => {
      const invalidDosages = [
        'invalid',
        '10',
        'mg',
        '10 invalid',
        'abc mg',
      ];

      invalidDosages.forEach(dosage => {
        const data = {
          name: 'Test Med',
          dosage,
          frequency: 'Daily',
          prescribingDoctor: 'Dr. Test',
          startDate: '2023-01-01',
          clientId: 'client123',
        };

        const result = medicationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
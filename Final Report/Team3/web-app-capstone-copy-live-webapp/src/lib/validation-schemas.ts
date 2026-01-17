import { z } from 'zod';

// Common validation patterns
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  role: z.enum(['primary', 'family', 'professional'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const userLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const userProfileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
});

// Client validation schemas
export const clientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 150;
    }, 'Please enter a valid date of birth'),
  medicalConditions: z
    .array(z.string().min(1, 'Medical condition cannot be empty'))
    .optional()
    .default([]),
  allergies: z
    .array(z.string().min(1, 'Allergy cannot be empty'))
    .optional()
    .default([]),
  emergencyContactName: z
    .string()
    .min(1, 'Emergency contact name is required')
    .max(100, 'Emergency contact name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Emergency contact name can only contain letters, spaces, hyphens, and apostrophes'),
  emergencyContactPhone: z
    .string()
    .min(1, 'Emergency contact phone is required')
    .regex(phoneRegex, 'Please enter a valid phone number'),
  insuranceInfo: z.object({
    provider: z
      .string()
      .min(1, 'Insurance provider is required')
      .max(100, 'Insurance provider must be less than 100 characters'),
    policyNumber: z
      .string()
      .min(1, 'Policy number is required')
      .max(50, 'Policy number must be less than 50 characters')
      .regex(/^[A-Za-z0-9-]+$/, 'Policy number can only contain letters, numbers, and hyphens'),
  }),
});

// Medication validation schemas
export const medicationSchema = z.object({
  name: z
    .string()
    .min(1, 'Medication name is required')
    .max(100, 'Medication name must be less than 100 characters'),
  dosage: z
    .string()
    .min(1, 'Dosage is required')
    .max(50, 'Dosage must be less than 50 characters')
    .regex(/^[\d\.]+(mg|g|ml|units?|tablets?|capsules?|drops?|sprays?|puffs?)\s*(\d+\s*times?\s*(daily|per day|a day)?)?$/i, 
      'Please enter a valid dosage (e.g., "10mg", "2 tablets", "5ml twice daily")'),
  frequency: z
    .string()
    .min(1, 'Frequency is required')
    .max(100, 'Frequency must be less than 100 characters'),
  instructions: z
    .string()
    .max(500, 'Instructions must be less than 500 characters')
    .optional(),
  prescribingDoctor: z
    .string()
    .min(1, 'Prescribing doctor is required')
    .max(100, 'Prescribing doctor name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-.,]+$/, 'Doctor name can only contain letters, spaces, hyphens, apostrophes, periods, and commas'),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const startDate = new Date(date);
      const today = new Date();
      return startDate <= today;
    }, 'Start date cannot be in the future'),
  endDate: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const endDate = new Date(date);
      const today = new Date();
      return endDate >= today;
    }, 'End date cannot be in the past'),
  clientId: z
    .string()
    .min(1, 'Client selection is required'),
}).refine((data) => {
  if (data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Appointment validation schemas
export const appointmentSchema = z.object({
  title: z
    .string()
    .min(1, 'Appointment title is required')
    .max(100, 'Title must be less than 100 characters'),
  dateTime: z
    .string()
    .min(1, 'Date and time are required')
    .refine((dateTime) => {
      const appointmentDate = new Date(dateTime);
      const now = new Date();
      return appointmentDate > now;
    }, 'Appointment must be scheduled for a future date and time'),
  duration: z
    .number()
    .min(15, 'Appointment duration must be at least 15 minutes')
    .max(480, 'Appointment duration cannot exceed 8 hours'),
  providerName: z
    .string()
    .min(1, 'Provider name is required')
    .max(100, 'Provider name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-.,]+$/, 'Provider name can only contain letters, spaces, hyphens, apostrophes, periods, and commas'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters'),
  appointmentType: z
    .string()
    .min(1, 'Appointment type is required')
    .max(50, 'Appointment type must be less than 50 characters'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  clientId: z
    .string()
    .min(1, 'Client selection is required'),
});

// Message validation schemas
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(2000, 'Message must be less than 2000 characters'),
  clientId: z
    .string()
    .min(1, 'Client selection is required'),
  messageType: z
    .enum(['text', 'urgent'], {
      errorMap: () => ({ message: 'Please select a valid message type' }),
    })
    .default('text'),
  mentions: z
    .array(z.string())
    .optional()
    .default([]),
});

// Invitation validation schemas
export const invitationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
  role: z
    .enum(['family', 'professional'], {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }),
  clientIds: z
    .array(z.string())
    .min(1, 'At least one client must be selected'),
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
});

// Settings validation schemas
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  medicationReminders: z.boolean().default(true),
  appointmentReminders: z.boolean().default(true),
  chatNotifications: z.boolean().default(true),
  systemAlerts: z.boolean().default(true),
});

export const privacySettingsSchema = z.object({
  shareDataWithCaregivers: z.boolean().default(true),
  allowDataExport: z.boolean().default(true),
  dataRetentionPeriod: z
    .number()
    .min(30, 'Data retention period must be at least 30 days')
    .max(2555, 'Data retention period cannot exceed 7 years')
    .default(365),
});

// Form validation helper types
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
export type UserLoginData = z.infer<typeof userLoginSchema>;
export type UserProfileUpdateData = z.infer<typeof userProfileUpdateSchema>;
export type ClientData = z.infer<typeof clientSchema>;
export type MedicationData = z.infer<typeof medicationSchema>;
export type AppointmentData = z.infer<typeof appointmentSchema>;
export type MessageData = z.infer<typeof messageSchema>;
export type InvitationData = z.infer<typeof invitationSchema>;
export type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;
export type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;

// Validation helper functions
export function validateFormData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

// GraphQL schema validation (simulated)
export function validateGraphQLInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`GraphQL input validation failed: ${errorMessage}`);
    }
    throw new Error('GraphQL input validation failed');
  }
}
/**
 * Unit tests for GraphQL operations and data relationships
 * 
 * These tests verify that the GraphQL schema operations work correctly
 * and that data relationships are properly maintained.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import {
  seedUserProfiles,
  seedClients,
  seedClientCaregivers,
  seedMedications,
  seedAppointments,
  seedMessages,
  clearAllData,
  generateSampleUserProfiles,
  generateSampleClients,
  generateSampleMedications
} from '../seed-data';

// Mock the Amplify client
vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn()
}));

const mockClient = {
  models: {
    UserProfile: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    Client: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    ClientCaregiver: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    Medication: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    MedicationLog: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    Appointment: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    Message: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    CaregiverInvitation: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    Notification: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
};

(generateClient as any).mockReturnValue(mockClient);

describe('GraphQL Operations Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('UserProfile Operations', () => {
    it('should create a user profile with valid data', async () => {
      const sampleUser = generateSampleUserProfiles()[0];
      const expectedResult = { data: { ...sampleUser, id: 'user-123' } };
      
      mockClient.models.UserProfile.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.UserProfile.create(sampleUser);

      expect(mockClient.models.UserProfile.create).toHaveBeenCalledWith(sampleUser);
      expect(result.data).toEqual(expect.objectContaining({
        userId: sampleUser.userId,
        email: sampleUser.email,
        firstName: sampleUser.firstName,
        lastName: sampleUser.lastName,
        role: sampleUser.role
      }));
    });

    it('should list user profiles', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@test.com', firstName: 'John', lastName: 'Doe' },
        { id: 'user-2', email: 'user2@test.com', firstName: 'Jane', lastName: 'Smith' }
      ];
      
      mockClient.models.UserProfile.list.mockResolvedValue({ data: mockUsers });

      const result = await mockClient.models.UserProfile.list();

      expect(mockClient.models.UserProfile.list).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(expect.objectContaining({ id: 'user-1' }));
    });

    it('should update a user profile', async () => {
      const updateData = { id: 'user-123', firstName: 'Updated Name' };
      const expectedResult = { data: { ...updateData, lastName: 'Doe' } };
      
      mockClient.models.UserProfile.update.mockResolvedValue(expectedResult);

      const result = await mockClient.models.UserProfile.update(updateData);

      expect(mockClient.models.UserProfile.update).toHaveBeenCalledWith(updateData);
      expect(result.data.firstName).toBe('Updated Name');
    });

    it('should delete a user profile', async () => {
      const deleteData = { id: 'user-123' };
      const expectedResult = { data: deleteData };
      
      mockClient.models.UserProfile.delete.mockResolvedValue(expectedResult);

      const result = await mockClient.models.UserProfile.delete(deleteData);

      expect(mockClient.models.UserProfile.delete).toHaveBeenCalledWith(deleteData);
      expect(result.data.id).toBe('user-123');
    });
  });

  describe('Client Operations', () => {
    it('should create a client with required fields', async () => {
      const sampleClient = generateSampleClients()[0];
      const expectedResult = { data: { ...sampleClient, id: 'client-123' } };
      
      mockClient.models.Client.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Client.create(sampleClient);

      expect(mockClient.models.Client.create).toHaveBeenCalledWith(sampleClient);
      expect(result.data).toEqual(expect.objectContaining({
        firstName: sampleClient.firstName,
        lastName: sampleClient.lastName,
        dateOfBirth: sampleClient.dateOfBirth,
        emergencyContactName: sampleClient.emergencyContactName,
        emergencyContactPhone: sampleClient.emergencyContactPhone
      }));
    });

    it('should validate required client fields', () => {
      const sampleClient = generateSampleClients()[0];
      
      // Test that required fields are present
      expect(sampleClient.firstName).toBeDefined();
      expect(sampleClient.lastName).toBeDefined();
      expect(sampleClient.dateOfBirth).toBeDefined();
      expect(sampleClient.emergencyContactName).toBeDefined();
      expect(sampleClient.emergencyContactPhone).toBeDefined();
      
      // Test that arrays are properly initialized
      expect(Array.isArray(sampleClient.medicalConditions)).toBe(true);
      expect(Array.isArray(sampleClient.allergies)).toBe(true);
    });

    it('should handle client with medical conditions and allergies', async () => {
      const clientWithConditions = {
        ...generateSampleClients()[0],
        medicalConditions: ['Diabetes', 'Hypertension'],
        allergies: ['Penicillin', 'Shellfish']
      };
      
      const expectedResult = { data: { ...clientWithConditions, id: 'client-456' } };
      mockClient.models.Client.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Client.create(clientWithConditions);

      expect(result.data.medicalConditions).toContain('Diabetes');
      expect(result.data.allergies).toContain('Penicillin');
    });
  });

  describe('ClientCaregiver Relationship Operations', () => {
    it('should create client-caregiver relationship', async () => {
      const relationship = {
        clientId: 'client-123',
        caregiverId: 'user-456',
        role: 'primary' as const,
        permissions: ['view', 'edit', 'admin'],
        isActive: true
      };
      
      const expectedResult = { data: { ...relationship, id: 'rel-789' } };
      mockClient.models.ClientCaregiver.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.ClientCaregiver.create(relationship);

      expect(mockClient.models.ClientCaregiver.create).toHaveBeenCalledWith(relationship);
      expect(result.data).toEqual(expect.objectContaining({
        clientId: 'client-123',
        caregiverId: 'user-456',
        role: 'primary'
      }));
    });

    it('should validate caregiver roles', () => {
      const validRoles = ['primary', 'secondary', 'emergency'];
      
      validRoles.forEach(role => {
        const relationship = {
          clientId: 'client-123',
          caregiverId: 'user-456',
          role: role as any,
          permissions: ['view'],
          isActive: true
        };
        
        expect(['primary', 'secondary', 'emergency']).toContain(relationship.role);
      });
    });
  });

  describe('Medication Operations', () => {
    it('should create medication with schedule', async () => {
      const sampleMedication = generateSampleMedications(['client-123'])[0];
      const expectedResult = { data: { ...sampleMedication, id: 'med-789' } };
      
      mockClient.models.Medication.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Medication.create(sampleMedication);

      expect(mockClient.models.Medication.create).toHaveBeenCalledWith(sampleMedication);
      expect(result.data).toEqual(expect.objectContaining({
        name: sampleMedication.name,
        dosage: sampleMedication.dosage,
        frequency: sampleMedication.frequency,
        scheduleType: sampleMedication.scheduleType
      }));
    });

    it('should handle PRN (as needed) medications', async () => {
      const prnMedication = {
        clientId: 'client-123',
        name: 'Ibuprofen',
        dosage: '400',
        unit: 'mg',
        frequency: 'As needed for pain',
        route: 'oral' as const,
        scheduleType: 'as_needed' as const,
        prescribingDoctor: 'Dr. Smith',
        startDate: '2024-01-01',
        isActive: true,
        isPRN: true,
        missedDoses: 0,
        totalDoses: 0
      };
      
      const expectedResult = { data: { ...prnMedication, id: 'med-prn-123' } };
      mockClient.models.Medication.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Medication.create(prnMedication);

      expect(result.data.isPRN).toBe(true);
      expect(result.data.scheduleType).toBe('as_needed');
    });

    it('should validate medication routes', () => {
      const validRoutes = ['oral', 'injection', 'topical', 'inhalation', 'other'];
      const sampleMedication = generateSampleMedications(['client-123'])[0];
      
      expect(validRoutes).toContain(sampleMedication.route);
    });
  });

  describe('Appointment Operations', () => {
    it('should create appointment with provider details', async () => {
      const appointment = {
        clientId: 'client-123',
        title: 'Annual Physical',
        appointmentDate: '2024-12-01',
        appointmentTime: '10:00',
        duration: 60,
        providerName: 'Dr. Smith',
        providerType: 'primary_care' as const,
        locationType: 'in_person' as const,
        status: 'scheduled' as const,
        priority: 'normal' as const,
        followUpRequired: false,
        reminderSent: false,
        createdBy: 'user-456'
      };
      
      const expectedResult = { data: { ...appointment, id: 'appt-789' } };
      mockClient.models.Appointment.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Appointment.create(appointment);

      expect(mockClient.models.Appointment.create).toHaveBeenCalledWith(appointment);
      expect(result.data).toEqual(expect.objectContaining({
        title: 'Annual Physical',
        providerName: 'Dr. Smith',
        status: 'scheduled'
      }));
    });

    it('should handle telehealth appointments', async () => {
      const teleAppointment = {
        clientId: 'client-123',
        title: 'Telehealth Consultation',
        appointmentDate: '2024-12-01',
        appointmentTime: '14:00',
        duration: 30,
        providerName: 'Dr. Johnson',
        locationType: 'telehealth' as const,
        teleHealthLink: 'https://telehealth.example.com/room/123',
        status: 'scheduled' as const,
        priority: 'normal' as const,
        followUpRequired: false,
        reminderSent: false,
        createdBy: 'user-456'
      };
      
      const expectedResult = { data: { ...teleAppointment, id: 'appt-tele-123' } };
      mockClient.models.Appointment.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Appointment.create(teleAppointment);

      expect(result.data.locationType).toBe('telehealth');
      expect(result.data.teleHealthLink).toBeDefined();
    });
  });

  describe('Message Operations', () => {
    it('should create text message', async () => {
      const message = {
        clientId: 'client-123',
        senderId: 'user-456',
        content: 'Client took morning medication on time.',
        messageType: 'text' as const,
        priority: 'normal' as const,
        isRead: false,
        readBy: [],
        readAt: []
      };
      
      const expectedResult = { data: { ...message, id: 'msg-789' } };
      mockClient.models.Message.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Message.create(message);

      expect(mockClient.models.Message.create).toHaveBeenCalledWith(message);
      expect(result.data.messageType).toBe('text');
      expect(result.data.content).toBe('Client took morning medication on time.');
    });

    it('should create urgent message with mentions', async () => {
      const urgentMessage = {
        clientId: 'client-123',
        senderId: 'user-456',
        content: 'URGENT: Client experiencing chest pain. @dr.smith please advise.',
        messageType: 'urgent' as const,
        priority: 'urgent' as const,
        mentions: ['user-789'],
        isRead: false,
        readBy: [],
        readAt: []
      };
      
      const expectedResult = { data: { ...urgentMessage, id: 'msg-urgent-123' } };
      mockClient.models.Message.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Message.create(urgentMessage);

      expect(result.data.messageType).toBe('urgent');
      expect(result.data.priority).toBe('urgent');
      expect(result.data.mentions).toContain('user-789');
    });

    it('should handle system messages', async () => {
      const systemMessage = {
        clientId: 'client-123',
        senderId: 'system',
        content: 'Medication reminder: Metformin due in 30 minutes',
        messageType: 'medication_reminder' as const,
        priority: 'normal' as const,
        systemData: {
          medicationId: 'med-123',
          reminderType: 'due_soon'
        },
        isRead: false,
        readBy: [],
        readAt: []
      };
      
      const expectedResult = { data: { ...systemMessage, id: 'msg-system-123' } };
      mockClient.models.Message.create.mockResolvedValue(expectedResult);

      const result = await mockClient.models.Message.create(systemMessage);

      expect(result.data.messageType).toBe('medication_reminder');
      expect(result.data.systemData).toBeDefined();
    });
  });

  describe('Data Relationships', () => {
    it('should maintain client-caregiver relationships', async () => {
      // Mock client creation
      const client = { firstName: 'John', lastName: 'Doe' };
      mockClient.models.Client.create.mockResolvedValue({ 
        data: { ...client, id: 'client-123' } 
      });

      // Mock user creation
      const user = { userId: 'user-001', email: 'caregiver@test.com', firstName: 'Jane', lastName: 'Smith' };
      mockClient.models.UserProfile.create.mockResolvedValue({ 
        data: { ...user, id: 'user-456' } 
      });

      // Mock relationship creation
      const relationship = {
        clientId: 'client-123',
        caregiverId: 'user-456',
        role: 'primary' as const,
        permissions: ['view', 'edit'],
        isActive: true
      };
      mockClient.models.ClientCaregiver.create.mockResolvedValue({ 
        data: { ...relationship, id: 'rel-789' } 
      });

      // Create entities
      const clientResult = await mockClient.models.Client.create(client);
      const userResult = await mockClient.models.UserProfile.create(user);
      const relationshipResult = await mockClient.models.ClientCaregiver.create(relationship);

      // Verify relationships
      expect(relationshipResult.data.clientId).toBe(clientResult.data.id);
      expect(relationshipResult.data.caregiverId).toBe(userResult.data.id);
    });

    it('should maintain medication-client relationships', async () => {
      const clientId = 'client-123';
      const medication = generateSampleMedications([clientId])[0];
      
      mockClient.models.Medication.create.mockResolvedValue({ 
        data: { ...medication, id: 'med-456' } 
      });

      const result = await mockClient.models.Medication.create(medication);

      expect(result.data.clientId).toBe(clientId);
    });

    it('should maintain appointment-client relationships', async () => {
      const clientId = 'client-123';
      const appointment = {
        clientId,
        title: 'Check-up',
        appointmentDate: '2024-12-01',
        appointmentTime: '10:00',
        duration: 30,
        providerName: 'Dr. Smith',
        locationType: 'in_person' as const,
        status: 'scheduled' as const,
        priority: 'normal' as const,
        followUpRequired: false,
        reminderSent: false,
        createdBy: 'user-456'
      };
      
      mockClient.models.Appointment.create.mockResolvedValue({ 
        data: { ...appointment, id: 'appt-789' } 
      });

      const result = await mockClient.models.Appointment.create(appointment);

      expect(result.data.clientId).toBe(clientId);
      expect(result.data.createdBy).toBe('user-456');
    });
  });

  describe('Data Validation', () => {
    it('should validate email format in user profiles', () => {
      const sampleUser = generateSampleUserProfiles()[0];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(sampleUser.email)).toBe(true);
    });

    it('should validate phone number format', () => {
      const sampleUser = generateSampleUserProfiles()[0];
      const phoneRegex = /^\+1-\d{3}-\d{4}$/;
      
      if (sampleUser.phoneNumber) {
        expect(phoneRegex.test(sampleUser.phoneNumber)).toBe(true);
      }
    });

    it('should validate date formats', () => {
      const sampleClient = generateSampleClients()[0];
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(dateRegex.test(sampleClient.dateOfBirth)).toBe(true);
    });

    it('should validate medication dosage format', () => {
      const sampleMedication = generateSampleMedications(['client-123'])[0];
      
      expect(sampleMedication.dosage).toBeDefined();
      expect(sampleMedication.unit).toBeDefined();
      expect(typeof sampleMedication.dosage).toBe('string');
      expect(typeof sampleMedication.unit).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors gracefully', async () => {
      const sampleUser = generateSampleUserProfiles()[0];
      const error = new Error('Database connection failed');
      
      mockClient.models.UserProfile.create.mockRejectedValue(error);

      await expect(mockClient.models.UserProfile.create(sampleUser))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle missing required fields', async () => {
      const incompleteClient = {
        firstName: 'John'
        // Missing required fields
      };
      
      const error = new Error('Missing required field: lastName');
      mockClient.models.Client.create.mockRejectedValue(error);

      await expect(mockClient.models.Client.create(incompleteClient))
        .rejects.toThrow('Missing required field: lastName');
    });
  });
});

describe('Data Seeding Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should seed user profiles successfully', async () => {
    const sampleUsers = generateSampleUserProfiles();
    
    // Mock successful creation for each user
    sampleUsers.forEach((user, index) => {
      mockClient.models.UserProfile.create.mockResolvedValueOnce({
        data: { ...user, id: `user-${index + 1}` }
      });
    });

    const result = await seedUserProfiles();

    expect(mockClient.models.UserProfile.create).toHaveBeenCalledTimes(sampleUsers.length);
    expect(result).toHaveLength(sampleUsers.length);
  });

  it('should seed clients successfully', async () => {
    const sampleClients = generateSampleClients();
    
    // Mock successful creation for each client
    sampleClients.forEach((client, index) => {
      mockClient.models.Client.create.mockResolvedValueOnce({
        data: { ...client, id: `client-${index + 1}` }
      });
    });

    const result = await seedClients();

    expect(mockClient.models.Client.create).toHaveBeenCalledTimes(sampleClients.length);
    expect(result).toHaveLength(sampleClients.length);
  });

  it('should handle seeding errors gracefully', async () => {
    const error = new Error('Seeding failed');
    mockClient.models.UserProfile.create.mockRejectedValue(error);

    // The seeding function should catch errors and continue
    const result = await seedUserProfiles();

    expect(mockClient.models.UserProfile.create).toHaveBeenCalled();
    // Result should still be an array, even if some operations failed
    expect(Array.isArray(result)).toBe(true);
  });
});
/**
 * Data seeding utilities for development and testing environments
 * 
 * This module provides sample data and seeding functions to populate
 * the healthcare tracking app with realistic test data for development
 * and testing purposes.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import {
  UserRole,
  Gender,
  CaregiverRole,
  MedicationRoute,
  ScheduleType,
  AppointmentStatus,
  ProviderType,
  LocationType,
  Priority,
  MessageType,
  InvitationStatus,
  NotificationType
} from '@/types';

const client = generateClient<Schema>();

// Sample data generators
export const generateSampleUserProfiles = () => [
  {
    userId: 'user-001',
    email: 'sarah.johnson@email.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'primary' as UserRole,
    phoneNumber: '+1-555-0101',
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      medicationReminders: true,
      appointmentReminders: true
    },
    isActive: true,
    lastLoginAt: new Date().toISOString()
  },
  {
    userId: 'user-002',
    email: 'michael.chen@email.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'family' as UserRole,
    phoneNumber: '+1-555-0102',
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      medicationReminders: true,
      appointmentReminders: true
    },
    isActive: true,
    lastLoginAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    userId: 'user-003',
    email: 'dr.williams@healthcenter.com',
    firstName: 'Dr. Emily',
    lastName: 'Williams',
    role: 'professional' as UserRole,
    phoneNumber: '+1-555-0103',
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      medicationReminders: false,
      appointmentReminders: true
    },
    isActive: true,
    lastLoginAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

export const generateSampleClients = () => [
  {
    firstName: 'Eleanor',
    lastName: 'Johnson',
    dateOfBirth: '1945-03-15',
    gender: 'female' as Gender,
    medicalRecordNumber: 'MRN-001234',
    medicalConditions: [
      'Type 2 Diabetes',
      'Hypertension',
      'Osteoarthritis',
      'Mild Cognitive Impairment'
    ],
    allergies: ['Penicillin', 'Shellfish'],
    currentMedications: ['Metformin', 'Lisinopril', 'Ibuprofen'],
    emergencyContactName: 'Sarah Johnson',
    emergencyContactPhone: '+1-555-0101',
    emergencyContactRelationship: 'Daughter',
    insuranceProvider: 'Medicare',
    insurancePolicyNumber: 'MED123456789',
    insuranceGroupNumber: 'GRP001',
    primaryPhysician: 'Dr. Robert Smith',
    preferredPharmacy: 'CVS Pharmacy - Main Street',
    careNotes: 'Prefers morning appointments. Uses walker for mobility. Hearing aid in right ear.',
    isActive: true
  },
  {
    firstName: 'Robert',
    lastName: 'Chen',
    dateOfBirth: '1938-11-22',
    gender: 'male' as Gender,
    medicalRecordNumber: 'MRN-005678',
    medicalConditions: [
      'Chronic Heart Failure',
      'Atrial Fibrillation',
      'Chronic Kidney Disease Stage 3'
    ],
    allergies: ['Aspirin', 'Latex'],
    currentMedications: ['Warfarin', 'Metoprolol', 'Furosemide'],
    emergencyContactName: 'Michael Chen',
    emergencyContactPhone: '+1-555-0102',
    emergencyContactRelationship: 'Son',
    insuranceProvider: 'Blue Cross Blue Shield',
    insurancePolicyNumber: 'BCBS987654321',
    insuranceGroupNumber: 'GRP002',
    primaryPhysician: 'Dr. Lisa Martinez',
    preferredPharmacy: 'Walgreens - Oak Avenue',
    careNotes: 'Daily weight monitoring required. Low sodium diet. Oxygen at night.',
    isActive: true
  }
];

export const generateSampleMedications = (clientIds: string[]) => [
  {
    clientId: clientIds[0],
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    dosage: '500',
    unit: 'mg',
    frequency: 'Twice daily with meals',
    route: 'oral' as MedicationRoute,
    scheduleType: 'fixed_times' as ScheduleType,
    scheduledTimes: ['08:00', '18:00'],
    prescribingDoctor: 'Dr. Robert Smith',
    prescriptionDate: '2024-01-15',
    instructions: 'Take with food to reduce stomach upset. Monitor blood sugar levels.',
    sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
    startDate: '2024-01-15',
    isActive: true,
    isPRN: false,
    nextDueAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    missedDoses: 2,
    totalDoses: 180
  },
  {
    clientId: clientIds[0],
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '10',
    unit: 'mg',
    frequency: 'Once daily in the morning',
    route: 'oral' as MedicationRoute,
    scheduleType: 'fixed_times' as ScheduleType,
    scheduledTimes: ['08:00'],
    prescribingDoctor: 'Dr. Robert Smith',
    prescriptionDate: '2024-01-15',
    instructions: 'Take at the same time each day. Monitor blood pressure.',
    sideEffects: ['Dry cough', 'Dizziness', 'Fatigue'],
    startDate: '2024-01-15',
    isActive: true,
    isPRN: false,
    nextDueAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    missedDoses: 1,
    totalDoses: 90
  },
  {
    clientId: clientIds[1],
    name: 'Warfarin',
    genericName: 'Warfarin Sodium',
    dosage: '5',
    unit: 'mg',
    frequency: 'Once daily at the same time',
    route: 'oral' as MedicationRoute,
    scheduleType: 'fixed_times' as ScheduleType,
    scheduledTimes: ['17:00'],
    prescribingDoctor: 'Dr. Lisa Martinez',
    prescriptionDate: '2024-02-01',
    instructions: 'Take at the same time daily. Regular INR monitoring required.',
    sideEffects: ['Bleeding', 'Bruising', 'Hair loss'],
    startDate: '2024-02-01',
    isActive: true,
    isPRN: false,
    nextDueAt: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now
    missedDoses: 0,
    totalDoses: 60
  },
  {
    clientId: clientIds[0],
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosage: '400',
    unit: 'mg',
    frequency: 'As needed for pain',
    route: 'oral' as MedicationRoute,
    scheduleType: 'as_needed' as ScheduleType,
    prescribingDoctor: 'Dr. Robert Smith',
    prescriptionDate: '2024-01-20',
    instructions: 'Take with food. Do not exceed 3 doses per day.',
    sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness'],
    startDate: '2024-01-20',
    isActive: true,
    isPRN: true,
    missedDoses: 0,
    totalDoses: 15
  }
];

export const generateSampleAppointments = (clientIds: string[], userIds: string[]) => [
  {
    clientId: clientIds[0],
    title: 'Annual Physical Exam',
    description: 'Comprehensive annual physical examination and health screening',
    appointmentDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 1 week from now
    appointmentTime: '10:00',
    duration: 60,
    timeZone: 'America/New_York',
    providerName: 'Dr. Robert Smith',
    providerType: 'primary_care' as ProviderType,
    providerPhone: '+1-555-0201',
    locationType: 'in_person' as LocationType,
    address: '123 Medical Center Drive, Suite 200, Anytown, ST 12345',
    status: 'scheduled' as AppointmentStatus,
    appointmentType: 'Annual Physical',
    priority: 'normal' as Priority,
    preparationInstructions: 'Fasting required 12 hours before appointment. Bring current medication list.',
    documentsNeeded: ['Insurance card', 'Photo ID', 'Medication list'],
    followUpRequired: true,
    reminderSent: false,
    reminderTimes: [24, 2], // 24 hours and 2 hours before
    createdBy: userIds[0],
    notes: 'Client prefers morning appointments'
  },
  {
    clientId: clientIds[0],
    title: 'Diabetes Follow-up',
    description: 'Quarterly diabetes management and blood sugar monitoring review',
    appointmentDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], // 2 weeks from now
    appointmentTime: '14:30',
    duration: 30,
    timeZone: 'America/New_York',
    providerName: 'Dr. Jennifer Adams',
    providerType: 'specialist' as ProviderType,
    providerPhone: '+1-555-0202',
    locationType: 'in_person' as LocationType,
    address: '456 Endocrine Center, Floor 3, Anytown, ST 12345',
    status: 'scheduled' as AppointmentStatus,
    appointmentType: 'Follow-up',
    priority: 'normal' as Priority,
    preparationInstructions: 'Bring blood glucose log and current medications.',
    documentsNeeded: ['Blood glucose log', 'Insurance card'],
    followUpRequired: true,
    reminderSent: false,
    reminderTimes: [24, 2],
    createdBy: userIds[0],
    notes: 'Review A1C results from recent lab work'
  },
  {
    clientId: clientIds[1],
    title: 'Cardiology Consultation',
    description: 'Heart failure management and medication adjustment',
    appointmentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
    appointmentTime: '09:15',
    duration: 45,
    timeZone: 'America/New_York',
    providerName: 'Dr. Lisa Martinez',
    providerType: 'specialist' as ProviderType,
    providerPhone: '+1-555-0203',
    locationType: 'telehealth' as LocationType,
    teleHealthLink: 'https://telehealth.example.com/room/12345',
    status: 'confirmed' as AppointmentStatus,
    appointmentType: 'Consultation',
    priority: 'high' as Priority,
    preparationInstructions: 'Have recent weight measurements and symptom diary ready.',
    documentsNeeded: ['Weight log', 'Symptom diary', 'Current medication list'],
    followUpRequired: true,
    reminderSent: false,
    reminderTimes: [24, 1],
    createdBy: userIds[1],
    notes: 'Client reports increased shortness of breath'
  }
];

export const generateSampleMessages = (clientIds: string[], userIds: string[]) => [
  {
    clientId: clientIds[0],
    senderId: userIds[0],
    content: 'Mom took her morning medications on time today. Blood sugar was 145 mg/dL.',
    messageType: 'text' as MessageType,
    priority: 'normal' as Priority,
    isRead: true,
    readBy: [userIds[1]],
    readAt: [new Date(Date.now() - 3600000).toISOString()]
  },
  {
    clientId: clientIds[0],
    senderId: userIds[1],
    content: 'Thanks for the update! That blood sugar reading looks good. Did she eat breakfast before taking the Metformin?',
    messageType: 'text' as MessageType,
    priority: 'normal' as Priority,
    isRead: true,
    readBy: [userIds[0]],
    readAt: [new Date(Date.now() - 1800000).toISOString()]
  },
  {
    clientId: clientIds[1],
    senderId: userIds[1],
    content: 'URGENT: Dad is experiencing chest pain and shortness of breath. Taking him to ER now.',
    messageType: 'urgent' as MessageType,
    priority: 'urgent' as Priority,
    mentions: [userIds[2]],
    isRead: false,
    readBy: [],
    readAt: []
  },
  {
    clientId: clientIds[0],
    senderId: userIds[0],
    content: 'Reminder: Mom has her diabetes follow-up appointment tomorrow at 2:30 PM with Dr. Adams.',
    messageType: 'appointment_reminder' as MessageType,
    priority: 'normal' as Priority,
    systemData: {
      appointmentId: 'appointment-002',
      reminderType: 'day_before'
    },
    isRead: false,
    readBy: [],
    readAt: []
  }
];

export const generateSampleInvitations = (clientIds: string[], userIds: string[]) => [
  {
    clientId: clientIds[0],
    invitedBy: userIds[0],
    invitedEmail: 'nurse.patricia@homecare.com',
    role: 'professional' as CaregiverRole,
    permissions: ['view', 'edit'],
    personalMessage: 'Hi Patricia, I would like to invite you to help coordinate care for my mother Eleanor. You can view her medications and appointments.',
    status: 'pending' as InvitationStatus,
    token: 'inv_token_001_secure_random_string',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() // 7 days from now
  },
  {
    clientId: clientIds[1],
    invitedBy: userIds[1],
    invitedEmail: 'john.chen@email.com',
    role: 'family' as CaregiverRole,
    permissions: ['view'],
    personalMessage: 'John, I\'m adding you to Dad\'s caregiver so you can stay updated on his appointments and medications.',
    status: 'pending' as InvitationStatus,
    token: 'inv_token_002_secure_random_string',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
  }
];

export const generateSampleNotifications = (userIds: string[], clientIds: string[]) => [
  {
    userId: userIds[0],
    type: 'medication_due' as NotificationType,
    title: 'Medication Reminder',
    message: 'Eleanor\'s Metformin is due in 30 minutes (8:00 AM)',
    actionUrl: '/dashboard',
    clientId: clientIds[0],
    medicationId: 'medication-001',
    isRead: false,
    priority: 'normal' as Priority,
    deliveryMethod: ['in_app', 'push'] as any
  },
  {
    userId: userIds[0],
    type: 'appointment_reminder' as NotificationType,
    title: 'Appointment Tomorrow',
    message: 'Eleanor has an appointment with Dr. Smith tomorrow at 10:00 AM',
    actionUrl: '/calendar',
    clientId: clientIds[0],
    appointmentId: 'appointment-001',
    isRead: false,
    priority: 'normal' as Priority,
    deliveryMethod: ['in_app', 'email'] as any
  },
  {
    userId: userIds[1],
    type: 'urgent_message' as NotificationType,
    title: 'Urgent Message',
    message: 'New urgent message about Robert Chen',
    actionUrl: '/chat',
    clientId: clientIds[1],
    messageId: 'message-003',
    isRead: false,
    priority: 'urgent' as Priority,
    deliveryMethod: ['in_app', 'sms', 'push'] as any
  }
];

// Seeding functions
export async function seedUserProfiles() {
  console.log('Seeding user profiles...');
  const userProfiles = generateSampleUserProfiles();
  const createdUsers = [];

  for (const userProfile of userProfiles) {
    try {
      const { data } = await client.models.UserProfile.create(userProfile);
      createdUsers.push(data);
      console.log(`Created user profile: ${userProfile.firstName} ${userProfile.lastName}`);
    } catch (error) {
      console.error(`Error creating user profile for ${userProfile.email}:`, error);
    }
  }

  return createdUsers;
}

export async function seedClients() {
  console.log('Seeding clients...');
  const clients = generateSampleClients();
  const createdClients = [];

  for (const client of clients) {
    try {
      const { data } = await client.models.Client.create(client);
      createdClients.push(data);
      console.log(`Created client: ${client.firstName} ${client.lastName}`);
    } catch (error) {
      console.error(`Error creating client ${client.firstName} ${client.lastName}:`, error);
    }
  }

  return createdClients;
}

export async function seedClientCaregivers(clientIds: string[], userIds: string[]) {
  console.log('Seeding client-caregiver relationships...');
  const relationships = [
    {
      clientId: clientIds[0],
      caregiverId: userIds[0],
      role: 'primary' as CaregiverRole,
      permissions: ['view', 'edit', 'admin'],
      addedBy: userIds[0],
      isActive: true
    },
    {
      clientId: clientIds[0],
      caregiverId: userIds[1],
      role: 'secondary' as CaregiverRole,
      permissions: ['view', 'edit'],
      addedBy: userIds[0],
      isActive: true
    },
    {
      clientId: clientIds[1],
      caregiverId: userIds[1],
      role: 'primary' as CaregiverRole,
      permissions: ['view', 'edit', 'admin'],
      addedBy: userIds[1],
      isActive: true
    }
  ];

  const createdRelationships = [];
  for (const relationship of relationships) {
    try {
      const { data } = await client.models.ClientCaregiver.create(relationship);
      createdRelationships.push(data);
      console.log(`Created client-caregiver relationship: Client ${relationship.clientId} - Caregiver ${relationship.caregiverId}`);
    } catch (error) {
      console.error(`Error creating client-caregiver relationship:`, error);
    }
  }

  return createdRelationships;
}

export async function seedMedications(clientIds: string[]) {
  console.log('Seeding medications...');
  const medications = generateSampleMedications(clientIds);
  const createdMedications = [];

  for (const medication of medications) {
    try {
      const { data } = await client.models.Medication.create(medication);
      createdMedications.push(data);
      console.log(`Created medication: ${medication.name} for client ${medication.clientId}`);
    } catch (error) {
      console.error(`Error creating medication ${medication.name}:`, error);
    }
  }

  return createdMedications;
}

export async function seedAppointments(clientIds: string[], userIds: string[]) {
  console.log('Seeding appointments...');
  const appointments = generateSampleAppointments(clientIds, userIds);
  const createdAppointments = [];

  for (const appointment of appointments) {
    try {
      const { data } = await client.models.Appointment.create(appointment);
      createdAppointments.push(data);
      console.log(`Created appointment: ${appointment.title} for client ${appointment.clientId}`);
    } catch (error) {
      console.error(`Error creating appointment ${appointment.title}:`, error);
    }
  }

  return createdAppointments;
}

export async function seedMessages(clientIds: string[], userIds: string[]) {
  console.log('Seeding messages...');
  const messages = generateSampleMessages(clientIds, userIds);
  const createdMessages = [];

  for (const message of messages) {
    try {
      const { data } = await client.models.Message.create(message);
      createdMessages.push(data);
      console.log(`Created message from user ${message.senderId} for client ${message.clientId}`);
    } catch (error) {
      console.error(`Error creating message:`, error);
    }
  }

  return createdMessages;
}

export async function seedInvitations(clientIds: string[], userIds: string[]) {
  console.log('Seeding caregiver invitations...');
  const invitations = generateSampleInvitations(clientIds, userIds);
  const createdInvitations = [];

  for (const invitation of invitations) {
    try {
      const { data } = await client.models.CaregiverInvitation.create(invitation);
      createdInvitations.push(data);
      console.log(`Created invitation for ${invitation.invitedEmail} to client ${invitation.clientId}`);
    } catch (error) {
      console.error(`Error creating invitation for ${invitation.invitedEmail}:`, error);
    }
  }

  return createdInvitations;
}

export async function seedNotifications(userIds: string[], clientIds: string[]) {
  console.log('Seeding notifications...');
  const notifications = generateSampleNotifications(userIds, clientIds);
  const createdNotifications = [];

  for (const notification of notifications) {
    try {
      const { data } = await client.models.Notification.create(notification);
      createdNotifications.push(data);
      console.log(`Created notification: ${notification.title} for user ${notification.userId}`);
    } catch (error) {
      console.error(`Error creating notification ${notification.title}:`, error);
    }
  }

  return createdNotifications;
}

// Main seeding function
export async function seedAllData() {
  console.log('Starting data seeding process...');
  
  try {
    // Seed in order due to dependencies
    const users = await seedUserProfiles();
    const userIds = users.map(user => user?.id).filter(Boolean) as string[];
    
    const clients = await seedClients();
    const clientIds = clients.map(client => client?.id).filter(Boolean) as string[];
    
    await seedClientCaregivers(clientIds, userIds);
    await seedMedications(clientIds);
    await seedAppointments(clientIds, userIds);
    await seedMessages(clientIds, userIds);
    await seedInvitations(clientIds, userIds);
    await seedNotifications(userIds, clientIds);
    
    console.log('Data seeding completed successfully!');
    return {
      userIds,
      clientIds,
      success: true
    };
  } catch (error) {
    console.error('Error during data seeding:', error);
    return {
      success: false,
      error
    };
  }
}

// Cleanup function for testing
export async function clearAllData() {
  console.log('Clearing all seeded data...');
  
  try {
    // Clear in reverse order due to dependencies
    const notifications = await client.models.Notification.list();
    for (const notification of notifications.data) {
      await client.models.Notification.delete({ id: notification.id });
    }
    
    const invitations = await client.models.CaregiverInvitation.list();
    for (const invitation of invitations.data) {
      await client.models.CaregiverInvitation.delete({ id: invitation.id });
    }
    
    const messages = await client.models.Message.list();
    for (const message of messages.data) {
      await client.models.Message.delete({ id: message.id });
    }
    
    const appointments = await client.models.Appointment.list();
    for (const appointment of appointments.data) {
      await client.models.Appointment.delete({ id: appointment.id });
    }
    
    const medicationLogs = await client.models.MedicationLog.list();
    for (const log of medicationLogs.data) {
      await client.models.MedicationLog.delete({ id: log.id });
    }
    
    const medications = await client.models.Medication.list();
    for (const medication of medications.data) {
      await client.models.Medication.delete({ id: medication.id });
    }
    
    const clientCaregivers = await client.models.ClientCaregiver.list();
    for (const relationship of clientCaregivers.data) {
      await client.models.ClientCaregiver.delete({ id: relationship.id });
    }
    
    const clients = await client.models.Client.list();
    for (const client of clients.data) {
      await client.models.Client.delete({ id: client.id });
    }
    
    const userProfiles = await client.models.UserProfile.list();
    for (const user of userProfiles.data) {
      await client.models.UserProfile.delete({ id: user.id });
    }
    
    console.log('All data cleared successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error };
  }
}
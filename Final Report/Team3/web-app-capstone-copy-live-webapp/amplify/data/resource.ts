import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Healthcare Tracking App GraphQL Schema
 * 
 * This schema defines the data models for a healthcare coordination app
 * that allows multiple caregivers to manage patient care, medications,
 * appointments, and communication.
 */
const schema = a.schema({
  // User Profile model - extends Cognito user with app-specific data
  UserProfile: a
    .model({
      userId: a.id().required(), // Maps to Cognito user ID
      email: a.email().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      role: a.enum(['primary', 'family', 'professional']),
      phoneNumber: a.phone(),
      profilePicture: a.url(),
      notificationPreferences: a.json(),
      isActive: a.boolean().default(true),
      lastLoginAt: a.datetime(),
      
      // Relationships
      clientsAsCaregiver: a.hasMany('ClientCaregiver', 'caregiverId'),
      sentMessages: a.hasMany('Message', 'senderId'),
      createdAppointments: a.hasMany('Appointment', 'createdBy'),
      sentInvitations: a.hasMany('CaregiverInvitation', 'invitedBy'),
      receivedInvitations: a.hasMany('CaregiverInvitation', 'invitedUserId'),
      notifications: a.hasMany('Notification', 'userId'),
      // Direct messaging relationships
      conversationParticipants: a.hasMany('ConversationParticipant', 'userId'),
      sentDirectMessages: a.hasMany('DirectMessage', 'senderId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ])
    .secondaryIndexes((index) => [
      index('userId').name('byUserId'),
      index('email').name('byEmail'),
    ]),

  // Client model - central entity for care coordination
  Client: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      dateOfBirth: a.date().required(),
      gender: a.enum(['male', 'female', 'other', 'prefer_not_to_say']),
      medicalRecordNumber: a.string(),
      
      // Medical Information
      medicalConditions: a.string().array(),
      allergies: a.string().array(),
      currentMedications: a.string().array(),
      
      // Emergency Contact
      emergencyContactName: a.string().required(),
      emergencyContactPhone: a.phone().required(),
      emergencyContactRelationship: a.string(),
      
      // Insurance Information
      insuranceProvider: a.string(),
      insurancePolicyNumber: a.string(),
      insuranceGroupNumber: a.string(),
      
      // Care Settings
      primaryPhysician: a.string(),
      preferredPharmacy: a.string(),
      careNotes: a.string(),
      isActive: a.boolean().default(true),
      
      // Relationships
      caregivers: a.hasMany('ClientCaregiver', 'clientId'),
      medications: a.hasMany('Medication', 'clientId'),
      appointments: a.hasMany('Appointment', 'clientId'),
      messages: a.hasMany('Message', 'clientId'),
      invitations: a.hasMany('CaregiverInvitation', 'clientId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('firstName').name('byFirstName'),
    ]),

  // Junction table for Client-Caregiver many-to-many relationship
  ClientCaregiver: a
    .model({
      clientId: a.id().required(),
      caregiverId: a.id().required(),
      role: a.enum(['primary', 'secondary', 'emergency']),
      permissions: a.string().array(), // ['view', 'edit', 'admin']
      addedAt: a.datetime(),
      addedBy: a.id(),
      isActive: a.boolean().default(true),
      
      // Relationships
      client: a.belongsTo('Client', 'clientId'),
      caregiver: a.belongsTo('UserProfile', 'caregiverId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('clientId').name('byClientId'),
      index('caregiverId').name('byCaregiverId'),
    ]),

  // Medication model - tracks patient medications and schedules
  Medication: a
    .model({
      clientId: a.id().required(),
      name: a.string().required(),
      genericName: a.string(),
      dosage: a.string().required(),
      unit: a.string().required(), // mg, ml, tablets, etc.
      frequency: a.string().required(), // "twice daily", "every 8 hours", etc.
      route: a.enum(['oral', 'injection', 'topical', 'inhalation', 'other']),
      
      // Scheduling
      scheduleType: a.enum(['fixed_times', 'interval', 'as_needed']),
      scheduledTimes: a.string().array(), // ["08:00", "20:00"]
      intervalHours: a.integer(),
      
      // Prescription Details
      prescribingDoctor: a.string().required(),
      prescriptionDate: a.date(),
      instructions: a.string(),
      sideEffects: a.string().array(),
      
      // Status and Dates
      startDate: a.date().required(),
      endDate: a.date(),
      isActive: a.boolean().default(true),
      isPRN: a.boolean().default(false), // Pro re nata (as needed)
      
      // Tracking
      lastTakenAt: a.datetime(),
      nextDueAt: a.datetime(),
      missedDoses: a.integer().default(0),
      totalDoses: a.integer().default(0),
      
      // Relationships
      client: a.belongsTo('Client', 'clientId'),
      medicationLogs: a.hasMany('MedicationLog', 'medicationId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('clientId').name('byClientId'),
      index('nextDueAt').name('byNextDue'),
    ]),

  // Medication Log model - tracks when medications are taken
  MedicationLog: a
    .model({
      medicationId: a.id().required(),
      takenAt: a.datetime().required(),
      scheduledFor: a.datetime(),
      dosageTaken: a.string(),
      takenBy: a.id().required(), // UserProfile ID
      status: a.enum(['taken', 'missed', 'skipped', 'partial']),
      notes: a.string(),
      sideEffectsNoted: a.string().array(),
      
      // Relationships
      medication: a.belongsTo('Medication', 'medicationId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('medicationId').name('byMedicationId'),
      index('takenBy').name('byTakenBy'),
    ]),

  // Appointment model - manages medical appointments
  Appointment: a
    .model({
      clientId: a.id().required(),
      title: a.string().required(),
      description: a.string(),
      
      // Date and Time
      appointmentDate: a.date().required(),
      appointmentTime: a.time().required(),
      duration: a.integer().default(30), // minutes
      timeZone: a.string(),
      
      // Provider Information
      providerName: a.string().required(),
      providerType: a.enum(['primary_care', 'specialist', 'dentist', 'mental_health', 'other']),
      providerPhone: a.phone(),
      
      // Location
      locationType: a.enum(['in_person', 'telehealth', 'phone']),
      address: a.string(),
      roomNumber: a.string(),
      teleHealthLink: a.url(),
      
      // Status and Management
      status: a.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
      appointmentType: a.string(), // "Annual Physical", "Follow-up", etc.
      priority: a.enum(['low', 'normal', 'high', 'urgent']),
      
      // Preparation and Follow-up
      preparationInstructions: a.string(),
      documentsNeeded: a.string().array(),
      followUpRequired: a.boolean().default(false),
      
      // Reminders
      reminderSent: a.boolean().default(false),
      reminderTimes: a.integer().array(), // hours before appointment
      
      // Tracking
      createdBy: a.id().required(),
      confirmedBy: a.id(),
      completedBy: a.id(),
      notes: a.string(),
      
      // Relationships
      client: a.belongsTo('Client', 'clientId'),
      creator: a.belongsTo('UserProfile', 'createdBy'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('clientId').name('byClientId'),
      index('appointmentDate').name('byDate'),
      index('status').name('byStatus'),
      index('createdBy').name('byCreatedBy'),
    ]),

  // Message model - enables caregiver communication
  Message: a
    .model({
      clientId: a.id().required(),
      senderId: a.id().required(),
      content: a.string().required(),
      
      // Message Properties
      messageType: a.enum(['text', 'urgent', 'system', 'medication_reminder', 'appointment_reminder']),
      priority: a.enum(['low', 'normal', 'high', 'urgent']),
      
      // Rich Content
      attachments: a.string().array(), // URLs to S3 objects
      mentions: a.id().array(), // UserProfile IDs mentioned in message
      
      // Status Tracking
      isRead: a.boolean().default(false),
      readBy: a.id().array(), // UserProfile IDs who have read the message
      readAt: a.datetime().array(),
      
      // Threading (for future use)
      threadId: a.id(),
      replyToId: a.id(),
      
      // System Messages
      systemData: a.json(), // For system-generated messages
      
      // Relationships
      client: a.belongsTo('Client', 'clientId'),
      sender: a.belongsTo('UserProfile', 'senderId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('clientId').name('byClientId'),
      index('senderId').name('bySenderId'),
      index('messageType').name('byMessageType'),
      index('threadId').name('byThreadId'),
    ]),

  // Conversation model - for direct caregiver messaging
  Conversation: a
    .model({
      title: a.string(),
      isGroup: a.boolean().default(false),
      // Relationships
      participants: a.hasMany('ConversationParticipant', 'conversationId'),
      messages: a.hasMany('DirectMessage', 'conversationId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ]),

  ConversationParticipant: a
    .model({
      conversationId: a.id().required(),
      userId: a.id().required(),
      joinedAt: a.datetime(),
      lastReadAt: a.datetime(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
      user: a.belongsTo('UserProfile', 'userId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('userId').name('byUserId'),
      index('conversationId').name('byConversationId'),
    ]),

  DirectMessage: a
    .model({
      conversationId: a.id().required(),
      senderId: a.id().required(),
      content: a.string().required(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
      sender: a.belongsTo('UserProfile', 'senderId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('conversationId').name('byConversationId'),
      index('senderId').name('bySenderId'),
    ]),

  // Caregiver Invitation model - manages team invitations
  CaregiverInvitation: a
    .model({
      clientId: a.id().required(),
      invitedBy: a.id().required(),
      invitedEmail: a.email().required(),
      invitedUserId: a.id(), // Set when invitation is accepted
      
      // Invitation Details
      role: a.enum(['primary', 'secondary', 'emergency']),
      permissions: a.string().array(),
      personalMessage: a.string(),
      
      // Status and Expiry
      status: a.enum(['pending', 'accepted', 'declined', 'expired', 'cancelled']),
      token: a.string().required(), // Secure invitation token
      expiresAt: a.datetime().required(),
      acceptedAt: a.datetime(),
      
      // Relationships
      client: a.belongsTo('Client', 'clientId'),
      inviter: a.belongsTo('UserProfile', 'invitedBy'),
      invitedUser: a.belongsTo('UserProfile', 'invitedUserId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('clientId').name('byClientId'),
      index('invitedBy').name('byInvitedBy'),
      index('invitedEmail').name('byInvitedEmail'),
      index('token').name('byToken'),
      index('status').name('byStatus'),
    ]),

  // Notification model - tracks app notifications
  Notification: a
    .model({
      userId: a.id().required(),
      type: a.enum([
        'medication_due',
        'medication_overdue',
        'appointment_reminder',
        'new_message',
        'urgent_message',
        'invitation_received',
        'patient_updated',
        'system_alert'
      ]),
      
      // Content
      title: a.string().required(),
      message: a.string().required(),
      actionUrl: a.string(),
      
      // Related Entities
      clientId: a.id(),
      medicationId: a.id(),
      appointmentId: a.id(),
      messageId: a.id(),
      
      // Status
      isRead: a.boolean().default(false),
      readAt: a.datetime(),
      priority: a.enum(['low', 'normal', 'high', 'urgent']),
      
      // Delivery
      deliveryMethod: a.string().array(),
      deliveredAt: a.datetime(),
      
      // Relationships
      user: a.belongsTo('UserProfile', 'userId'),
    })
    .authorization((allow) => [
      allow.owner(),
    ])
    .secondaryIndexes((index) => [
      index('userId').name('byUserId'),
      index('type').name('byType'),
      index('priority').name('byPriority'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

// Note: DAX cluster and CloudFront caching have been disabled for simplified deployment

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

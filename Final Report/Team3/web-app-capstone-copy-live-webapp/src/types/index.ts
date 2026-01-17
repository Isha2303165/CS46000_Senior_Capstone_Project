// Base types matching Amplify GraphQL schema

export type UserRole = 'primary' | 'family' | 'professional';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type CaregiverRole = 'primary' | 'secondary' | 'emergency';
export type MedicationRoute = 'oral' | 'injection' | 'topical' | 'inhalation' | 'other';
export type ScheduleType = 'fixed_times' | 'interval' | 'as_needed';
export type MedicationLogStatus = 'taken' | 'missed' | 'skipped' | 'partial';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type ProviderType = 'primary_care' | 'specialist' | 'dentist' | 'mental_health' | 'other';
export type LocationType = 'in_person' | 'telehealth' | 'phone';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageType = 'text' | 'urgent' | 'system' | 'medication_reminder' | 'appointment_reminder';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
export type NotificationType =
  | 'medication_due'
  | 'medication_overdue'
  | 'appointment_reminder'
  | 'new_message'
  | 'urgent_message'
  | 'invitation_received'
  | 'client_updated'
  | 'system_alert';
export type DeliveryMethod = 'in_app' | 'email' | 'sms' | 'push';

export interface UserProfile {
  id: string;
  userId: string; // Cognito user ID
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phoneNumber?: string;
  profilePicture?: string;
  notificationPreferences?: Record<string, any>;
  isActive: boolean;
  lastLoginAt?: string;
  clientsAsCaregiver?: ClientCaregiver[];
  sentMessages?: Message[];
  createdAppointments?: Appointment[];
  sentInvitations?: CaregiverInvitation[];
  receivedInvitations?: CaregiverInvitation[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender?: Gender;
  profilePicture?: string;
  medicalRecordNumber?: string;
  medicalConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  primaryPhysician?: string;
  preferredPharmacy?: string;
  careNotes?: string;
  isActive: boolean;
  caregivers?: ClientCaregiver[];
  medications?: Medication[];
  appointments?: Appointment[];
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientCaregiver {
  id: string;
  clientId: string;
  caregiverId: string;
  role: CaregiverRole;
  permissions?: string[];
  addedAt?: string;
  addedBy?: string;
  isActive: boolean;
  client?: Client;
  caregiver?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  clientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  unit: string;
  frequency: string;
  route?: MedicationRoute;
  scheduleType: ScheduleType;
  scheduledTimes?: string[];
  intervalHours?: number;
  prescribingDoctor: string;
  prescriptionDate?: string;
  instructions?: string;
  sideEffects?: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isPRN: boolean;
  lastTakenAt?: string;
  nextDueAt?: string;
  missedDoses: number;
  totalDoses: number;
  client?: Client;
  medicationLogs?: MedicationLog[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string;
  scheduledFor?: string;
  dosageTaken?: string;
  takenBy: string;
  status: MedicationLogStatus;
  notes?: string;
  sideEffectsNoted?: string[];
  medication?: Medication;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  timeZone?: string;
  providerName: string;
  providerType?: ProviderType;
  providerPhone?: string;
  locationType: LocationType;
  address?: string;
  roomNumber?: string;
  teleHealthLink?: string;
  status: AppointmentStatus;
  appointmentType?: string;
  priority: Priority;
  preparationInstructions?: string;
  documentsNeeded?: string[];
  followUpRequired: boolean;
  reminderSent: boolean;
  reminderTimes?: number[];
  createdBy: string;
  confirmedBy?: string;
  completedBy?: string;
  notes?: string;
  client?: Client;
  creator?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  clientId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  priority: Priority;
  attachments?: string[];
  mentions?: string[];
  isRead: boolean;
  readBy?: string[];
  readAt?: string[];
  threadId?: string;
  replyToId?: string;
  systemData?: Record<string, any>;
  client?: Client;
  sender?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

// Direct messages (caregiver-to-caregiver)
export interface Conversation {
  id: string;
  title?: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt?: string;
  lastReadAt?: string;
  conversation?: Conversation;
  user?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  conversation?: Conversation;
  sender?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface CaregiverInvitation {
  id: string;
  clientId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedUserId?: string;
  role: CaregiverRole;
  permissions?: string[];
  personalMessage?: string;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  client?: Client;
  inviter?: UserProfile;
  invitedUser?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  clientId?: string;
  medicationId?: string;
  appointmentId?: string;
  messageId?: string;
  isRead: boolean;
  readAt?: string;
  priority: Priority;
  deliveryMethod?: DeliveryMethod[];
  deliveredAt?: string;
  user?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

// Form types for creating/updating entities
export interface CreateUserProfileInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phoneNumber?: string;
  profilePicture?: string;
  notificationPreferences?: Record<string, any>;
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: Gender;
  medicalRecordNumber?: string;
  medicalConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  primaryPhysician?: string;
  preferredPharmacy?: string;
  careNotes?: string;
}

export interface CreateClientCaregiverInput {
  clientId: string;
  caregiverId: string;
  role: CaregiverRole;
  permissions?: string[];
  addedBy?: string;
}

export interface CreateMedicationInput {
  clientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  unit: string;
  frequency: string;
  route?: MedicationRoute;
  scheduleType: ScheduleType;
  scheduledTimes?: string[];
  intervalHours?: number;
  prescribingDoctor: string;
  prescriptionDate?: string;
  instructions?: string;
  sideEffects?: string[];
  startDate: string;
  endDate?: string;
  isPRN?: boolean;
  nextDueAt?: string;
}

export interface CreateMedicationLogInput {
  medicationId: string;
  takenAt: string;
  scheduledFor?: string;
  dosageTaken?: string;
  takenBy: string;
  status: MedicationLogStatus;
  notes?: string;
  sideEffectsNoted?: string[];
}

export interface CreateAppointmentInput {
  clientId: string;
  title: string;
  description?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  timeZone?: string;
  providerName: string;
  providerType?: ProviderType;
  providerPhone?: string;
  locationType?: LocationType;
  address?: string;
  roomNumber?: string;
  teleHealthLink?: string;
  status: AppointmentStatus;
  appointmentType?: string;
  priority?: Priority;
  preparationInstructions?: string;
  documentsNeeded?: string[];
  followUpRequired?: boolean;
  reminderTimes?: number[];
  createdBy: string;
  notes?: string;
}

export interface CreateMessageInput {
  clientId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
  priority?: Priority;
  attachments?: string[];
  mentions?: string[];
  threadId?: string;
  replyToId?: string;
  systemData?: Record<string, any>;
}

export interface CreateCaregiverInvitationInput {
  clientId: string;
  invitedBy: string;
  invitedEmail: string;
  role?: CaregiverRole;
  permissions?: string[];
  personalMessage?: string;
  token: string;
  expiresAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  clientId?: string;
  medicationId?: string;
  appointmentId?: string;
  messageId?: string;
  priority?: Priority;
  deliveryMethod?: DeliveryMethod[];
}

// Update types (all fields optional except id)
export interface UpdateUserProfileInput extends Partial<CreateUserProfileInput> {
  id: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string;
}

export interface UpdateClientCaregiverInput extends Partial<CreateClientCaregiverInput> {
  id: string;
}

export interface UpdateMedicationInput extends Partial<CreateMedicationInput> {
  id: string;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {
  id: string;
}

export interface UpdateMessageInput extends Partial<CreateMessageInput> {
  id: string;
}

export interface UpdateCaregiverInvitationInput extends Partial<CreateCaregiverInvitationInput> {
  id: string;
}

export interface UpdateNotificationInput extends Partial<CreateNotificationInput> {
  id: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  total?: number;
}

// Query and mutation result types
export interface QueryResult<T> {
  data?: T;
  loading: boolean;
  error?: Error;
}

export interface MutationResult<T> {
  data?: T;
  loading: boolean;
  error?: Error;
}

// Client Detail Page Types
export interface ClientDetailPageProps {
  params: {
    clientId: string;
  };
}

export interface ClientDetailState {
  activeTab: string;
  expandedSections: Record<string, boolean>;
  quickActionsVisible: boolean;
  recentActions: Array<{
    type: string;
    timestamp: string;
    undoable: boolean;
    undoAction: () => void;
  }>;
}

export interface ClientDetailHeaderProps {
  client: Client;
  onEdit?: () => void;
  onEmergencyContact?: () => void;
}

export interface ClientDetailContentProps {
  client: Client;
}

export interface ClientDetailErrorBoundaryProps {
  children: React.ReactNode;
  clientId: string;
  fallback?: React.ReactNode;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}
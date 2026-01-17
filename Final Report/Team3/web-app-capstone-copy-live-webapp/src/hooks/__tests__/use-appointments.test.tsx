import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppointments } from '../use-appointments';
import { client } from '@/lib/graphql-client';
import { sesEmailService } from '@/lib/ses-email-service';
import { Appointment, Client, UserProfile, ClientCaregiver } from '@/types';

// Mock the GraphQL client
vi.mock('@/lib/graphql-client', () => ({
  client: {
    models: {
      Appointment: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
        observeQuery: vi.fn(),
      },
      Client: {
        get: vi.fn(),
      },
      ClientCaregiver: {
        list: vi.fn(),
      },
      UserProfile: {
        get: vi.fn(),
      },
    },
  },
}));

// Mock the SES email service
vi.mock('@/lib/ses-email-service', () => ({
  sesEmailService: {
    sendAppointmentReminder: vi.fn(),
    sendAppointmentUpdate: vi.fn(),
    sendUrgentAppointmentAlert: vi.fn(),
  },
  useAppointmentEmails: () => ({
    sendReminder: vi.fn(),
    sendUpdate: vi.fn(),
    sendUrgentAlert: vi.fn(),
  }),
}));

const mockAppointment: Appointment = {
  id: '1',
  clientId: 'client-1',
  title: 'Annual Checkup',
  description: 'Routine annual physical examination',
  appointmentDate: '2024-01-15',
  appointmentTime: '14:30',
  duration: 60,
  timeZone: 'America/New_York',
  providerName: 'Dr. Johnson',
  providerType: 'primary_care',
  providerPhone: '555-0123',
  locationType: 'in_person',
  address: '123 Medical Center Dr, Suite 100',
  roomNumber: 'Room 205',
  status: 'scheduled',
  appointmentType: 'Physical Exam',
  priority: 'normal',
  preparationInstructions: 'Please bring your insurance card and medication list',
  documentsNeeded: ['Insurance Card', 'Photo ID', 'Medication List'],
  followUpRequired: true,
  reminderSent: false,
  reminderTimes: [24, 2],
  createdBy: 'caregiver-1',
  notes: 'Client has been experiencing fatigue',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0456',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockUserProfile: UserProfile = {
  id: 'caregiver-1',
  userId: 'user-1',
  email: 'caregiver@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockClientCaregiver: ClientCaregiver = {
  id: 'pc-1',
  clientId: 'client-1',
  caregiverId: 'caregiver-1',
  role: 'primary',
  isActive: true,
  caregiver: mockUserProfile,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(client.models.Appointment.observeQuery).mockReturnValue({
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAppointments', () => {
    it('should fetch appointments successfully', async () => {
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [mockAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([mockAppointment]);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch appointments';
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: null,
        errors: [{ message: errorMessage }],
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should filter appointments by client ID', async () => {
      const clientAppointments = [mockAppointment];
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: clientAppointments,
        errors: null,
      });

      const { result } = renderHook(() => useAppointments({ clientId: 'client-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(client.models.Appointment.list).toHaveBeenCalledWith({
        filter: { clientId: { eq: 'client-1' } }
      });
      expect(result.current.appointments).toEqual(clientAppointments);
    });

    it('should filter appointments by status', async () => {
      const scheduledAppointment = { ...mockAppointment, status: 'scheduled' as const };
      const completedAppointment = { ...mockAppointment, id: '2', status: 'completed' as const };
      
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [scheduledAppointment, completedAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments({ status: 'scheduled' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([scheduledAppointment]);
    });

    it('should sort appointments by date and time', async () => {
      const appointment1 = { ...mockAppointment, id: '1', appointmentDate: '2024-01-15', appointmentTime: '14:30' };
      const appointment2 = { ...mockAppointment, id: '2', appointmentDate: '2024-01-15', appointmentTime: '09:00' };
      const appointment3 = { ...mockAppointment, id: '3', appointmentDate: '2024-01-14', appointmentTime: '16:00' };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [appointment1, appointment2, appointment3],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should be sorted: appointment3 (Jan 14), appointment2 (Jan 15 9:00), appointment1 (Jan 15 14:30)
      expect(result.current.appointments[0].id).toBe('3');
      expect(result.current.appointments[1].id).toBe('2');
      expect(result.current.appointments[2].id).toBe('1');
    });
  });

  describe('createAppointment', () => {
    const newAppointmentInput = {
      clientId: 'client-1',
      title: 'New Appointment',
      appointmentDate: '2024-02-01',
      appointmentTime: '10:00',
      duration: 30,
      providerName: 'Dr. Smith',
      locationType: 'in_person' as const,
      status: 'scheduled' as const,
      priority: 'normal' as const,
      followUpRequired: false,
      reminderSent: false,
      createdBy: 'caregiver-1',
    };

    beforeEach(() => {
      // Mock successful creation
      vi.mocked(client.models.Appointment.create).mockResolvedValue({
        data: { ...mockAppointment, ...newAppointmentInput, id: 'new-appointment' },
        errors: null,
      });

      // Mock client and caregiver data for notifications
      vi.mocked(client.models.Client.get).mockResolvedValue({
        data: mockClient,
        errors: null,
      });

      vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
        data: [mockClientCaregiver],
        errors: null,
      });

      vi.mocked(client.models.UserProfile.get).mockResolvedValue({
        data: mockUserProfile,
        errors: null,
      });

      // Mock no conflicts
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [],
        errors: null,
      });
    });

    it('should create appointment successfully', async () => {
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        const createdAppointment = await result.current.createAppointment(newAppointmentInput);
        expect(createdAppointment.title).toBe('New Appointment');
      });

      expect(client.models.Appointment.create).toHaveBeenCalledWith(newAppointmentInput);
      expect(result.current.appointments).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle creation errors', async () => {
      const errorMessage = 'Failed to create appointment';
      vi.mocked(client.models.Appointment.create).mockResolvedValue({
        data: null,
        errors: [{ message: errorMessage }],
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await expect(result.current.createAppointment(newAppointmentInput)).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should check for conflicts before creating', async () => {
      const conflictingAppointment = {
        ...mockAppointment,
        appointmentDate: '2024-02-01',
        appointmentTime: '10:00',
        duration: 60,
      };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [conflictingAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await expect(result.current.createAppointment(newAppointmentInput)).rejects.toThrow('conflicts detected');
      });
    });
  });

  describe('updateAppointment', () => {
    const updateInput = {
      id: '1',
      title: 'Updated Appointment',
      appointmentTime: '15:00',
    };

    beforeEach(() => {
      // Setup initial appointments
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [mockAppointment],
        errors: null,
      });

      // Mock successful update
      vi.mocked(client.models.Appointment.update).mockResolvedValue({
        data: { ...mockAppointment, ...updateInput },
        errors: null,
      });

      // Mock client and caregiver data for notifications
      vi.mocked(client.models.Client.get).mockResolvedValue({
        data: mockClient,
        errors: null,
      });

      vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
        data: [mockClientCaregiver],
        errors: null,
      });

      vi.mocked(client.models.UserProfile.get).mockResolvedValue({
        data: mockUserProfile,
        errors: null,
      });
    });

    it('should update appointment successfully', async () => {
      const { result } = renderHook(() => useAppointments());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        const updatedAppointment = await result.current.updateAppointment(updateInput);
        expect(updatedAppointment.title).toBe('Updated Appointment');
        expect(updatedAppointment.appointmentTime).toBe('15:00');
      });

      expect(client.models.Appointment.update).toHaveBeenCalledWith(updateInput);
      expect(result.current.appointments[0].title).toBe('Updated Appointment');
    });

    it('should handle update errors', async () => {
      const errorMessage = 'Failed to update appointment';
      vi.mocked(client.models.Appointment.update).mockResolvedValue({
        data: null,
        errors: [{ message: errorMessage }],
      });

      const { result } = renderHook(() => useAppointments());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        await expect(result.current.updateAppointment(updateInput)).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle appointment not found', async () => {
      const { result } = renderHook(() => useAppointments());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        await expect(result.current.updateAppointment({ id: 'non-existent', title: 'Test' }))
          .rejects.toThrow('Appointment not found');
      });
    });
  });

  describe('deleteAppointment', () => {
    beforeEach(() => {
      // Setup initial appointments
      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [mockAppointment],
        errors: null,
      });

      // Mock successful deletion
      vi.mocked(client.models.Appointment.delete).mockResolvedValue({
        data: mockAppointment,
        errors: null,
      });

      // Mock client and caregiver data for notifications
      vi.mocked(client.models.Client.get).mockResolvedValue({
        data: mockClient,
        errors: null,
      });

      vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
        data: [mockClientCaregiver],
        errors: null,
      });
    });

    it('should delete appointment successfully', async () => {
      const { result } = renderHook(() => useAppointments());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteAppointment('1');
      });

      expect(client.models.Appointment.delete).toHaveBeenCalledWith({ id: '1' });
      expect(result.current.appointments).toHaveLength(0);
    });

    it('should handle deletion errors', async () => {
      const errorMessage = 'Failed to delete appointment';
      vi.mocked(client.models.Appointment.delete).mockResolvedValue({
        data: null,
        errors: [{ message: errorMessage }],
      });

      const { result } = renderHook(() => useAppointments());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        await expect(result.current.deleteAppointment('1')).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('checkAppointmentConflicts', () => {
    const testAppointmentData = {
      clientId: 'client-1',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      duration: 60,
    };

    it('should detect same time conflicts', async () => {
      const conflictingAppointment = {
        ...mockAppointment,
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        duration: 30,
      };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [conflictingAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        const conflicts = await result.current.checkAppointmentConflicts(testAppointmentData);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].conflictType).toBe('same_time');
      });
    });

    it('should detect overlap conflicts', async () => {
      const conflictingAppointment = {
        ...mockAppointment,
        appointmentDate: '2024-01-15',
        appointmentTime: '14:00', // Starts 30 minutes before, overlaps
        duration: 60,
      };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [conflictingAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        const conflicts = await result.current.checkAppointmentConflicts(testAppointmentData);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].conflictType).toBe('overlap');
      });
    });

    it('should detect back-to-back conflicts', async () => {
      const conflictingAppointment = {
        ...mockAppointment,
        appointmentDate: '2024-01-15',
        appointmentTime: '13:20', // Ends 10 minutes before new appointment
        duration: 60,
      };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [conflictingAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        const conflicts = await result.current.checkAppointmentConflicts(testAppointmentData);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].conflictType).toBe('back_to_back');
      });
    });

    it('should exclude cancelled appointments from conflicts', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
        status: 'cancelled' as const,
      };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [cancelledAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        const conflicts = await result.current.checkAppointmentConflicts(testAppointmentData);
        expect(conflicts).toHaveLength(0);
      });
    });

    it('should exclude current appointment when editing', async () => {
      const existingAppointment = {
        ...mockAppointment,
        id: 'current-appointment',
        appointmentDate: '2024-01-15',
        appointmentTime: '14:30',
      };

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: [existingAppointment],
        errors: null,
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        const conflicts = await result.current.checkAppointmentConflicts(
          testAppointmentData,
          'current-appointment'
        );
        expect(conflicts).toHaveLength(0);
      });
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      const appointments = [
        { ...mockAppointment, id: '1', appointmentDate: '2024-01-15', appointmentTime: '09:00' },
        { ...mockAppointment, id: '2', appointmentDate: '2024-01-16', appointmentTime: '14:00' },
        { ...mockAppointment, id: '3', appointmentDate: '2024-01-20', appointmentTime: '11:00' },
      ];

      vi.mocked(client.models.Appointment.list).mockResolvedValue({
        data: appointments,
        errors: null,
      });
    });

    it('should get appointments by date range', async () => {
      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(3);
      });

      const rangeAppointments = result.current.getAppointmentsByDateRange('2024-01-15', '2024-01-16');
      expect(rangeAppointments).toHaveLength(2);
      expect(rangeAppointments[0].id).toBe('1');
      expect(rangeAppointments[1].id).toBe('2');
    });

    it('should get upcoming appointments', async () => {
      // Mock current date to be before the appointments
      const mockDate = new Date('2024-01-14T08:00:00Z');
      vi.setSystemTime(mockDate);

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(3);
      });

      const upcomingAppointments = result.current.getUpcomingAppointments(7);
      expect(upcomingAppointments).toHaveLength(3);

      vi.useRealTimers();
    });

    it('should get overdue appointments', async () => {
      // Mock current date to be after some appointments
      const mockDate = new Date('2024-01-17T08:00:00Z');
      vi.setSystemTime(mockDate);

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(3);
      });

      const overdueAppointments = result.current.getOverdueAppointments();
      expect(overdueAppointments).toHaveLength(2); // First two appointments are overdue

      vi.useRealTimers();
    });
  });

  describe('real-time subscription', () => {
    it('should set up subscription on mount', () => {
      const mockSubscribe = vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      });

      vi.mocked(client.models.Appointment.observeQuery).mockReturnValue({
        subscribe: mockSubscribe,
      });

      renderHook(() => useAppointments());

      expect(client.models.Appointment.observeQuery).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn();
      const mockSubscribe = vi.fn().mockReturnValue({
        unsubscribe: mockUnsubscribe,
      });

      vi.mocked(client.models.Appointment.observeQuery).mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { unmount } = renderHook(() => useAppointments());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle subscription updates', async () => {
      const mockSubscribe = vi.fn();
      let subscriptionCallback: any;

      mockSubscribe.mockImplementation((callbacks) => {
        subscriptionCallback = callbacks.next;
        return { unsubscribe: vi.fn() };
      });

      vi.mocked(client.models.Appointment.observeQuery).mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useAppointments());

      // Simulate subscription update
      act(() => {
        subscriptionCallback({ items: [mockAppointment] });
      });

      expect(result.current.appointments).toEqual([mockAppointment]);
    });

    it('should handle subscription errors', async () => {
      const mockSubscribe = vi.fn();
      let subscriptionCallback: any;

      mockSubscribe.mockImplementation((callbacks) => {
        subscriptionCallback = callbacks;
        return { unsubscribe: vi.fn() };
      });

      vi.mocked(client.models.Appointment.observeQuery).mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useAppointments());

      // Simulate subscription error
      act(() => {
        subscriptionCallback.error(new Error('Subscription failed'));
      });

      expect(result.current.error).toBe('Real-time updates failed');
    });
  });
});
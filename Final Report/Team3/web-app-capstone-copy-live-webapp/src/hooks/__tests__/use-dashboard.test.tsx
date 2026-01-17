import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useDashboard } from '../use-dashboard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { client } from '@/lib/graphql-client';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock dependencies
vi.mock('@/lib/stores/auth-store');
vi.mock('@/lib/graphql-client');
vi.mock('../use-clients');
vi.mock('../use-medications');
vi.mock('../use-appointments');
vi.mock('../use-messages');

const mockUseAuthStore = useAuthStore as any;
const mockClient = client as any;

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'primary' as const,
};

const mockClients = [
  {
    id: 'client-1',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'John Smith',
    emergencyContactPhone: '555-0123',
    isActive: true,
    medicalConditions: ['Diabetes'],
    allergies: ['Penicillin'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMedications = [
  {
    id: 'med-1',
    clientId: 'client-1',
    name: 'Metformin',
    dosage: '500mg',
    unit: 'mg',
    frequency: 'twice daily',
    scheduleType: 'fixed_times' as const,
    prescribingDoctor: 'Dr. Johnson',
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    nextDueAt: '2024-01-15T08:00:00Z',
    lastTakenAt: '2024-01-14T08:00:00Z',
    missedDoses: 0,
    totalDoses: 14,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockAppointments = [
  {
    id: 'apt-1',
    clientId: 'client-1',
    title: 'Regular Checkup',
    appointmentDate: '2024-01-20',
    appointmentTime: '10:00',
    duration: 30,
    providerName: 'Dr. Johnson',
    locationType: 'in_person' as const,
    status: 'scheduled' as const,
    priority: 'normal' as const,
    followUpRequired: false,
    reminderSent: false,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    clientId: 'client-1',
    senderId: 'user-1',
    content: 'Client is doing well',
    messageType: 'text' as const,
    priority: 'normal' as const,
    isRead: false,
    createdAt: '2024-01-14T12:00:00Z',
    updatedAt: '2024-01-14T12:00:00Z',
  },
];

// Mock the individual hooks
vi.mock('../use-clients', () => ({
  useClients: () => ({
    data: mockClients,
    isLoading: false,
  }),
}));

vi.mock('../use-medications', () => ({
  useMedications: () => ({
    data: mockMedications,
    isLoading: false,
  }),
}));

vi.mock('../use-appointments', () => ({
  useAppointments: () => ({
    data: mockAppointments,
    isLoading: false,
  }),
}));

vi.mock('../use-messages', () => ({
  useMessages: () => ({
    data: mockMessages,
    isLoading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    // Mock GraphQL subscriptions
    mockClient.models = {
      Client: {
        observeQuery: vi.fn().mockReturnValue({
          subscribe: vi.fn().mockReturnValue({
            unsubscribe: vi.fn(),
          }),
        }),
      },
      Medication: {
        observeQuery: vi.fn().mockReturnValue({
          subscribe: vi.fn().mockReturnValue({
            unsubscribe: vi.fn(),
          }),
        }),
      },
      Appointment: {
        observeQuery: vi.fn().mockReturnValue({
          subscribe: vi.fn().mockReturnValue({
            unsubscribe: vi.fn(),
          }),
        }),
      },
      Message: {
        observeQuery: vi.fn().mockReturnValue({
          subscribe: vi.fn().mockReturnValue({
            unsubscribe: vi.fn(),
          }),
        }),
      },
    } as any;
  });

  it('should calculate dashboard statistics correctly', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.stats).toEqual({
      totalClients: 1,
      activeMedications: 1,
      upcomingAppointments: 1,
      unreadMessages: 1,
      overdueReminders: 0, // nextDueAt is in the future
      todaysTasks: 0, // no tasks for today in mock data
    });
  });

  it('should generate recent activity correctly', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const activities = result.current.data?.recentActivity;
    expect(activities).toBeDefined();
    expect(activities?.length).toBeGreaterThan(0);
    
    // Should include medication taken activity
    const medicationActivity = activities?.find(a => a.type === 'medication_taken');
    expect(medicationActivity).toBeDefined();
    expect(medicationActivity?.title).toBe('Medication Taken');
    expect(medicationActivity?.clientName).toBe('Jane Smith');

    // Should include message activity
    const messageActivity = activities?.find(a => a.type === 'message_sent');
    expect(messageActivity).toBeDefined();
    expect(messageActivity?.title).toBe('New Message');
  });

  it('should identify urgent tasks correctly', async () => {
    // Mock overdue medication
    const overdueMedications = [
      {
        ...mockMedications[0],
        nextDueAt: '2024-01-01T08:00:00Z', // Past date
      },
    ];

    vi.doMock('../use-medications', () => ({
      useMedications: () => ({
        data: overdueMedications,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const urgentTasks = result.current.data?.urgentTasks;
    expect(urgentTasks).toBeDefined();
    
    const overdueTask = urgentTasks?.find(t => t.type === 'medication');
    expect(overdueTask).toBeDefined();
    expect(overdueTask?.title).toBe('Overdue Medication');
  });

  it('should set up real-time subscriptions', async () => {
    renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockClient.models.Client.observeQuery).toHaveBeenCalled();
      expect(mockClient.models.Medication.observeQuery).toHaveBeenCalled();
      expect(mockClient.models.Appointment.observeQuery).toHaveBeenCalled();
      expect(mockClient.models.Message.observeQuery).toHaveBeenCalled();
    });
  });

  it('should track analytics events', async () => {
    const mockGtag = vi.fn();
    (global as any).window = { gtag: mockGtag };

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Test page view tracking
    result.current.trackPageView('dashboard');
    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      page_title: 'Dashboard',
      page_location: undefined,
      custom_map: { dimension1: 'primary' },
    });

    // Test action tracking
    result.current.trackAction('quick_action', { action: 'add_client' });
    expect(mockGtag).toHaveBeenCalledWith('event', 'quick_action', {
      event_category: 'dashboard',
      event_label: 'add_client',
      custom_map: { dimension1: 'primary' },
      action: 'add_client',
    });
  });

  it('should handle loading states correctly', () => {
    // Mock loading state
    vi.doMock('../use-clients', () => ({
      useClients: () => ({
        data: [],
        isLoading: true,
      }),
    }));

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle empty data gracefully', async () => {
    // Mock empty data
    vi.doMock('../use-clients', () => ({
      useClients: () => ({
        data: [],
        isLoading: false,
      }),
    }));

    vi.doMock('../use-medications', () => ({
      useMedications: () => ({
        data: [],
        isLoading: false,
      }),
    }));

    vi.doMock('../use-appointments', () => ({
      useAppointments: () => ({
        data: [],
        isLoading: false,
      }),
    }));

    vi.doMock('../use-messages', () => ({
      useMessages: () => ({
        data: [],
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.stats).toEqual({
      totalClients: 0,
      activeMedications: 0,
      upcomingAppointments: 0,
      unreadMessages: 0,
      overdueReminders: 0,
      todaysTasks: 0,
    });

    expect(result.current.data?.recentActivity).toEqual([]);
    expect(result.current.data?.urgentTasks).toEqual([]);
  });
});

describe('useDashboardOptimization', () => {
  it('should prefetch client details', async () => {
    const { useDashboardOptimization } = await import('../use-dashboard');
    
    const queryClient = new QueryClient();
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');
    
    const { result } = renderHook(() => useDashboardOptimization(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.prefetchClientDetails('client-1');

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: ['clients', 'detail', 'client-1'],
      queryFn: expect.any(Function),
      staleTime: 5 * 60 * 1000,
    });
  });

  it('should prefetch medication history', async () => {
    const { useDashboardOptimization } = await import('../use-dashboard');
    
    const queryClient = new QueryClient();
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');
    
    const { result } = renderHook(() => useDashboardOptimization(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.prefetchMedicationHistory('med-1');

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: ['medications', 'logs', 'med-1'],
      queryFn: expect.any(Function),
      staleTime: 2 * 60 * 1000,
    });
  });
});
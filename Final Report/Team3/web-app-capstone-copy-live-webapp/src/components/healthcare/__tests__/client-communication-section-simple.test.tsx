import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientCommunicationSection } from '../client-communication-section';
import { useMessages } from '@/hooks/use-messages';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Client, ClientCaregiver, UserProfile } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-messages');
vi.mock('@/lib/stores/auth-store');

const mockUseMessages = vi.mocked(useMessages);
const mockUseAuthStore = vi.mocked(useAuthStore);

// Mock data
const mockUser: UserProfile = {
  id: 'user-1',
  userId: 'cognito-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1234567890',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockCaregivers: ClientCaregiver[] = [
  {
    id: 'pc-1',
    clientId: 'client-1',
    caregiverId: 'user-2',
    role: 'primary',
    isActive: true,
    caregiver: {
      id: 'user-2',
      userId: 'cognito-user-2',
      email: 'caregiver1@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMessagesHook = {
  messages: [],
  loading: false,
  error: null,
  sendMessage: vi.fn(),
  markAsRead: vi.fn(),
  searchUsers: vi.fn(),
  subscribeToMessages: vi.fn(),
  unsubscribeFromMessages: vi.fn(),
  refreshMessages: vi.fn(),
};

describe('ClientCommunicationSection - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockUseMessages.mockReturnValue(mockMessagesHook);
  });

  it('renders the communication section', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('shows caregiver count', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('1 caregivers')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      loading: true,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('renders message input area', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
});
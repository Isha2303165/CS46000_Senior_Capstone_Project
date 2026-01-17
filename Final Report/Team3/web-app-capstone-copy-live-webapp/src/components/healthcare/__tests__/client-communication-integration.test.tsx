import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientCommunicationSection } from '../client-communication-section';
import { useMessages } from '@/hooks/use-messages';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Client, ClientCaregiver, Message, UserProfile } from '@/types';

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
  {
    id: 'pc-2',
    clientId: 'client-1',
    caregiverId: 'user-3',
    role: 'secondary',
    isActive: true,
    caregiver: {
      id: 'user-3',
      userId: 'cognito-user-3',
      email: 'caregiver2@example.com',
      firstName: 'Bob',
      lastName: 'Johnson',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    clientId: 'client-1',
    senderId: 'user-2',
    content: 'Client is doing well today',
    messageType: 'text',
    priority: 'normal',
    isRead: true,
    sender: mockCaregivers[0].caregiver,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'msg-2',
    clientId: 'client-1',
    senderId: 'user-3',
    content: 'Urgent: Client needs immediate attention',
    messageType: 'urgent',
    priority: 'urgent',
    isRead: false,
    sender: mockCaregivers[1].caregiver,
    createdAt: '2024-01-01T11:00:00Z',
    updatedAt: '2024-01-01T11:00:00Z',
  },
];

describe('ClientCommunicationSection - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser });
  });

  it('integrates with real-time messaging functionality', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    const mockMarkAsRead = vi.fn().mockResolvedValue(true);
    
    mockUseMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      markAsRead: mockMarkAsRead,
      searchUsers: vi.fn(),
      subscribeToMessages: vi.fn(),
      unsubscribeFromMessages: vi.fn(),
      refreshMessages: vi.fn(),
    });

    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    // Verify messages are displayed
    expect(screen.getByText('Client is doing well today')).toBeInTheDocument();
    expect(screen.getByText('Urgent: Client needs immediate attention')).toBeInTheDocument();

    // Verify unread count
    expect(screen.getByText('1 unread')).toBeInTheDocument();

    // Test sending a message
    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(textarea, 'Test integration message');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      clientId: 'client-1',
      content: 'Test integration message',
      messageType: 'text',
      priority: 'normal',
      mentions: undefined,
    });
  });

  it('handles mention functionality correctly', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    
    mockUseMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      markAsRead: vi.fn(),
      searchUsers: vi.fn(),
      subscribeToMessages: vi.fn(),
      unsubscribeFromMessages: vi.fn(),
      refreshMessages: vi.fn(),
    });

    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox');
    
    // Type @ to trigger mention suggestions
    await user.type(textarea, 'Hello @');
    
    // Should show mention suggestions
    expect(screen.getByText('Mention a caregiver:')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('handles urgent messages correctly', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    
    mockUseMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      markAsRead: vi.fn(),
      searchUsers: vi.fn(),
      subscribeToMessages: vi.fn(),
      unsubscribeFromMessages: vi.fn(),
      refreshMessages: vi.fn(),
    });

    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox');
    const urgentButton = screen.getByRole('button', { name: /mark as urgent/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    // Toggle urgent mode
    await user.click(urgentButton);
    expect(urgentButton).toHaveAttribute('aria-pressed', 'true');

    // Send urgent message
    await user.type(textarea, 'This is urgent!');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      clientId: 'client-1',
      content: 'This is urgent!',
      messageType: 'urgent',
      priority: 'urgent',
      mentions: undefined,
    });
  });

  it('displays proper accessibility attributes', () => {
    mockUseMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      markAsRead: vi.fn(),
      searchUsers: vi.fn(),
      subscribeToMessages: vi.fn(),
      unsubscribeFromMessages: vi.fn(),
      refreshMessages: vi.fn(),
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    // Check for proper ARIA labels and roles
    expect(screen.getByRole('region', { name: /communication/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message content/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh messages/i })).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    mockUseMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: 'Failed to load messages',
      sendMessage: vi.fn(),
      markAsRead: vi.fn(),
      searchUsers: vi.fn(),
      subscribeToMessages: vi.fn(),
      unsubscribeFromMessages: vi.fn(),
      refreshMessages: vi.fn(),
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load messages');
  });
});
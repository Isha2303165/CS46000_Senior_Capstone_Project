import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

const mockMessagesHook = {
  messages: mockMessages,
  loading: false,
  error: null,
  sendMessage: vi.fn(),
  markAsRead: vi.fn(),
  searchUsers: vi.fn(),
  subscribeToMessages: vi.fn(),
  unsubscribeFromMessages: vi.fn(),
  refreshMessages: vi.fn(),
};

describe('ClientCommunicationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockUseMessages.mockReturnValue(mockMessagesHook);
  });

  it('renders the communication section with correct title and caregiver count', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByRole('heading', { name: /communication/i })).toBeInTheDocument();
    expect(screen.getByText('2 caregivers')).toBeInTheDocument();
  });

  it('displays unread message count badge when there are unread messages', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('1 unread')).toBeInTheDocument();
  });

  it('displays messages in the chat area', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('Client is doing well today')).toBeInTheDocument();
    expect(screen.getByText('Urgent: Client needs immediate attention')).toBeInTheDocument();
  });

  it('shows loading state when messages are loading', () => {
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      loading: true,
      messages: [],
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('shows empty state when no messages exist', () => {
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      messages: [],
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText(/start a conversation with the caregiver about john/i)).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      error: 'Failed to load messages',
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load messages');
  });

  it('allows typing in the message textarea', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Test message');

    expect(textarea).toHaveValue('Test message');
  });

  it('sends a message when send button is clicked', async () => {
    const user = userEvent.setup();
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      sendMessage: mockSendMessage,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      clientId: 'client-1',
      content: 'Test message',
      messageType: 'text',
      priority: 'normal',
      mentions: undefined,
    });
  });

  it('sends message with Enter key (without Shift)', async () => {
    const user = userEvent.setup();
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      sendMessage: mockSendMessage,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');

    expect(mockSendMessage).toHaveBeenCalled();
  });

  it('does not send message with Shift+Enter', async () => {
    const user = userEvent.setup();
    const mockSendMessage = vi.fn();
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      sendMessage: mockSendMessage,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Test message');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('toggles urgent priority when urgent button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const urgentButton = screen.getByRole('button', { name: /mark as urgent/i });
    expect(urgentButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(urgentButton);
    expect(urgentButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('sends urgent message when urgent is enabled', async () => {
    const user = userEvent.setup();
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      sendMessage: mockSendMessage,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    const urgentButton = screen.getByRole('button', { name: /mark as urgent/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.click(urgentButton);
    await user.type(textarea, 'Urgent message');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      clientId: 'client-1',
      content: 'Urgent message',
      messageType: 'urgent',
      priority: 'urgent',
      mentions: undefined,
    });
  });

  it('changes message priority when priority select is changed', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const prioritySelect = screen.getByRole('combobox', { name: /message priority/i });
    await user.selectOptions(prioritySelect, 'high');

    expect(prioritySelect).toHaveValue('high');
  });

  it('shows mention suggestions when typing @ symbol', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Hello @');

    await waitFor(() => {
      expect(screen.getByText('Mention a caregiver:')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('filters mention suggestions based on query', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Hello @alice');

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });
  });

  it('selects mention when clicking on suggestion', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Hello @');

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Alice Smith'));

    expect(textarea).toHaveValue('Hello @Alice Smith ');
    expect(screen.getByText('Mentioning:')).toBeInTheDocument();
    expect(screen.getByText('@Alice Smith')).toBeInTheDocument();
  });

  it('removes mention when clicking remove button', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Hello @');

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Alice Smith'));

    expect(screen.getByText('@Alice Smith')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove mention of alice smith/i });
    await user.click(removeButton);

    expect(screen.queryByText('@Alice Smith')).not.toBeInTheDocument();
  });

  it('sends message with mentions', async () => {
    const user = userEvent.setup();
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      sendMessage: mockSendMessage,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(textarea, 'Hello @');
    
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Alice Smith'));
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      clientId: 'client-1',
      content: 'Hello @Alice Smith ',
      messageType: 'text',
      priority: 'normal',
      mentions: ['user-2'],
    });
  });

  it('calls refreshMessages when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockRefreshMessages = vi.fn();
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      refreshMessages: mockRefreshMessages,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh messages/i });
    await user.click(refreshButton);

    expect(mockRefreshMessages).toHaveBeenCalled();
  });

  it('disables send button when message is empty', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when message exceeds character limit', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    // Type a message longer than 1000 characters
    const longMessage = 'a'.repeat(1001);
    await user.type(textarea, longMessage);

    expect(sendButton).toBeDisabled();
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Hello');

    expect(screen.getByText('5/1000')).toBeInTheDocument();
  });

  it('clears form after successful message send', async () => {
    const user = userEvent.setup();
    const mockSendMessage = vi.fn().mockResolvedValue(true);
    mockUseMessages.mockReturnValue({
      ...mockMessagesHook,
      sendMessage: mockSendMessage,
    });

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    const urgentButton = screen.getByRole('button', { name: /mark as urgent/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.click(urgentButton);
    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
      expect(urgentButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('displays help text about message features', () => {
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    expect(screen.getByText(/use @ to mention specific caregivers/i)).toBeInTheDocument();
    expect(screen.getByText(/urgent messages will send immediate notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/messages are automatically shared with all active caregivers/i)).toBeInTheDocument();
  });

  it('excludes current user from mention suggestions', () => {
    const caregivers = [
      ...mockCaregivers,
      {
        id: 'pc-3',
        clientId: 'client-1',
        caregiverId: 'user-1', // Current user
        role: 'primary',
        isActive: true,
        caregiver: mockUser,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={caregivers} 
      />
    );

    // Should show 2 caregivers (excluding current user)
    expect(screen.getByText('3 caregivers')).toBeInTheDocument();
  });

  it('handles keyboard navigation in mention suggestions', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientCommunicationSection 
        client={mockClient} 
        caregivers={mockCaregivers} 
      />
    );

    const textarea = screen.getByRole('textbox', { name: /message content/i });
    await user.type(textarea, 'Hello @');

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // Test Escape key closes suggestions
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('Mention a caregiver:')).not.toBeInTheDocument();
    });
  });
});
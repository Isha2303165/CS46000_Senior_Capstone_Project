import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatMessage } from '../chat-message';
import type { Message, UserProfile } from '@/types';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 minutes ago'),
}));

const mockMessage: Message = {
  id: 'msg-1',
  clientId: 'client-1',
  senderId: 'user-1',
  content: 'This is a test message',
  messageType: 'text',
  priority: 'normal',
  isRead: false,
  readBy: [],
  readAt: [],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

const mockSender: UserProfile = {
  id: 'user-1',
  userId: 'user-1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt: '2024-01-01T09:00:00Z',
  updatedAt: '2024-01-01T09:00:00Z',
};

const defaultProps = {
  message: mockMessage,
  sender: mockSender,
  currentUserId: 'user-2',
  onReply: vi.fn(),
  onMarkAsRead: vi.fn(),
};

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message content correctly', () => {
    render(<ChatMessage {...defaultProps} />);
    
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
  });

  it('shows "You" for own messages', () => {
    const ownMessage = { ...mockMessage, senderId: 'user-2' };
    render(<ChatMessage {...defaultProps} message={ownMessage} currentUserId="user-2" />);
    
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('displays urgent message styling', () => {
    const urgentMessage = { ...mockMessage, priority: 'urgent', messageType: 'urgent' };
    render(<ChatMessage {...defaultProps} message={urgentMessage} />);
    
    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('displays system message correctly', () => {
    const systemMessage = {
      ...mockMessage,
      messageType: 'system',
      content: 'System notification',
      systemData: { details: 'Additional info' },
    };
    
    render(<ChatMessage {...defaultProps} message={systemMessage} />);
    
    expect(screen.getByText('System Message')).toBeInTheDocument();
    expect(screen.getByText('System notification')).toBeInTheDocument();
  });

  it('shows unread indicator for unread messages', () => {
    const unreadMessage = { ...mockMessage, isRead: false };
    const { container } = render(<ChatMessage {...defaultProps} message={unreadMessage} />);
    
    expect(container.firstChild).toHaveClass('ring-2', 'ring-blue-300');
  });

  it('calls onMarkAsRead when clicked for unread messages', async () => {
    const unreadMessage = { ...mockMessage, isRead: false };
    render(<ChatMessage {...defaultProps} message={unreadMessage} />);
    
    fireEvent.click(screen.getByRole('article'));
    
    await waitFor(() => {
      expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('msg-1');
    });
  });

  it('does not call onMarkAsRead for own messages', () => {
    const ownMessage = { ...mockMessage, senderId: 'user-2', isRead: false };
    render(<ChatMessage {...defaultProps} message={ownMessage} currentUserId="user-2" />);
    
    fireEvent.click(screen.getByRole('article'));
    
    expect(defaultProps.onMarkAsRead).not.toHaveBeenCalled();
  });

  it('calls onReply when reply button is clicked', () => {
    render(<ChatMessage {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply'));
    
    expect(defaultProps.onReply).toHaveBeenCalledWith('msg-1');
  });

  it('displays priority badge for non-normal priority', () => {
    const highPriorityMessage = { ...mockMessage, priority: 'high' };
    render(<ChatMessage {...defaultProps} message={highPriorityMessage} />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('displays message type badge for non-text messages', () => {
    const reminderMessage = { ...mockMessage, messageType: 'medication_reminder' };
    render(<ChatMessage {...defaultProps} message={reminderMessage} />);
    
    expect(screen.getByText('medication reminder')).toBeInTheDocument();
  });

  it('renders attachments when present', () => {
    const messageWithAttachments = {
      ...mockMessage,
      attachments: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    };
    
    render(<ChatMessage {...defaultProps} message={messageWithAttachments} />);
    
    expect(screen.getByText('Attachments:')).toBeInTheDocument();
    expect(screen.getByText('Attachment 1')).toBeInTheDocument();
    expect(screen.getByText('Attachment 2')).toBeInTheDocument();
  });

  it('handles long messages with expand/collapse', () => {
    const longMessage = {
      ...mockMessage,
      content: 'A'.repeat(300), // Long message
    };
    
    render(<ChatMessage {...defaultProps} message={longMessage} />);
    
    expect(screen.getByText('Show more')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('renders mentions in message content', () => {
    const messageWithMentions = {
      ...mockMessage,
      content: 'Hello @user-3, please check this',
      mentions: ['user-3'],
    };
    
    const { container } = render(<ChatMessage {...defaultProps} message={messageWithMentions} />);
    
    expect(container.innerHTML).toContain('bg-blue-100');
  });

  it('shows read status for own messages', () => {
    const ownMessage = { ...mockMessage, senderId: 'user-2', isRead: true };
    render(<ChatMessage {...defaultProps} message={ownMessage} currentUserId="user-2" />);
    
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('shows reply indicator when message is a reply', () => {
    const replyMessage = { ...mockMessage, replyToId: 'msg-0' };
    render(<ChatMessage {...defaultProps} message={replyMessage} />);
    
    expect(screen.getByText('Replying to previous message')).toBeInTheDocument();
  });

  it('applies correct styling for different message types', () => {
    const { rerender, container } = render(<ChatMessage {...defaultProps} />);
    
    // Test urgent message styling
    const urgentMessage = { ...mockMessage, messageType: 'urgent' };
    rerender(<ChatMessage {...defaultProps} message={urgentMessage} />);
    expect(container.firstChild).toHaveClass('bg-red-50', 'border-red-200');
    
    // Test system message styling
    const systemMessage = { ...mockMessage, messageType: 'system' };
    rerender(<ChatMessage {...defaultProps} message={systemMessage} />);
    expect(container.firstChild).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('handles missing sender gracefully', () => {
    const messageWithoutSender = { ...mockMessage, sender: undefined };
    render(<ChatMessage {...defaultProps} message={messageWithoutSender} />);
    
    // Should still render without crashing
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
  });
});
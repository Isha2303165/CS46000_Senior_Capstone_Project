'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { client } from '@/lib/graphql-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Message, CreateMessageInput, UserProfile } from '@/types';

interface UseMessagesOptions {
  clientId?: string;
  autoSubscribe?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (input: Omit<CreateMessageInput, 'senderId'>) => Promise<Message | null>;
  markAsRead: (messageId: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<UserProfile[]>;
  subscribeToMessages: (clientId: string) => () => void;
  unsubscribeFromMessages: () => void;
  refreshMessages: () => Promise<void>;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { clientId, autoSubscribe = true } = options;
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subscriptionRef = useRef<(() => void) | null>(null);
  const currentClientIdRef = useRef<string | null>(null);

  // Fetch messages for a specific client
  const fetchMessages = useCallback(async (targetClientId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await client.models.Message.list({
        filter: {
          clientId: { eq: targetClientId }
        },
        limit: 100,
        // Sort by creation date descending
        sortDirection: 'DESC'
      });

      if (response.data) {
        // Reverse to show oldest first
        const sortedMessages = [...response.data].reverse();
        setMessages(sortedMessages as Message[]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time message updates
  const subscribeToMessages = useCallback((targetClientId: string) => {
    if (!user || subscriptionRef.current) {
      return () => {};
    }

    try {
      const subscription = client.models.Message.observeQuery({
        filter: {
          clientId: { eq: targetClientId }
        }
      }).subscribe({
        next: ({ items, isSynced }) => {
          if (isSynced) {
            // Sort messages by creation date (oldest first)
            const sortedMessages = [...items].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setMessages(sortedMessages as Message[]);
          }
        },
        error: (err) => {
          console.error('Message subscription error:', err);
          setError('Real-time updates unavailable');
        }
      });

      subscriptionRef.current = () => subscription.unsubscribe();
      currentClientIdRef.current = targetClientId;

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error('Error setting up message subscription:', err);
      setError('Failed to set up real-time updates');
      return () => {};
    }
  }, [user]);

  // Unsubscribe from messages
  const unsubscribeFromMessages = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
      currentClientIdRef.current = null;
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (
    input: Omit<CreateMessageInput, 'senderId'>
  ): Promise<Message | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setError(null);

      const messageInput = {
        ...input,
        senderId: user.id,
        messageType: input.messageType || 'text',
        priority: input.priority || 'normal',
        isRead: false,
      };

      const response = await client.models.Message.create(messageInput);

      if (response.data) {
        // Optimistic update - add message immediately
        const newMessage = response.data as Message;
        setMessages(prev => [...prev, newMessage]);

        // Send push notifications for urgent messages
        if (input.priority === 'urgent' || input.messageType === 'urgent') {
          await sendUrgentNotification(newMessage);
        }

        // Send mention notifications
        if (input.mentions && input.mentions.length > 0) {
          await sendMentionNotifications(newMessage, input.mentions);
        }

        return newMessage;
      }

      return null;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return null;
    }
  }, [user]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message || message.senderId === user.id) return true;

      const updatedReadBy = message.readBy ? [...message.readBy, user.id] : [user.id];
      const updatedReadAt = message.readAt ? [...message.readAt, new Date().toISOString()] : [new Date().toISOString()];

      const response = await client.models.Message.update({
        id: messageId,
        isRead: true,
        readBy: updatedReadBy,
        readAt: updatedReadAt,
      });

      if (response.data) {
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, isRead: true, readBy: updatedReadBy, readAt: updatedReadAt }
            : m
        ));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error marking message as read:', err);
      return false;
    }
  }, [user, messages]);

  // Search users for mentions
  const searchUsers = useCallback(async (query: string): Promise<UserProfile[]> => {
    if (!query.trim()) return [];

    try {
      const response = await client.models.UserProfile.list({
        filter: {
          or: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } }
          ]
        },
        limit: 10
      });

      return (response.data || []) as UserProfile[];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, []);

  // Send urgent notification via SNS
  const sendUrgentNotification = async (message: Message) => {
    try {
      // In a real implementation, this would trigger an AWS Lambda function
      // that sends push notifications via SNS
      // Mock implementation - in production, this would trigger AWS Lambda/SNS
      
      // Create notification records for all caregivers of the client
      const clientResponse = await client.models.Client.get({ id: message.clientId });
      if (clientResponse.data?.caregivers) {
        const caregivers = clientResponse.data.caregivers;
        
        for (const caregiver of caregivers) {
          if (caregiver.caregiverId !== message.senderId) {
            await client.models.Notification.create({
              userId: caregiver.caregiverId,
              type: 'urgent_message',
              title: 'Urgent Message',
              message: `Urgent message from ${message.sender?.firstName}: ${message.content.substring(0, 100)}...`,
              messageId: message.id,
              clientId: message.clientId,
              priority: 'urgent',
              deliveryMethod: ['push', 'email'],
            });
          }
        }
      }
    } catch (err) {
      console.error('Error sending urgent notification:', err);
    }
  };

  // Send mention notifications
  const sendMentionNotifications = async (message: Message, mentions: string[]) => {
    try {
      for (const userId of mentions) {
        if (userId !== message.senderId) {
          await client.models.Notification.create({
            userId,
            type: 'new_message',
            title: 'You were mentioned',
            message: `${message.sender?.firstName} mentioned you in a message`,
            messageId: message.id,
            clientId: message.clientId,
            priority: 'normal',
            deliveryMethod: ['in_app', 'push'],
          });
        }
      }
    } catch (err) {
      console.error('Error sending mention notifications:', err);
    }
  };

  // Refresh messages manually
  const refreshMessages = useCallback(async () => {
    if (currentClientIdRef.current) {
      await fetchMessages(currentClientIdRef.current);
    }
  }, [fetchMessages]);

  // Set up subscription when clientId changes
  useEffect(() => {
    if (clientId && autoSubscribe) {
      // Clean up previous subscription
      unsubscribeFromMessages();
      
      // Set up new subscription
      subscribeToMessages(clientId);
    }

    return () => {
      if (autoSubscribe) {
        unsubscribeFromMessages();
      }
    };
  }, [clientId, autoSubscribe, subscribeToMessages, unsubscribeFromMessages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromMessages();
    };
  }, [unsubscribeFromMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    searchUsers,
    subscribeToMessages,
    unsubscribeFromMessages,
    refreshMessages,
  };
}
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { client } from '@/lib/graphql-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Conversation, ConversationParticipant, DirectMessage, UserProfile } from '@/types';

export interface UseDirectMessagesReturn {
  conversations: Conversation[];
  participantsMap: Record<string, ConversationParticipant[]>;
  messages: DirectMessage[];
  loading: boolean;
  error: string | null;
  searchUsers: (q: string) => Promise<UserProfile[]>;
  openConversationWith: (userId: string) => Promise<Conversation | null>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<DirectMessage | null>;
  refreshConversations: () => Promise<void>;
}

export function useDirectMessages(): UseDirectMessagesReturn {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participantsMap, setParticipantsMap] = useState<Record<string, ConversationParticipant[]>>({});
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeConversationRef = useRef<string | null>(null);

  const handleError = useCallback((e: any, fallback: string) => {
    console.error('DM error:', e);
    setError(e?.message || fallback);
    return null;
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await client.models.ConversationParticipant.list({
        filter: { userId: { eq: user.id } },
      });
      const cps = (res.data || []) as any[];
      if (cps.length === 0) {
        setConversations([]);
        setParticipantsMap({});
        return;
      }
      const convIds = Array.from(new Set(cps.map((cp) => cp.conversationId)));
      const convs: Conversation[] = [];
      const map: Record<string, ConversationParticipant[]> = {};
      for (const convId of convIds) {
        const convRes = await client.models.Conversation.get({ id: convId });
        if (convRes.data) convs.push(convRes.data as any);
        const pRes = await client.models.ConversationParticipant.list({
          filter: { conversationId: { eq: convId } },
        });
        const rawParticipants = (pRes.data || []) as any[];
        const hydrated: ConversationParticipant[] = await Promise.all(
          rawParticipants.map(async (p: any) => {
            const userRes = await client.models.UserProfile.get({ id: p.userId });
            return {
              ...(p as any),
              user: (userRes.data || undefined) as any,
            } as ConversationParticipant;
          })
        );
        map[convId] = hydrated;
      }
      setConversations(convs);
      setParticipantsMap(map);
    } catch (e) {
      handleError(e, 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const searchUsers = useCallback(async (q: string): Promise<UserProfile[]> => {
    if (!q.trim()) return [];
    try {
      const res = await client.models.UserProfile.list({
        filter: {
          or: [
            { email: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
          ],
        },
        limit: 10,
      });
      return (res.data || []) as any;
    } catch (e) {
      console.error('DM user search error:', e);
      return [];
    }
  }, []);

  const openConversationWith = useCallback(async (targetUserId: string): Promise<Conversation | null> => {
    if (!user?.id) return null;
    setLoading(true);
    setError(null);
    try {
      // Try to find existing convo with same two participants
      await refreshConversations();
      for (const conv of conversations) {
        const participants = participantsMap[conv.id] || [];
        const ids = participants.map((p) => p.userId);
        if (ids.includes(user.id) && ids.includes(targetUserId) && !conv.isGroup) {
          activeConversationRef.current = conv.id;
          return conv;
        }
      }

      // Create new conversation
      const convRes = await client.models.Conversation.create({ isGroup: false });
      if (!convRes.data) throw new Error('Failed to create conversation');
      const conv = convRes.data as any as Conversation;

      await client.models.ConversationParticipant.create({
        conversationId: conv.id,
        userId: user.id,
        joinedAt: new Date().toISOString(),
      });
      await client.models.ConversationParticipant.create({
        conversationId: conv.id,
        userId: targetUserId,
        joinedAt: new Date().toISOString(),
      });

      await refreshConversations();
      activeConversationRef.current = conv.id;
      return conv;
    } catch (e) {
      return handleError(e, 'Failed to open conversation');
    } finally {
      setLoading(false);
    }
  }, [user?.id, conversations, participantsMap, refreshConversations, handleError]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.models.DirectMessage.list({
        filter: { conversationId: { eq: conversationId } },
        limit: 200,
      });
      const data = (res.data || []) as any[];
      const sorted = data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(sorted as any);
      activeConversationRef.current = conversationId;
    } catch (e) {
      handleError(e, 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const sendMessage = useCallback(async (conversationId: string, content: string): Promise<DirectMessage | null> => {
    if (!user?.id) return null;
    setError(null);
    try {
      const res = await client.models.DirectMessage.create({
        conversationId,
        senderId: user.id,
        content,
      });
      if (!res.data) return null;
      const msg = res.data as any as DirectMessage;
      setMessages((prev) => [...prev, msg]);
      return msg;
    } catch (e) {
      return handleError(e, 'Failed to send message');
    }
  }, [user?.id, handleError]);

  return {
    conversations,
    participantsMap,
    messages,
    loading,
    error,
    searchUsers,
    openConversationWith,
    loadConversation,
    sendMessage,
    refreshConversations,
  };
}



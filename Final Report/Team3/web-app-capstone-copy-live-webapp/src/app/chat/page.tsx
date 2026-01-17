'use client';

import { ClientChatInterface } from '@/components/healthcare/client-chat-interface';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useDirectMessages } from '@/hooks/use-direct-messages';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const { conversations, participantsMap, messages, searchUsers, openConversationWith, loadConversation, sendMessage, loading, error } = useDirectMessages();
  const { user } = useAuthStore();
  const myId = undefined as any; // will be provided by the hook's auth store internally when available
  const [dmSuggestions, setDmSuggestions] = useState<any[]>([] as any);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [dmText, setDmText] = useState('');

  const handleDmSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) return setDmSuggestions([]);
    const res = await searchUsers(q);
    setDmSuggestions(res);
  };

  const startDm = async (userId: string) => {
    const conv = await openConversationWith(userId);
    if (conv) {
      setActiveConversationId(conv.id);
      await loadConversation(conv.id);
      setDmSuggestions([]);
      setQuery('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Caregiver Chat</h1>
        <p className="text-gray-600 mt-1">Message other caregivers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DM Inbox */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="mb-2 text-sm text-gray-700">Direct Messages</div>
            <div className="flex gap-2">
              <Input placeholder="Find caregiver by email or name..." value={query} onChange={(e) => handleDmSearch(e.target.value)} />
            </div>
            {dmSuggestions.length > 0 && (
              <div className="mt-2 border rounded-md bg-white shadow-sm">
                {dmSuggestions.map((u) => (
                  <button key={u.id} onClick={() => startDm(u.id)} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                    <span className="font-medium">{u.firstName} {u.lastName}</span>
                    <span className="text-gray-500">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
            <ScrollArea className="h-[420px] mt-4">
              {conversations.length === 0 ? (
                <div className="text-sm text-gray-500">No conversations yet</div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => {
                    const participants = participantsMap[conv.id] || [];
                    const others = participants.filter((p) => p.userId && p.userId !== user?.id);
                    const names = others.map((p) => `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.trim()).filter(Boolean);
                    return (
                      <button
                        key={conv.id}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${activeConversationId === conv.id ? 'bg-gray-50 border' : ''}`}
                        onClick={async () => {
                          setActiveConversationId(conv.id);
                          await loadConversation(conv.id);
                        }}
                      >
                        <div className="font-medium">{conv.title || (names.length > 0 ? names.join(', ') : (conv.isGroup ? 'Group' : 'Direct Message'))}</div>
                        <div className="text-xs text-gray-500">{others.length} participant(s)</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* DM Conversation */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {activeConversationId ? (
              <div className="flex flex-col h-[520px]">
                <ScrollArea className="flex-1 pr-2">
                  {messages.length === 0 ? (
                    <div className="text-sm text-gray-500">No messages yet</div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((m) => {
                        const isMine = m.senderId === user?.id;
                        return (
                          <div key={m.id} className={`text-sm flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`${isMine ? 'bg-blue-50' : 'bg-gray-100'} px-3 py-2 rounded-md max-w-[80%]`}>
                              <div className="text-[10px] text-gray-500 mb-0.5">{new Date(m.createdAt).toLocaleTimeString()}</div>
                              <div>{m.content}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="mt-3 flex gap-2">
                  <Textarea value={dmText} onChange={(e) => setDmText(e.target.value)} placeholder="Type a message" className="min-h-[48px]" />
                  <Button onClick={async () => {
                    if (!dmText.trim() || !activeConversationId) return;
                    await sendMessage(activeConversationId, dmText.trim());
                    setDmText('');
                  }}>Send</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Select or start a conversation</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client chat panel removed to avoid dual chat UI */}
    </div>
  );
}
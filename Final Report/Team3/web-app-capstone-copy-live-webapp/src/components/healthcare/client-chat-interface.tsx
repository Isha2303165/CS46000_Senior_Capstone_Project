'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  AlertTriangle, 
  Search, 
  Users, 
  MessageSquare,
  Loader2,
  RefreshCw,
  AtSign
} from 'lucide-react';
import { ChatMessage } from './chat-message';
import { useMessages } from '@/hooks/use-messages';
import { useClients } from '@/hooks/use-clients';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Client, UserProfile, MessageType, Priority } from '@/types';

interface ClientChatInterfaceProps {
  className?: string;
}

export function ClientChatInterface({ className = '' }: ClientChatInterfaceProps) {
  const { user } = useAuthStore();
  const { clients, loading: clientsLoading } = useClients();
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [priority, setPriority] = useState<Priority>('normal');
  const [isUrgent, setIsUrgent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<UserProfile[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientSuggestions, setRecipientSuggestions] = useState<UserProfile[]>([]);
  const [recipientDirectory, setRecipientDirectory] = useState<Record<string, UserProfile>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    loading: messagesLoading,
    error,
    sendMessage,
    markAsRead,
    searchUsers,
    refreshMessages,
  } = useMessages({
    clientId: selectedClientId || undefined,
    autoSubscribe: true,
  });

  // Filter clients based on search
  const filteredClients = Array.isArray(clients) ? clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-select first client if none selected
  useEffect(() => {
    if (!selectedClientId && Array.isArray(clients) && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Handle mention detection in message text
  useEffect(() => {
    const text = messageText;
    const mentionMatch = text.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      
      if (query.length > 0) {
        searchUsers(query).then(setMentionSuggestions);
      } else {
        setMentionSuggestions([]);
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionSuggestions([]);
    }
  }, [messageText, searchUsers]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedClientId || !user) return;

    const allMentions = Array.from(new Set([...(mentions || []), ...(selectedRecipientIds || [])]));

    const messageInput = {
      clientId: selectedClientId,
      content: messageText.trim(),
      messageType: isUrgent ? 'urgent' : messageType,
      priority: isUrgent ? 'urgent' : priority,
      mentions: allMentions.length > 0 ? allMentions : undefined,
    };

    const success = await sendMessage(messageInput);
    
    if (success) {
      setMessageText('');
      setMentions([]);
      setSelectedRecipientIds([]);
      setIsUrgent(false);
      setPriority('normal');
      setMessageType('text');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMentionSelect = (user: UserProfile) => {
    const newText = messageText.replace(/@\w*$/, `@${user.firstName} `);
    setMessageText(newText);
    setMentions(prev => [...prev, user.id]);
    setShowMentionSuggestions(false);
    textareaRef.current?.focus();
  };

  const selectedClient = Array.isArray(clients) ? clients.find(p => p.id === selectedClientId) : null;
  const unreadCount = messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
  const caregiverUsers = (selectedClient?.caregivers || [])
    .map(cg => cg.caregiver)
    .filter((u): u is UserProfile => Boolean(u));
  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Search recipients globally by name or email
  useEffect(() => {
    const q = recipientQuery.trim();
    if (!q) {
      setRecipientSuggestions([]);
      return;
    }
    let cancelled = false;
    searchUsers(q).then((results) => {
      if (!cancelled) setRecipientSuggestions(results);
    });
    return () => { cancelled = true; };
  }, [recipientQuery, searchUsers]);

  const addRecipient = (u: UserProfile) => {
    setRecipientDirectory((prev) => ({ ...prev, [u.id]: u }));
    setSelectedRecipientIds((prev) => (prev.includes(u.id) ? prev : [...prev, u.id]));
    setRecipientQuery('');
    setRecipientSuggestions([]);
  };

  return (
    <div className={`flex h-[600px] bg-white rounded-lg border ${className}`}>
      {/* Client List Sidebar */}
      <div className="w-80 border-r bg-gray-50">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">caregivers</h3>
            <Badge variant="outline" className="text-xs">
              {Array.isArray(clients) ? clients.length : 0}
            </Badge>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search caregivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {clientsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No caregivers found</p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const clientMessages = messages.filter(m => m.clientId === client.id);
                const unreadClientMessages = clientMessages.filter(
                  m => !m.isRead && m.senderId !== user?.id
                ).length;
                const lastMessage = clientMessages[clientMessages.length - 1];

                return (
                  <Card
                    key={client.id}
                    className={`mb-2 cursor-pointer transition-colors ${
                      selectedClientId === client.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {client.firstName} {client.lastName}
                        </h4>
                        {unreadClientMessages > 0 && (
                      <Badge variant="destructive" className="text-xs">
                            {unreadClientMessages}
                          </Badge>
                        )}
                      </div>
                      
                      {lastMessage && (
                        <p className="text-xs text-gray-600 truncate">
                          {lastMessage.messageType === 'urgent' && (
                            <AlertTriangle className="inline h-3 w-3 text-red-500 mr-1" />
                          )}
                          {lastMessage.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {client.caregivers?.length || 0} caregivers
                        </span>
                        {lastMessage && (
                          <span className="text-xs text-gray-400">
                            {new Date(lastMessage.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedClient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedClient.caregivers?.length || 0} caregivers in chat
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                      <Badge variant="destructive">
                      {unreadCount} unread
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshMessages}
                    disabled={messagesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${messagesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start a conversation with the caregiver
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      sender={message.sender || {
                        id: message.senderId,
                        firstName: 'Unknown',
                        lastName: 'User',
                        email: '',
                        userId: message.senderId,
                        isActive: true,
                        createdAt: '',
                        updatedAt: '',
                      }}
                      currentUserId={user?.id || ''}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-gray-50">
              {/* Message Type and Priority Controls */}
              <div className="flex items-center space-x-2 mb-3">
                <Button
                  variant={isUrgent ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsUrgent(!isUrgent)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Urgent
                </Button>
                
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="text-sm border rounded px-2 py-1"
                  disabled={isUrgent}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              {/* Optional recipients selector (caregiver-to-caregiver) */}
              {(
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">To: <span className="text-gray-500">Select caregivers to notify (optional)</span></div>
                  <div className="flex flex-wrap gap-2">
                    {caregiverUsers.map((u) => {
                      const isSelected = selectedRecipientIds.includes(u.id);
                      return (
                        <Button
                          key={u.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setRecipientDirectory((prev) => ({ ...prev, [u.id]: u }));
                            toggleRecipient(u.id)
                          }}
                          className={isSelected ? '' : 'bg-white'}
                        >
                          {u.firstName} {u.lastName}
                        </Button>
                      );
                    })}
                  </div>
                  {/* Global add-by-email/name */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Add by email or name</div>
                    <Input
                      placeholder="Type an email or name..."
                      value={recipientQuery}
                      onChange={(e) => setRecipientQuery(e.target.value)}
                      className="max-w-md"
                    />
                    {recipientSuggestions.length > 0 && (
                      <div className="mt-1 border rounded-md bg-white shadow-sm max-w-md">
                        {recipientSuggestions.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => addRecipient(u)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                          >
                            <span className="font-medium">{u.firstName} {u.lastName}</span>
                            <span className="text-gray-500">{u.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mention Suggestions */}
              {showMentionSuggestions && mentionSuggestions.length > 0 && (
                <div className="mb-2 p-2 bg-white border rounded-md shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Mention someone:</div>
                  <div className="space-y-1">
                    {mentionSuggestions.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleMentionSelect(user)}
                        className="flex items-center space-x-2 w-full text-left p-1 hover:bg-gray-100 rounded text-sm"
                      >
                        <AtSign className="h-3 w-3 text-gray-400" />
                        <span>{user.firstName} {user.lastName}</span>
                        <span className="text-gray-400">({user.email})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message... (Use @ to mention someone)"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] resize-none"
                    disabled={messagesLoading}
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || messagesLoading}
                  className={isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Active Mentions */}
              {(mentions.length > 0 || selectedRecipientIds.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs text-gray-600">Notifying:</span>
                  {selectedRecipientIds.map((userId) => {
                    const found = recipientDirectory[userId] || caregiverUsers.find(u => u.id === userId);
                    const label = found ? `${found.firstName} ${found.lastName}` : userId;
                    return (
                      <Badge key={`to-${userId}`} variant="secondary" className="text-xs">
                        {label}
                        <button
                          onClick={() => setSelectedRecipientIds(prev => prev.filter(id => id !== userId))}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                  {mentions.map((userId, index) => (
                    <Badge key={`m-${index}`} variant="outline" className="text-xs">
                      @{userId}
                      <button
                        onClick={() => setMentions(prev => prev.filter((_, i) => i !== index))}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a caregiver to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
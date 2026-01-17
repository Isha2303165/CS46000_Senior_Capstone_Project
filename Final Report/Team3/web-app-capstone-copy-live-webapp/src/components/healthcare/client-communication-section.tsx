'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  AlertTriangle, 
  MessageSquare,
  Loader2,
  RefreshCw,
  AtSign,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { ChatMessage } from './chat-message';
import { useMessages } from '@/hooks/use-messages';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Client, UserProfile, MessageType, Priority, ClientCaregiver } from '@/types';

interface ClientCommunicationSectionProps {
  client: Client;
  caregivers: ClientCaregiver[];
  className?: string;
}

interface MentionSuggestion {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function ClientCommunicationSection({
  client,
  caregivers,
  className = ''
}: ClientCommunicationSectionProps) {
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    loading: messagesLoading,
    error,
    sendMessage,
    markAsRead,
    refreshMessages,
  } = useMessages({
    clientId: client.id,
    autoSubscribe: true,
  });

  // Convert caregivers to mention suggestions
  const caregiverSuggestions: MentionSuggestion[] = React.useMemo(() => {
    return caregivers
      .filter(cg => cg.isActive && cg.caregiver && cg.caregiverId !== user?.id)
      .map(cg => ({
        id: cg.caregiverId,
        name: `${cg.caregiver!.firstName} ${cg.caregiver!.lastName}`,
        email: cg.caregiver!.email,
        role: cg.role
      }));
  }, [caregivers, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle mention detection in message text
  useEffect(() => {
    const text = messageText;
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      
      // Filter caregivers based on query
      const filtered = caregiverSuggestions.filter(cg =>
        cg.name.toLowerCase().includes(query) ||
        cg.email.toLowerCase().includes(query) ||
        cg.role.toLowerCase().includes(query)
      );
      
      setMentionSuggestions(filtered);
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionSuggestions([]);
    }
  }, [messageText, cursorPosition, caregiverSuggestions]);

  // Handle cursor position changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    const messageInput = {
      clientId: client.id,
      content: messageText.trim(),
      messageType: (isUrgent ? 'urgent' : 'text') as MessageType,
      priority: isUrgent ? 'urgent' : priority,
      mentions: mentions.length > 0 ? mentions : undefined,
    };

    const success = await sendMessage(messageInput);
    
    if (success) {
      setMessageText('');
      setMentions([]);
      setIsUrgent(false);
      setPriority('normal');
      setCursorPosition(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!showMentionSuggestions) {
        handleSendMessage();
      }
    } else if (e.key === 'ArrowDown' && showMentionSuggestions) {
      e.preventDefault();
      // Handle mention navigation (simplified)
    } else if (e.key === 'ArrowUp' && showMentionSuggestions) {
      e.preventDefault();
      // Handle mention navigation (simplified)
    } else if (e.key === 'Escape' && showMentionSuggestions) {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (suggestion: MentionSuggestion) => {
    const beforeCursor = messageText.substring(0, cursorPosition);
    const afterCursor = messageText.substring(cursorPosition);
    const beforeMention = beforeCursor.replace(/@\w*$/, '');
    const newText = `${beforeMention}@${suggestion.name} ${afterCursor}`;
    
    setMessageText(newText);
    setMentions(prev => [...prev.filter(id => id !== suggestion.id), suggestion.id]);
    setShowMentionSuggestions(false);
    
    // Set cursor position after the mention
    const newCursorPos = beforeMention.length + suggestion.name.length + 2;
    setCursorPosition(newCursorPos);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleRemoveMention = (userId: string) => {
    setMentions(prev => prev.filter(id => id !== userId));
    // Also remove from message text (simplified - in production you'd want more sophisticated text parsing)
    const mentionedUser = caregiverSuggestions.find(cg => cg.id === userId);
    if (mentionedUser) {
      const newText = messageText.replace(`@${mentionedUser.name}`, '');
      setMessageText(newText);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
  const recentMessages = messages.slice(-10); // Show last 10 messages

  return (
    <section 
      className={`space-y-4 ${className}`}
      role="region"
      aria-labelledby="communication-section-title"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 
            id="communication-section-title"
            className="text-xl font-semibold text-gray-900 flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            Communication
          </h2>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="text-xs"
              role="status"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            {caregivers.filter(cg => cg.isActive).length} caregivers
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMessages}
            disabled={messagesLoading}
            aria-label="Refresh messages"
          >
            <RefreshCw className={`h-4 w-4 ${messagesLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>caregiver Messages</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" aria-hidden="true" />
              Real-time updates
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-label="Connected" />
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Display */}
          {error && (
            <div 
              className="p-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="border rounded-lg">
            <ScrollArea className="h-96 p-4">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start a conversation with the caregiver about {client.firstName}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
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
          </div>

          {/* Message Input Area */}
          <div className="space-y-3">
            {/* Priority and Type Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant={isUrgent ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  setIsUrgent(!isUrgent);
                  if (!isUrgent) setPriority('urgent');
                  else setPriority('normal');
                }}
                className="flex items-center gap-2"
                aria-pressed={isUrgent}
                aria-label={isUrgent ? "Remove urgent priority" : "Mark as urgent"}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Urgent
              </Button>
              
              {!isUrgent && (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="text-sm border rounded px-3 py-1 bg-white"
                  aria-label="Message priority"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              )}

              <div className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                Messages sent to all {caregivers.filter(cg => cg.isActive).length} caregivers
              </div>
            </div>

            {/* Mention Suggestions */}
            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <div className="relative">
                <Card className="absolute bottom-full left-0 right-0 mb-2 shadow-lg z-10">
                  <CardContent className="p-2">
                    <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <AtSign className="w-3 h-3" aria-hidden="true" />
                      Mention a caregiver:
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {mentionSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleMentionSelect(suggestion)}
                          className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                          role="option"
                          aria-selected="false"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{suggestion.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.role}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">{suggestion.email}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Active Mentions */}
            {mentions.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-600">Mentioning:</span>
                {mentions.map((userId) => {
                  const mentionedUser = caregiverSuggestions.find(cg => cg.id === userId);
                  return mentionedUser ? (
                    <Badge 
                      key={userId} 
                      variant="secondary" 
                      className="text-xs flex items-center gap-1"
                    >
                      @{mentionedUser.name}
                      <button
                        onClick={() => handleRemoveMention(userId)}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                        aria-label={`Remove mention of ${mentionedUser.name}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* Message Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={`Send a message about ${client.firstName} to the caregiver... (Use @ to mention someone)`}
                  value={messageText}
                  onChange={handleTextareaChange}
                  onSelect={handleTextareaSelect}
                  onKeyDown={handleKeyPress}
                  className="min-h-[80px] resize-none pr-12"
                  disabled={messagesLoading}
                  aria-label="Message content"
                />
                
                {/* Character count */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {messageText.length}/1000
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || messagesLoading || messageText.length > 1000}
                className={`self-end ${isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}`}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Use @ to mention specific caregivers and notify them directly</p>
              <p>• Urgent messages will send immediate notifications to all caregivers</p>
              <p>• Messages are automatically shared with all active caregivers for this client</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
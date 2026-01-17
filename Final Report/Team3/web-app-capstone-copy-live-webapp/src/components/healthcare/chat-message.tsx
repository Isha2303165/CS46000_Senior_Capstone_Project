'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, Reply, MoreHorizontal } from 'lucide-react';
import type { Message, UserProfile } from '@/types';

interface ChatMessageProps {
  message: Message;
  sender: UserProfile;
  currentUserId: string;
  onReply?: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  className?: string;
}

export function ChatMessage({
  message,
  sender,
  currentUserId,
  onReply,
  onMarkAsRead,
  className = '',
}: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;
  const isUrgent = message.priority === 'urgent' || message.messageType === 'urgent';
  const isSystemMessage = message.messageType === 'system';

  const handleMarkAsRead = () => {
    if (!message.isRead && !isOwnMessage && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message.id);
    }
  };

  const getMessageTypeColor = () => {
    switch (message.messageType) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'system':
        return 'bg-blue-50 border-blue-200';
      case 'medication_reminder':
        return 'bg-yellow-50 border-yellow-200';
      case 'appointment_reminder':
        return 'bg-green-50 border-green-200';
      default:
        return isOwnMessage ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadgeColor = () => {
    switch (message.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderMentions = (content: string) => {
    if (!message.mentions || message.mentions.length === 0) {
      return content;
    }

    // Simple mention rendering - in a real app, you'd want to resolve user names
    let processedContent = content;
    message.mentions.forEach((userId) => {
      const mentionRegex = new RegExp(`@${userId}`, 'g');
      processedContent = processedContent.replace(
        mentionRegex,
        `<span class="bg-blue-100 text-blue-800 px-1 rounded">@${userId}</span>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <Card
      className={`${getMessageTypeColor()} ${className} ${
        !message.isRead && !isOwnMessage ? 'ring-2 ring-blue-300' : ''
      }`}
      onClick={handleMarkAsRead}
      role="article"
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          {!isSystemMessage && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {sender.firstName[0]}{sender.lastName[0]}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {!isSystemMessage && (
                  <span className="font-medium text-sm text-gray-900">
                    {isOwnMessage ? 'You' : `${sender.firstName} ${sender.lastName}`}
                  </span>
                )}
                {isSystemMessage && (
                  <span className="font-medium text-sm text-blue-600">
                    System Message
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.createdAt)}
                </span>
                {isUrgent && (
                  <AlertTriangle className="h-4 w-4 text-red-500" data-testid="alert-triangle" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Priority Badge */}
                {message.priority !== 'normal' && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPriorityBadgeColor()}`}
                  >
                    {message.priority}
                  </Badge>
                )}

                {/* Message Type Badge */}
                {message.messageType !== 'text' && (
                  <Badge variant="outline" className="text-xs">
                    {message.messageType.replace('_', ' ')}
                  </Badge>
                )}

                {/* Read Status */}
                {isOwnMessage && (
                  <span className="text-xs text-gray-400">
                    {message.isRead ? 'Read' : 'Sent'}
                  </span>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="text-sm text-gray-800 mb-3">
              {isSystemMessage && message.systemData ? (
                <div className="italic">
                  {message.content}
                  {message.systemData.details && (
                    <div className="mt-1 text-xs text-gray-600">
                      {JSON.stringify(message.systemData.details)}
                    </div>
                  )}
                </div>
              ) : (
                <div className={isExpanded ? '' : 'line-clamp-3'}>
                  {renderMentions(message.content)}
                </div>
              )}

              {/* Expand/Collapse for long messages */}
              {message.content.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Attachments:</div>
                <div className="space-y-1">
                  {message.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline block"
                    >
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isSystemMessage && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-gray-600 hover:text-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReply();
                  }}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-gray-600 hover:text-gray-800"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Reply indicator */}
            {message.replyToId && (
              <div className="mt-2 text-xs text-gray-500 italic">
                Replying to previous message
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
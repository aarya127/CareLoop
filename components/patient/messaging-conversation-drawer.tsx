'use client';

/**
 * Messaging/Conversation Drawer
 * Thread view with AI and human messages, escalation, and appointment conversion
 * Real-time sync with Voice Brain AI system
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquare,
  Send,
  Paperclip,
  Bot,
  User,
  AlertTriangle,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Filter,
  ArrowUpCircle,
  Loader2,
  Plus,
  Image as ImageIcon,
  File,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistance, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { auditLog, trackUXClick } from '@/lib/services/audit-service';
import type { Conversation, Message, SendMessageRequest } from '@/lib/services/api-types';

interface MessagingConversationDrawerProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onConvertToAppointment?: (conversationId: string) => void;
  source?: 'patient_card' | 'quick_action';
}

type ChannelFilter = 'all' | 'sms' | 'voice' | 'web_chat' | 'email';
type StatusFilter = 'all' | 'open' | 'resolved' | 'escalated' | 'snoozed';

export default function MessagingConversationDrawer({
  isOpen,
  patientId,
  patientName,
  onClose,
  onConvertToAppointment,
  source = 'patient_card',
}: MessagingConversationDrawerProps) {
  const { user, hasScope } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  useEffect(() => {
    if (!isOpen) return;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      try {
        // Audit log
        await auditLog({
          action: 'view_conversation',
          actor_id: user?.id,
          patient_id: patientId,
          source,
        });

        // Production: GET /conversations?patient_id={patientId}&limit=50&sort=-last_message_at
        await new Promise((resolve) => setTimeout(resolve, 700));

        // Mock data
        const mockConversations: Conversation[] = [
          {
            conversation_id: 'conv-1',
            patient_id: patientId,
            patient_name: patientName,
            channel: 'web_chat',
            status: 'open',
            last_message_at: '2025-10-17T10:30:00Z',
            unread_count: 2,
            assigned_to: undefined,
            tags: ['appointment_inquiry'],
            created_at: '2025-10-17T09:45:00Z',
            updated_at: '2025-10-17T10:30:00Z',
          },
          {
            conversation_id: 'conv-2',
            patient_id: patientId,
            patient_name: patientName,
            channel: 'sms',
            status: 'resolved',
            last_message_at: '2025-10-15T14:20:00Z',
            unread_count: 0,
            assigned_to: undefined,
            tags: ['confirmation'],
            created_at: '2025-10-15T14:15:00Z',
            updated_at: '2025-10-15T14:25:00Z',
          },
          {
            conversation_id: 'conv-3',
            patient_id: patientId,
            patient_name: patientName,
            channel: 'voice',
            status: 'escalated',
            last_message_at: '2025-10-10T11:00:00Z',
            unread_count: 1,
            assigned_to: 'staff-1',
            tags: ['billing_question', 'urgent'],
            created_at: '2025-10-10T10:30:00Z',
            updated_at: '2025-10-10T11:05:00Z',
          },
        ];

        setConversations(mockConversations);

        // Auto-select first conversation
        if (mockConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(mockConversations[0]);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, [isOpen, patientId, patientName, user, source, selectedConversation]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        // Production: GET /conversations/{conversation_id}/messages?limit=100
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock messages
        const mockMessages: Message[] = [
          {
            message_id: 'msg-1',
            conversation_id: selectedConversation.conversation_id,
            sender: 'patient',
            sender_id: patientId,
            sender_name: patientName,
            text: "Hi, I'd like to schedule a cleaning appointment. Do you have any availability next week?",
            timestamp: '2025-10-17T09:45:00Z',
            read_at: '2025-10-17T09:45:30Z',
          },
          {
            message_id: 'msg-2',
            conversation_id: selectedConversation.conversation_id,
            sender: 'ai',
            sender_id: 'ai-assistant-1',
            sender_name: 'CareLoop AI',
            text: "Hello! I'd be happy to help you schedule a cleaning appointment. Let me check our availability for next week. What days work best for you?",
            timestamp: '2025-10-17T09:45:15Z',
            read_at: '2025-10-17T09:46:00Z',
          },
          {
            message_id: 'msg-3',
            conversation_id: selectedConversation.conversation_id,
            sender: 'patient',
            sender_id: patientId,
            sender_name: patientName,
            text: 'Tuesday or Wednesday afternoon would be ideal.',
            timestamp: '2025-10-17T09:46:30Z',
            read_at: '2025-10-17T09:46:45Z',
          },
          {
            message_id: 'msg-4',
            conversation_id: selectedConversation.conversation_id,
            sender: 'ai',
            sender_id: 'ai-assistant-1',
            sender_name: 'CareLoop AI',
            text: "Perfect! I have availability on Tuesday, October 22nd at 2:00 PM or Wednesday, October 23rd at 3:30 PM. Both are with Dr. Smith. Which time works better for you?",
            timestamp: '2025-10-17T09:47:00Z',
            read_at: '2025-10-17T09:48:00Z',
          },
          {
            message_id: 'msg-5',
            conversation_id: selectedConversation.conversation_id,
            sender: 'patient',
            sender_id: patientId,
            sender_name: patientName,
            text: "I'll take Tuesday at 2 PM please!",
            timestamp: '2025-10-17T10:30:00Z',
            read_at: undefined,
          },
        ];

        setMessages(mockMessages);

        // Mark as read
        if (selectedConversation.unread_count > 0) {
          // Production: POST /conversations/{id}/mark_read
          setConversations((prev) =>
            prev.map((conv) =>
              conv.conversation_id === selectedConversation.conversation_id
                ? { ...conv, unread_count: 0 }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation, patientId, patientName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (channelFilter !== 'all' && conv.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && conv.status !== statusFilter) return false;
    return true;
  });

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() && attachments.length === 0) return;
    if (!hasScope('COMMS_WRITE')) {
      alert('You do not have permission to send messages');
      return;
    }
    if (!selectedConversation) return;

    setIsSending(true);
    try {
      await trackUXClick('send_message_button', {
        patient_id: patientId,
        conversation_id: selectedConversation.conversation_id,
        has_attachments: attachments.length > 0,
      });

      // Build request
      const request: SendMessageRequest = {
        conversation_id: selectedConversation.conversation_id,
        text: messageText.trim(),
        attachments: attachments.map((file) => ({
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: URL.createObjectURL(file),
          filename: file.name,
        })),
      };

      // Production: POST /conversations/{id}/messages with idempotency key
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Optimistic UI - add message immediately
      const newMessage: Message = {
        message_id: crypto.randomUUID(),
        conversation_id: selectedConversation.conversation_id,
        sender: 'staff',
        sender_id: user?.id || '',
        sender_name: `${user?.firstName} ${user?.lastName}`,
        text: messageText.trim(),
        attachments: attachments.map((file) => ({
          id: `attach-${Date.now()}-${Math.random()}`,
          type: file.type.startsWith('image/') ? 'image' as const : 'document' as const,
          filename: file.name,
          url: URL.createObjectURL(file),
        })),
        timestamp: new Date().toISOString(),
        read_at: undefined,
      };

      setMessages((prev) => [...prev, newMessage]);

      await auditLog({
        action: 'send_message',
        actor_id: user?.id,
        patient_id: patientId,
        resource_type: 'conversation',
        resource_id: selectedConversation.conversation_id,
        source: 'messaging_drawer',
        metadata: {
          channel: selectedConversation.channel,
          has_attachments: attachments.length > 0,
        },
      });

      // Clear input
      setMessageText('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Escalate conversation
  const handleEscalate = async () => {
    if (!selectedConversation || !hasScope('COMMS_WRITE')) return;

    try {
      await trackUXClick('escalate_conversation', {
        patient_id: patientId,
        conversation_id: selectedConversation.conversation_id,
      });

      // Production: PATCH /conversations/{id} { status: 'escalated' }
      await new Promise((resolve) => setTimeout(resolve, 500));

      await auditLog({
        action: 'send_message',
        actor_id: user?.id,
        patient_id: patientId,
        resource_type: 'conversation',
        resource_id: selectedConversation.conversation_id,
        source: 'messaging_drawer',
        metadata: { action: 'escalate', from_status: selectedConversation.status },
      });

      // Update local state
      setSelectedConversation({ ...selectedConversation, status: 'escalated', assigned_to: user?.id || undefined });
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversation_id === selectedConversation.conversation_id
            ? { ...conv, status: 'escalated', assigned_to: user?.id || undefined }
            : conv
        )
      );

      alert('Conversation escalated to human agent successfully!');
    } catch (error) {
      console.error('Failed to escalate conversation:', error);
    }
  };

  // Convert to appointment
  const handleConvertToAppointment = async () => {
    if (!selectedConversation) return;

    await trackUXClick('convert_to_appointment', {
      patient_id: patientId,
      conversation_id: selectedConversation.conversation_id,
    });

    if (onConvertToAppointment) {
      onConvertToAppointment(selectedConversation.conversation_id);
    }

    // In production: Extract datetime/procedure from messages using AI
    // POST /appointments/convert { conversation_id, suggested_datetime, procedure }
    alert('In production, this would:\n1. Analyze conversation for appointment details\n2. Extract date/time preferences\n3. Open booking form with prefilled data\n4. Link appointment to conversation');
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-4xl bg-white shadow-2xl overflow-hidden flex"
        >
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
            {/* Sidebar Header */}
            <div className="bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] px-4 py-3 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Conversations</h3>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Filters */}
              <div className="flex gap-1">
                {(['all', 'open', 'escalated'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      statusFilter === status
                        ? 'bg-white text-[#87CEEB] font-medium'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    )}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <ConversationsSkeleton />
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No conversations found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.conversation_id}
                      conversation={conv}
                      isSelected={selectedConversation?.conversation_id === conv.conversation_id}
                      onClick={() => setSelectedConversation(conv)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages Header */}
                <div className="border-b border-gray-200 px-6 py-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#87CEEB] to-[#6BA8D9] rounded-full flex items-center justify-center text-white font-semibold">
                        {patientName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{patientName}</h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{selectedConversation.channel.replace('_', ' ')}</span>
                          <span>•</span>
                          <StatusBadge status={selectedConversation.status} />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {selectedConversation.status !== 'escalated' && hasScope('COMMS_WRITE') && (
                        <button
                          onClick={handleEscalate}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors flex items-center gap-1"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                          Escalate
                        </button>
                      )}
                      {selectedConversation.tags?.includes('appointment_inquiry') && (
                        <button
                          onClick={handleConvertToAppointment}
                          className="px-3 py-1.5 bg-[#87CEEB] text-white rounded-lg text-sm font-medium hover:bg-[#6BA8D9] transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-4 h-4" />
                          Book Appointment
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  {isLoadingMessages ? (
                    <MessagesSkeleton />
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <MessageBubble
                          key={message.message_id}
                          message={message}
                          isFirst={index === 0 || messages[index - 1].sender !== message.sender}
                          delay={index * 0.05}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                {hasScope('COMMS_WRITE') && (
                  <div className="border-t border-gray-200 bg-white p-4">
                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                          >
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input */}
                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0"
                        title="Attach file"
                      >
                        <Paperclip className="w-5 h-5 text-gray-600" />
                      </button>
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#87CEEB] focus:border-transparent"
                        rows={2}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={(!messageText.trim() && attachments.length === 0) || isSending}
                        className="w-10 h-10 rounded-lg bg-[#87CEEB] text-white hover:bg-[#6BA8D9] transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a conversation</h3>
                  <p className="text-sm text-gray-600">Choose a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Conversation Item Component
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastMessageDate = parseISO(conversation.last_message_at);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 text-left transition-colors',
        isSelected ? 'bg-white border-l-4 border-[#87CEEB]' : 'hover:bg-white'
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 capitalize">
            {conversation.channel.replace('_', ' ')}
          </span>
          {conversation.unread_count > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
              {conversation.unread_count}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {isToday(lastMessageDate) ? format(lastMessageDate, 'h:mm a') : format(lastMessageDate, 'MMM d')}
        </span>
      </div>
      <StatusBadge status={conversation.status} />
      {conversation.tags && conversation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {conversation.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'resolved':
        return 'bg-gray-100 text-gray-700';
      case 'escalated':
        return 'bg-orange-100 text-orange-700';
      case 'snoozed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', getStatusStyle())}>
      {status}
    </span>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isFirst,
  delay = 0,
}: {
  message: Message;
  isFirst: boolean;
  delay?: number;
}) {
  const isStaff = message.sender === 'staff' || message.sender === 'ai';
  const timestamp = parseISO(message.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn('flex gap-3', isStaff ? 'justify-start' : 'justify-end')}
    >
      {isStaff && isFirst && (
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            message.sender === 'ai' ? 'bg-sky-100 text-sky-600' : 'bg-purple-100 text-purple-600'
          )}
        >
          {message.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
      )}
      {isStaff && !isFirst && <div className="w-8" />}

      <div className={cn('flex flex-col', isStaff ? 'items-start' : 'items-end', 'max-w-[70%]')}>
        {isFirst && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-xs font-medium text-gray-700">{message.sender_name}</span>
            <span className="text-xs text-gray-500">{format(timestamp, 'h:mm a')}</span>
          </div>
        )}

        <div
          className={cn(
            'px-4 py-2 rounded-2xl',
            isStaff
              ? message.sender === 'ai'
                ? 'bg-sky-50 text-gray-900'
                : 'bg-purple-50 text-gray-900'
              : 'bg-[#87CEEB] text-white'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded text-xs hover:bg-white/80 transition-colors"
                >
                  {attachment.type === 'image' ? (
                    <ImageIcon className="w-3 h-3" />
                  ) : (
                    <File className="w-3 h-3" />
                  )}
                  <span className="truncate">{attachment.filename}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {!isFirst && !isStaff && message.read_at && (
          <div className="flex items-center gap-1 mt-1 px-1">
            <CheckCheck className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-gray-500">Read</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Loading Skeletons
function ConversationsSkeleton() {
  return (
    <div className="divide-y divide-gray-200 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-4 py-3">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
          {i % 2 === 0 && <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />}
          <div className={cn('max-w-[70%]', i % 2 === 0 ? 'items-start' : 'items-end', 'flex flex-col')}>
            <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
            <div className={cn('h-16 bg-gray-200 rounded-2xl', i % 3 === 0 ? 'w-64' : 'w-48')} />
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Mail,
  Phone,
  Bot,
  User,
  Paperclip,
  Smile,
  MoreVertical,
  CheckCheck,
  Clock,
  AlertCircle,
  Calendar,
  ChevronLeft,
  X,
  Plus,
} from 'lucide-react';
import { getAllDemoPatients } from '@/lib/demo/sample-data';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'staff' | 'ai';
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  channel: 'sms' | 'email' | 'portal' | 'ai-chat';
}

interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  channel: 'sms' | 'email' | 'portal' | 'ai-chat';
  assignedTo?: string;
  status: 'active' | 'resolved' | 'pending';
  priority?: 'low' | 'medium' | 'high';
  hasAIResponse: boolean;
}

// Generate sample conversations
function generateConversations(): Conversation[] {
  const patients = getAllDemoPatients();
  const conversations: Conversation[] = [];
  const channels: Array<'sms' | 'email' | 'portal' | 'ai-chat'> = ['sms', 'email', 'portal', 'ai-chat'];
  const statuses: Array<'active' | 'resolved' | 'pending'> = ['active', 'resolved', 'pending'];
  const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

  const lastMessages = [
    'When is my next appointment?',
    'I need to reschedule my appointment',
    'Can you send me my invoice?',
    'I have a question about my insurance',
    'Thank you for the reminder!',
    'Is Dr. Chen available tomorrow?',
    'I need to update my contact information',
    'What time is my appointment?',
  ];

  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length];
    const channel = channels[i % channels.length];
    const status = i < 6 ? 'active' : i < 15 ? 'resolved' : 'pending';

    const lastMessageTime = new Date();
    lastMessageTime.setHours(lastMessageTime.getHours() - i * 2);
    lastMessageTime.setMinutes(Math.floor(Math.random() * 60));

    conversations.push({
      id: `conv-${i}`,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      lastMessage: lastMessages[i % lastMessages.length],
      lastMessageTime,
      unreadCount: status === 'active' && i < 6 ? Math.floor(Math.random() * 5) : 0,
      channel,
      assignedTo: status === 'active' ? ['Dr. Chen', 'Dr. Wilson', 'Reception'][i % 3] : undefined,
      status,
      priority: status === 'pending' || status === 'active' ? priorities[i % 3] : undefined,
      hasAIResponse: Math.random() > 0.5,
    });
  }

  return conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
}

// Generate sample messages for a conversation
function generateMessages(conversationId: string): Message[] {
  const messages: Message[] = [
    {
      id: `msg-1`,
      conversationId,
      senderId: 'patient-001',
      senderName: 'Patient',
      senderType: 'patient',
      content: 'Hi, I need to reschedule my appointment for next week.',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read',
      channel: 'sms',
    },
    {
      id: `msg-2`,
      conversationId,
      senderId: 'ai-001',
      senderName: 'AI Assistant',
      senderType: 'ai',
      content: 'I\'d be happy to help you reschedule. Let me check the available times for next week.',
      timestamp: new Date(Date.now() - 3540000),
      status: 'read',
      channel: 'sms',
    },
    {
      id: `msg-3`,
      conversationId,
      senderId: 'ai-001',
      senderName: 'AI Assistant',
      senderType: 'ai',
      content: 'I have the following times available next week: Monday at 2pm, Tuesday at 10am, or Thursday at 3pm. Which works best for you?',
      timestamp: new Date(Date.now() - 3480000),
      status: 'read',
      channel: 'sms',
    },
    {
      id: `msg-4`,
      conversationId,
      senderId: 'patient-001',
      senderName: 'Patient',
      senderType: 'patient',
      content: 'Tuesday at 10am would be perfect!',
      timestamp: new Date(Date.now() - 3420000),
      status: 'read',
      channel: 'sms',
    },
    {
      id: `msg-5`,
      conversationId,
      senderId: 'ai-001',
      senderName: 'AI Assistant',
      senderType: 'ai',
      content: 'Great! I\'ve rescheduled your appointment to Tuesday, October 22nd at 10:00 AM with Dr. Chen. You\'ll receive a confirmation SMS shortly.',
      timestamp: new Date(Date.now() - 3360000),
      status: 'read',
      channel: 'sms',
    },
    {
      id: `msg-6`,
      conversationId,
      senderId: 'patient-001',
      senderName: 'Patient',
      senderType: 'patient',
      content: 'Thank you so much!',
      timestamp: new Date(Date.now() - 3300000),
      status: 'read',
      channel: 'sms',
    },
  ];

  return messages;
}

export default function AdminMessagingPage() {
  const [conversations] = useState<Conversation[]>(generateConversations());
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewMessage, setShowNewMessage] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'all' || conv.channel === filterChannel;
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessages(generateMessages(conv.id));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: 'staff-001',
      senderName: 'You',
      senderType: 'staff',
      content: messageInput,
      timestamp: new Date(),
      status: 'sent',
      channel: selectedConversation.channel,
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'ai-chat':
        return <Bot className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'sms':
        return 'bg-blue-100 text-blue-700';
      case 'email':
        return 'bg-purple-100 text-purple-700';
      case 'phone':
        return 'bg-green-100 text-green-700';
      case 'ai-chat':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => setShowNewMessage(true)}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* ...existing code... */}

            {/* Filters */}
            <div className="flex items-center space-x-2 mt-3">
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Channels</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="portal">Portal</option>
                <option value="ai-chat">AI Chat</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                  selectedConversation?.id === conv.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {conv.patientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.patientName}
                      </p>
                      <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">{conv.lastMessage}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getChannelColor(conv.channel)}`}>
                        {getChannelIcon(conv.channel)}
                        <span className="ml-1 capitalize">{conv.channel}</span>
                      </span>
                      {conv.hasAIResponse && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          <Bot className="w-3 h-3 mr-1" />
                          AI
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                          {conv.unreadCount}
                        </span>
                      )}
                      {conv.priority && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(conv.priority)}`}>
                          {conv.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filteredConversations.length === 0 && (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No conversations found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {selectedConversation.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedConversation.patientName}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getChannelColor(selectedConversation.channel)}`}>
                        {getChannelIcon(selectedConversation.channel)}
                        <span className="ml-1 capitalize">{selectedConversation.channel}</span>
                      </span>
                      {selectedConversation.assignedTo && (
                        <span className="text-xs text-gray-500">
                          Assigned to: {selectedConversation.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <User className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Calendar className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'staff' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.senderType === 'staff'
                          ? 'bg-indigo-600 text-white'
                          : message.senderType === 'ai'
                          ? 'bg-indigo-100 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg p-3`}
                    >
                      {message.senderType !== 'staff' && (
                        <div className="flex items-center space-x-2 mb-1">
                          {message.senderType === 'ai' ? (
                            <Bot className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="text-xs font-medium text-gray-600">
                            {message.senderName}
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>{formatTime(message.timestamp)}</span>
                        {message.senderType === 'staff' && (
                          <CheckCheck className={`w-4 h-4 ml-2 ${message.status === 'read' ? 'text-blue-300' : ''}`} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Use AI to draft response
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">Select a conversation</p>
                <p className="text-gray-500 text-sm mt-2">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">
                {conversations.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {conversations.filter((c) => c.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Handled</p>
              <p className="text-2xl font-bold text-indigo-600">
                {conversations.filter((c) => c.hasAIResponse).length}
              </p>
            </div>
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-red-600">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

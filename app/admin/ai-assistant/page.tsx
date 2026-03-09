'use client';

import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Pause,
  Volume2,
  Download,
  MessageSquare,
  Clock,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bot,
  UserCircle,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { getAllDemoPatients } from '@/lib/demo/sample-data';

interface CallRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'in-progress' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  isAIHandled: boolean;
  transcriptAvailable: boolean;
  recordingAvailable: boolean;
  purpose?: string;
  outcome?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ActiveCall {
  id: string;
  patientName: string;
  patientPhone: string;
  direction: 'inbound' | 'outbound';
  startTime: Date;
  isAIHandling: boolean;
  liveTranscript: Array<{ speaker: 'ai' | 'patient'; text: string; timestamp: Date }>;
}

// Generate sample call history
function generateCallHistory(): CallRecord[] {
  const patients = getAllDemoPatients();
  const calls: CallRecord[] = [];
  const purposes = [
    'Appointment Confirmation',
    'Appointment Booking',
    'Insurance Verification',
    'Billing Inquiry',
    'Emergency Call',
    'Follow-up',
    'Rescheduling',
  ];
  const outcomes = [
    'Appointment confirmed',
    'Appointment booked',
    'Information provided',
    'Issue resolved',
    'Transferred to staff',
    'Callback requested',
  ];

  for (let i = 0; i < 25; i++) {
    const patient = patients[i % patients.length];
    const direction = Math.random() > 0.5 ? 'inbound' : 'outbound';
    const statuses: Array<'completed' | 'missed' | 'failed'> = ['completed', 'missed', 'failed'];
    const status = i < 20 ? 'completed' : statuses[i % 3];
    const isAIHandled = Math.random() > 0.3;
    const duration = status === 'completed' ? Math.floor(Math.random() * 300) + 30 : 0;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - i);
    startTime.setMinutes(Math.floor(Math.random() * 60));

    const endTime = status === 'completed' ? new Date(startTime.getTime() + duration * 1000) : undefined;

    calls.push({
      id: `call-${i}`,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientPhone: patient.phone,
      direction,
      status,
      startTime,
      endTime,
      duration,
      isAIHandled,
      transcriptAvailable: status === 'completed',
      recordingAvailable: status === 'completed',
      purpose: purposes[i % purposes.length],
      outcome: status === 'completed' ? outcomes[i % outcomes.length] : undefined,
      sentiment: status === 'completed' ? (['positive', 'neutral', 'negative'][i % 3] as any) : undefined,
    });
  }

  return calls.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

// Sample active calls
const sampleActiveCalls: ActiveCall[] = [
  {
    id: 'active-1',
    patientName: 'Sarah Johnson',
    patientPhone: '+1 (619) 555-1234',
    direction: 'inbound',
    startTime: new Date(Date.now() - 120000), // 2 minutes ago
    isAIHandling: true,
    liveTranscript: [
      { speaker: 'ai', text: 'Hello, this is CareLoop AI Assistant. How can I help you today?', timestamp: new Date(Date.now() - 120000) },
      { speaker: 'patient', text: 'Hi, I need to reschedule my appointment for tomorrow.', timestamp: new Date(Date.now() - 110000) },
      { speaker: 'ai', text: 'I\'d be happy to help you reschedule. Let me pull up your appointment details.', timestamp: new Date(Date.now() - 100000) },
      { speaker: 'ai', text: 'I see you have an appointment tomorrow at 2:00 PM. What day would work better for you?', timestamp: new Date(Date.now() - 90000) },
      { speaker: 'patient', text: 'How about next Friday?', timestamp: new Date(Date.now() - 80000) },
    ],
  },
  {
    id: 'active-2',
    patientName: 'Michael Chen',
    patientPhone: '+1 (858) 555-5678',
    direction: 'outbound',
    startTime: new Date(Date.now() - 60000), // 1 minute ago
    isAIHandling: true,
    liveTranscript: [
      { speaker: 'ai', text: 'Hello, this is CareLoop calling to confirm your appointment.', timestamp: new Date(Date.now() - 60000) },
      { speaker: 'patient', text: 'Yes, this is Michael.', timestamp: new Date(Date.now() - 50000) },
    ],
  },
];

export default function AdminAIAssistantPage() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>(sampleActiveCalls);
  const [manualOwners, setManualOwners] = useState<Record<string, boolean>>({});
  const [callHistory] = useState<CallRecord[]>(generateCallHistory());
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAI, setFilterAI] = useState<string>('all');
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [pipecatStatus, setPipecatStatus] = useState<{
    reachable: boolean;
    clientUrl: string;
    healthUrl: string;
  } | null>(null);
  const [pipecatLoading, setPipecatLoading] = useState(false);

  const filteredCalls = callHistory.filter((call) => {
    const matchesSearch =
      call.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.patientPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
    const matchesAI =
      filterAI === 'all' ||
      (filterAI === 'ai' && call.isAIHandled) ||
      (filterAI === 'human' && !call.isAIHandled);

    return matchesSearch && matchesStatus && matchesAI;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusIcon = (status: CallRecord['status'], direction: CallRecord['direction']) => {
    if (status === 'in-progress') return <PhoneCall className="w-5 h-5 text-blue-600 animate-pulse" />;
    if (status === 'missed') return <PhoneMissed className="w-5 h-5 text-red-600" />;
    if (status === 'failed') return <PhoneOff className="w-5 h-5 text-red-600" />;
    if (direction === 'inbound') return <PhoneIncoming className="w-5 h-5 text-green-600" />;
    return <PhoneOutgoing className="w-5 h-5 text-blue-600" />;
  };

  const getSentimentColor = (sentiment?: string) => {
    if (sentiment === 'positive') return 'bg-green-100 text-green-700';
    if (sentiment === 'negative') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const overtakeCall = async (callId: string) => {
    await fetch('/api/voice/overtake/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId, action: 'handoff.request' }),
    });
    await fetch('/api/voice/overtake/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId, action: 'handoff.accept' }),
    });

    setManualOwners((prev) => ({ ...prev, [callId]: true }));
    setActiveCalls((prev) =>
      prev.map((call) => (call.id === callId ? { ...call, isAIHandling: false } : call)),
    );
  };

  const resumeAiControl = async (callId: string) => {
    await fetch('/api/voice/overtake/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId, action: 'handoff.resume_ai' }),
    });

    setManualOwners((prev) => ({ ...prev, [callId]: false }));
    setActiveCalls((prev) =>
      prev.map((call) => (call.id === callId ? { ...call, isAIHandling: true } : call)),
    );
  };

  const endActiveCall = async (callId: string) => {
    await fetch('/api/voice/overtake/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId, action: 'call.end' }),
    });

    setActiveCalls((prev) => prev.filter((call) => call.id !== callId));
  };

  const checkPipecat = async () => {
    setPipecatLoading(true);
    try {
      const response = await fetch('/api/voice/pipecat/status');
      const data = await response.json();
      setPipecatStatus({
        reachable: Boolean(data?.reachable),
        clientUrl: data?.clientUrl || 'http://localhost:7860/client',
        healthUrl: data?.healthUrl || 'http://localhost:7860',
      });
    } finally {
      setPipecatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Phone Assistant</h1>
            <p className="text-gray-600 mt-2">
              {activeCalls.length} active calls • {callHistory.length} total calls
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkPipecat}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>{pipecatLoading ? 'Checking...' : 'Check Pipecat'}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Phone className="w-4 h-4" />
              <span>Make Call</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Pipecat Local Test</h2>
          <p className="text-sm text-gray-600 mt-1">
            Start `pipecat-agent/bot.py`, then test voice via Pipecat WebRTC client.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                pipecatStatus?.reachable ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {pipecatStatus?.reachable ? 'Pipecat reachable' : 'Status unknown'}
            </span>
            <a
              href={pipecatStatus?.clientUrl || 'http://localhost:7860/client'}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Open Pipecat Client
            </a>
            <span className="text-xs text-gray-500">Health URL: {pipecatStatus?.healthUrl || 'http://localhost:7860'}</span>
          </div>
        </div>

        {/* Active Calls */}
        {activeCalls.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Active Calls ({activeCalls.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCalls.map((call) => (
                <div key={call.id} className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <PhoneCall className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-medium">{call.patientName}</p>
                        <p className="text-sm text-white/70">{call.patientPhone}</p>
                      </div>
                    </div>
                    {call.isAIHandling && (
                      <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium flex items-center space-x-1">
                        <Bot className="w-3 h-3" />
                        <span>AI</span>
                      </span>
                    )}
                  </div>

                  <div className="mb-3 text-sm text-white/80">
                    <p>Duration: {formatDuration(Math.floor((Date.now() - call.startTime.getTime()) / 1000))}</p>
                    <p>Direction: {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'}</p>
                  </div>

                  {/* Live Transcript */}
                  <div className="bg-white/10 rounded-lg p-3 max-h-40 overflow-y-auto mb-3 space-y-2">
                    {call.liveTranscript.map((entry, index) => (
                      <div key={index} className="text-sm">
                        <span className={`font-medium ${entry.speaker === 'ai' ? 'text-blue-200' : 'text-white'}`}>
                          {entry.speaker === 'ai' ? 'AI' : 'Patient'}:
                        </span>
                        <span className="ml-2 text-white/90">{entry.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Call Actions */}
                  <div className="flex items-center space-x-2">
                    {manualOwners[call.id] ? (
                      <button
                        onClick={() => resumeAiControl(call.id)}
                        className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Resume AI
                      </button>
                    ) : (
                      <button
                        onClick={() => overtakeCall(call.id)}
                        className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manual Overtake
                      </button>
                    )}
                    <button
                      onClick={() => endActiveCall(call.id)}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      End Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{callHistory.length}</p>
              </div>
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Handled</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {callHistory.filter((c) => c.isAIHandled).length}
                </p>
              </div>
              <Bot className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {callHistory.filter((c) => c.status === 'completed').length}
                </p>
              </div>
              <PhoneCall className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Missed</p>
                <p className="text-2xl font-bold text-red-600">
                  {callHistory.filter((c) => c.status === 'missed').length}
                </p>
              </div>
              <PhoneMissed className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* ...existing code... */}

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="failed">Failed</option>
            </select>

            {/* AI Filter */}
            <select
              value={filterAI}
              onChange={(e) => setFilterAI(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Calls</option>
              <option value="ai">AI Handled</option>
              <option value="human">Human Handled</option>
            </select>
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Call History</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredCalls.map((call) => (
              <div key={call.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(call.status, call.direction)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{call.patientName}</p>
                        <p className="text-sm text-gray-500">{call.patientPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatTimeAgo(call.startTime)}</p>
                        {call.duration > 0 && (
                          <p className="text-sm text-gray-500">{formatDuration(call.duration)}</p>
                        )}
                      </div>
                    </div>

                    {/* Purpose & Outcome */}
                    {call.purpose && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Purpose:</span> {call.purpose}
                      </p>
                    )}
                    {call.outcome && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Outcome:</span> {call.outcome}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {call.isAIHandled && (
                        <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          <Bot className="w-3 h-3 mr-1" />
                          AI Handled
                        </span>
                      )}
                      {call.sentiment && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(call.sentiment)}`}>
                          Sentiment: {call.sentiment}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {call.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      {call.transcriptAvailable && (
                        <button
                          onClick={() => setExpandedTranscript(expandedTranscript === call.id ? null : call.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Transcript</span>
                          {expandedTranscript === call.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {call.recordingAvailable && (
                        <button
                          onClick={() => setIsPlaying(isPlaying === call.id ? null : call.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
                        >
                          {isPlaying === call.id ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>Play Recording</span>
                            </>
                          )}
                        </button>
                      )}
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>View Patient</span>
                      </button>
                    </div>

                    {/* Expanded Transcript */}
                    {expandedTranscript === call.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">Call Transcript</h4>
                          <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {/* Sample transcript */}
                          <div>
                            <p className="text-xs font-medium text-indigo-600 mb-1">AI Assistant</p>
                            <p className="text-sm text-gray-700">
                              Hello, this is CareLoop AI Assistant. How can I help you today?
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Patient</p>
                            <p className="text-sm text-gray-700">
                              Hi, I'd like to schedule an appointment for a cleaning.
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-indigo-600 mb-1">AI Assistant</p>
                            <p className="text-sm text-gray-700">
                              I'd be happy to help you schedule a cleaning. Let me check available times...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Audio Player (when playing) */}
                    {isPlaying === call.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            <Pause className="w-5 h-5" />
                          </button>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: '35%' }}></div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                              <span>1:23</span>
                              <span>3:45</span>
                            </div>
                          </div>
                          <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                            <Volume2 className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCalls.length === 0 && (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No calls found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
    </div>
  );
}

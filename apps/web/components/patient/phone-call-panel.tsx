'use client';
// @ts-nocheck - Mock data temporarily uses extended interface fields for demo

/**
 * Phone/VoIP Call Panel
 * Click-to-call interface with call history, recordings, and transcripts
 * Supports AI and human agents with consent checks
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  PhoneCall,
  PhoneOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  FileText,
  Clock,
  User,
  Bot,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistance, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { auditLog, trackUXClick } from '@/lib/services/audit-service';
import type { CallRecord, CallTranscript, InitiateCallRequest } from '@/lib/services/api-types';

interface PhoneCallPanelProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  patientPhone: string;
  onClose: () => void;
  source?: 'patient_card' | 'quick_action';
}

type CallFilter = 'all' | 'inbound' | 'outbound';

export default function PhoneCallPanel({
  isOpen,
  patientId,
  patientName,
  patientPhone,
  onClose,
  source = 'patient_card',
}: PhoneCallPanelProps) {
  const { user, hasScope } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CallFilter>('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Load call history
  useEffect(() => {
    if (!isOpen) return;

    const loadCalls = async () => {
      setIsLoading(true);
      try {
        // Audit log
        await auditLog({
          action: 'view_call_history',
          actor_id: user?.id,
          patient_id: patientId,
          source,
        });

        // Production: GET /calls?patient_id={patientId}&limit=50&sort=-created_at
        await new Promise((resolve) => setTimeout(resolve, 700));

        // Mock data
        const mockCalls: CallRecord[] = [
          {
            call_id: 'call-1',
            patient_id: patientId,
            direction: 'outbound',
            from_number: '+1-310-555-0100',
            to_number: patientPhone,
            agent: 'ai',
            agent_id: 'ai-assistant-1',
            agent_name: 'CareLoop AI',
            duration_sec: 245,
            status: 'completed',
            summary: 'Confirmed upcoming appointment on Oct 20. Patient has no questions or concerns.',
            transcript_available: true,
            recording_url: 'https://cdn.example.com/recordings/call-1.mp3',
            consent_to_record: true,
            created_at: '2025-10-15T14:30:00Z',
            metadata: { ai_confidence: 0.94, sentiment: 'positive', ended_at: '2025-10-15T14:34:05Z' },
          },
          {
            call_id: 'call-2',
            patient_id: patientId,
            direction: 'inbound',
            from_number: patientPhone,
            to_number: '+1-310-555-0100',
            agent: 'human',
            agent_id: user?.id || 'staff-1',
            agent_name: 'Sarah Mitchell (Receptionist)',
            duration_sec: 180,
            status: 'completed',
            summary: 'Patient called to reschedule appointment. Moved from Oct 15 to Oct 20.',
            transcript_available: false,
            consent_to_record: true,
            created_at: '2025-10-10T09:15:00Z',
            started_at: '2025-10-10T09:15:00Z',
            ended_at: '2025-10-10T09:18:00Z',
          },
          {
            call_id: 'call-3',
            patient_id: patientId,
            direction: 'outbound',
            from_number: '+1-310-555-0100',
            to_number: patientPhone,
            agent: 'ai',
            agent_id: 'ai-assistant-1',
            agent_name: 'CareLoop AI',
            duration_sec: 0,
            status: 'no_answer',
            summary: 'No answer - left voicemail about upcoming appointment.',
            transcript_available: false,
            consent_to_record: true,
            created_at: '2025-10-08T16:45:00Z',
            started_at: '2025-10-08T16:45:00Z',
            ended_at: '2025-10-08T16:45:30Z',
          },
          {
            call_id: 'call-4',
            patient_id: patientId,
            direction: 'outbound',
            from_number: '+1-310-555-0100',
            to_number: patientPhone,
            agent: 'human',
            agent_id: 'doc-1',
            agent_name: 'Dr. Robert Smith',
            duration_sec: 420,
            status: 'completed',
            summary: 'Discussed periodontal treatment plan. Patient agreed to 3-month maintenance schedule.',
            transcript_available: true,
            recording_url: 'https://cdn.example.com/recordings/call-4.mp3',
            consent_to_record: true,
            created_at: '2025-09-28T11:00:00Z',
            started_at: '2025-09-28T11:00:00Z',
            ended_at: '2025-09-28T11:07:00Z',
          },
        ];

        setCalls(mockCalls);
      } catch (error) {
        console.error('Failed to load calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [isOpen, patientId, patientPhone, user, source]);

  // Filter calls
  const filteredCalls = calls.filter((call) => {
    if (filter === 'inbound') return call.direction === 'inbound';
    if (filter === 'outbound') return call.direction === 'outbound';
    return true;
  });

  // Initiate call
  const handleInitiateCall = async () => {
    if (!hasScope('VOIP_CALL')) {
      alert('You do not have permission to initiate calls');
      return;
    }

    setIsInitiatingCall(true);
    try {
      await trackUXClick('initiate_call_button', {
        patient_id: patientId,
        source: 'phone_call_panel',
      });

      // Production: POST /call/initiate with idempotency key
      const request: InitiateCallRequest = {
        patient_id: patientId,
        to: patientPhone,
        from: '+1-310-555-0100', // Practice main number
        record: hasScope('VOIP_RECORD'),
        metadata: {
          initiated_by: user?.id,
          initiated_from: 'patient_card',
        },
      };

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await auditLog({
        action: 'initiate_call',
        actor_id: user?.id,
        patient_id: patientId,
        source: 'phone_call_panel',
        metadata: {
          to: patientPhone,
          record: request.record,
        },
      });

      // In production: telephonyGatewayClient.initiateCall(request)
      // Returns call_id, then WebSocket sends call_completed event when done
      alert(`Call initiated to ${patientPhone}\n\nIn production, this would:\n1. Connect to VoIP gateway\n2. Ring patient's phone\n3. Show live call interface\n4. Record if consent given`);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      alert('Failed to initiate call. Please try again.');
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Copy phone number
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(patientPhone);
      setCopiedPhone(true);
      await trackUXClick('copy_phone_number', { patient_id: patientId });
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch (error) {
      console.error('Failed to copy phone number:', error);
    }
  };

  // Handle call click
  const handleCallClick = async (call: CallRecord) => {
    setSelectedCall(call);
    await trackUXClick('call_card_click', {
      patient_id: patientId,
      call_id: call.call_id,
      source: 'phone_call_panel',
    });
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedCall) {
          setSelectedCall(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, selectedCall, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => (selectedCall ? setSelectedCall(null) : onClose())}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{patientName}</h2>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <span>{patientPhone}</span>
                    <button
                      onClick={handleCopyPhone}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      title="Copy phone number"
                    >
                      {copiedPhone ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              {(['all', 'outbound', 'inbound'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    filter === filterType
                      ? 'bg-[#87CEEB] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  )}
                >
                  {filterType === 'all' && 'All Calls'}
                  {filterType === 'outbound' && 'Outbound'}
                  {filterType === 'inbound' && 'Inbound'}
                </button>
              ))}
            </div>

            {/* Call Button */}
            {hasScope('VOIP_CALL') ? (
              <button
                onClick={handleInitiateCall}
                disabled={isInitiatingCall}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitiatingCall ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    Call Now
                  </>
                )}
              </button>
            ) : (
              <div className="text-xs text-gray-500 italic">
                VoIP access required to initiate calls
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredCalls.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <div className="space-y-3">
                {filteredCalls.map((call, index) => (
                  <CallCard
                    key={call.call_id}
                    call={call}
                    onClick={() => handleCallClick(call)}
                    delay={index * 0.05}
                    canViewRecording={hasScope('VOIP_RECORD')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {!isLoading && calls.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{calls.length}</span> total calls
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {calls.filter((c) => c.agent === 'ai').length}
                    </span>{' '}
                    AI-handled
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {calls.filter((c) => c.recording_url).length}
                    </span>{' '}
                    recorded
                  </span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Call Detail Modal */}
        {selectedCall && (
          <CallDetailModal
            call={selectedCall}
            onClose={() => setSelectedCall(null)}
            canViewRecording={hasScope('VOIP_RECORD')}
            patientId={patientId}
          />
        )}
      </div>
    </AnimatePresence>
  );
}

// Call Card Component
function CallCard({
  call,
  onClick,
  delay = 0,
  canViewRecording,
}: {
  call: CallRecord;
  onClick: () => void;
  delay?: number;
  canViewRecording: boolean;
}) {
  const startedAt = parseISO(call.started_at || call.created_at);
  const isRecent = Date.now() - startedAt.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'No answer';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Status badge
  const getStatusBadge = () => {
    switch (call.status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Completed</span>;
      case 'no_answer':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">No Answer</span>;
      case 'busy':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">Busy</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Failed</span>;
      case 'voicemail':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Voicemail</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-[#87CEEB] hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Agent Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            call.agent === 'ai' ? 'bg-sky-100 text-sky-600' : 'bg-purple-100 text-purple-600'
          )}
        >
          {call.agent === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>

        {/* Call Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{call.agent_name}</h4>
                {call.agent === 'ai' && (
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                    AI Agent
                  </span>
                )}
                {isRecent && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Recent
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="capitalize">{call.direction}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatDuration(call.duration_sec)}</span>
                <span>•</span>
                <span>{formatDistance(startedAt, new Date(), { addSuffix: true })}</span>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Summary */}
          {call.summary && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{call.summary}</p>
          )}

          {/* Features */}
          <div className="flex items-center gap-2">
            {call.recording_url && canViewRecording && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                <Volume2 className="w-3 h-3" />
                Recording
              </div>
            )}
            {call.transcript_available && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                <FileText className="w-3 h-3" />
                Transcript
              </div>
            )}
            {!call.consent_to_record && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                <AlertCircle className="w-3 h-3" />
                No consent
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Call Detail Modal
function CallDetailModal({
  call,
  onClose,
  canViewRecording,
  patientId,
}: {
  call: CallRecord;
  onClose: () => void;
  canViewRecording: boolean;
  patientId: string;
}) {
  const { user } = useAuth();
  const [transcript, setTranscript] = useState<CallTranscript | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load transcript
  useEffect(() => {
    if (!call.transcript_available || !isExpanded) return;

    const loadTranscript = async () => {
      setIsLoadingTranscript(true);
      try {
        // Production: GET /calls/{call_id}/transcript
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock transcript
        const mockTranscript: CallTranscript = {
          call_id: call.call_id,
          segments: [
            {
              speaker: 'agent',
              text: "Hi, this is CareLoop AI calling from Dr. Smith's office. May I speak with Sarah Johnson?",
              timestamp_sec: 0,
              timestamp: 0,
              confidence: 0.96,
            },
            {
              speaker: 'patient',
              text: "Yes, this is Sarah.",
              timestamp_sec: 3.5,
              timestamp: 3.5,
              confidence: 0.94,
            },
            {
              speaker: 'agent',
              text: "Great! I'm calling to confirm your upcoming appointment on October 20th at 10 AM for a routine cleaning. Will you be able to make it?",
              timestamp_sec: 5.2,
              timestamp: 5.2,
              confidence: 0.95,
            },
            {
              speaker: 'patient',
              text: "Yes, I'll be there. Do I need to bring anything?",
              timestamp_sec: 12.8,
              timestamp: 12.8,
              confidence: 0.92,
            },
            {
              speaker: 'agent',
              text: "Just your insurance card and photo ID. If you have any questions before your appointment, feel free to call us at 310-555-0100. We look forward to seeing you!",
              timestamp_sec: 16.5,
              timestamp: 16.5,
              confidence: 0.97,
            },
            {
              speaker: 'patient',
              text: "Perfect, thank you!",
              timestamp_sec: 27.2,
              timestamp: 27.2,
              confidence: 0.95,
            },
          ],
          summary: call.summary || '',
          key_points: [
            'Confirmed appointment for October 20th at 10 AM',
            'Patient will bring insurance card and ID',
            'No additional questions or concerns',
          ],
          action_items: [
            'Patient confirmed - no further action needed',
          ],
        };

        setTranscript(mockTranscript);
      } catch (error) {
        console.error('Failed to load transcript:', error);
      } finally {
        setIsLoadingTranscript(false);
      }
    };

    loadTranscript();
  }, [call, isExpanded]);

  // Play recording
  const handlePlayRecording = async () => {
    if (!canViewRecording) {
      alert('You do not have permission to access call recordings');
      return;
    }

    await auditLog({
      action: 'play_recording',
      actor_id: user?.id,
      patient_id: patientId,
      resource_type: 'call',
      resource_id: call.call_id,
      source: 'phone_call_panel',
    });

    // In production: Fetch signed URL and play audio
    alert('In production, this would play the call recording using an audio player component.');
  };

  const startedAt = parseISO(call.started_at || call.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-4 m-auto w-full max-w-2xl h-fit max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Call Details</h3>
          <p className="text-sm text-white/80">{format(startedAt, 'PPpp')}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Agent Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                call.agent === 'ai' ? 'bg-sky-100 text-sky-600' : 'bg-purple-100 text-purple-600'
              )}
            >
              {call.agent === 'ai' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{call.agent_name}</h4>
              <p className="text-sm text-gray-600 capitalize">{call.agent} • {call.direction}</p>
            </div>
          </div>
          {call.summary && (
            <p className="text-sm text-gray-700 leading-relaxed">{call.summary}</p>
          )}
        </div>

        {/* Call Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Duration</div>
            <div className="text-sm font-medium text-gray-900">
              {Math.floor(call.duration_sec / 60)}m {call.duration_sec % 60}s
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className="text-sm font-medium text-gray-900 capitalize">{call.status.replace('_', ' ')}</div>
          </div>
        </div>

        {/* Recording */}
        {call.recording_url && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Call Recording</h4>
              </div>
              {!call.consent_to_record && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                  <AlertCircle className="w-3 h-3" />
                  No consent
                </div>
              )}
            </div>
            {canViewRecording ? (
              <button
                onClick={handlePlayRecording}
                className="w-full px-4 py-2 bg-[#87CEEB] text-white rounded-lg font-medium hover:bg-[#6BA8D9] transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play Recording
              </button>
            ) : (
              <div className="text-sm text-gray-600 italic">
                You do not have permission to access call recordings
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        {call.transcript_available && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Call Transcript</h4>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {isExpanded && (
              <div className="space-y-3">
                {isLoadingTranscript ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : transcript ? (
                  <>
                    {/* Transcript Segments */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {transcript.segments.map((segment, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-3 rounded-lg',
                            segment.speaker === 'agent' ? 'bg-blue-50' : 'bg-gray-100'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-900 uppercase">
                              {segment.speaker}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.floor(segment.timestamp || segment.timestamp_sec)}s
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{segment.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Key Points */}
                    {transcript.key_points && transcript.key_points.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <h5 className="text-xs font-semibold text-gray-700 uppercase mb-2">Key Points</h5>
                        <ul className="space-y-1">
                          {transcript.key_points.map((point, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-[#87CEEB]">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-600 italic">Failed to load transcript</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
        {call.recording_url && canViewRecording && (
          <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 bg-gray-100 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State
function EmptyState({ filter }: { filter: CallFilter }) {
  const getMessage = () => {
    switch (filter) {
      case 'inbound':
        return 'No inbound calls found';
      case 'outbound':
        return 'No outbound calls found';
      default:
        return 'No call history';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Phone className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{getMessage()}</h3>
      <p className="text-sm text-gray-600">Call history will appear here once calls are made</p>
    </div>
  );
}

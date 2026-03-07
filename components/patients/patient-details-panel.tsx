'use client';

import { motion } from 'framer-motion';
import { X, Calendar, FileText, Download, MoreVertical, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import { Patient } from '@/lib/types/patient';
import { cn } from '@/lib/utils';

interface PatientDetailsPanelProps {
  patient: Patient;
  onClose: () => void;
}

type TabType = 'overview' | 'medical' | 'visits' | 'billing';

export function PatientDetailsPanel({ patient, onClose }: PatientDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { firstName, lastName, age, phone, email, insurance, allergies, preMedicationNotes, visits, billing } = patient;
  
  const fullName = `${firstName} ${lastName}`;
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'medical' as TabType, label: 'Medical History' },
    { id: 'visits' as TabType, label: 'Visits' },
    { id: 'billing' as TabType, label: 'Billing' },
  ];

  const maskMemberId = (id: string) => {
    if (id.length <= 4) return id;
    return '••••••' + id.slice(-4);
  };

  const getCoverageBadgeColor = (coverage: number) => {
    if (coverage >= 80) return 'bg-green-500/10 text-green-700';
    if (coverage >= 50) return 'bg-orange-500/10 text-orange-700';
    if (coverage > 0) return 'bg-red-500/10 text-red-700';
    return 'bg-gray-500/10 text-gray-700';
  };

  const getAllergySeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-500/10 text-red-700';
      case 'moderate': return 'bg-orange-500/10 text-orange-700';
      case 'mild': return 'bg-yellow-500/10 text-yellow-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] lg:w-[600px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08)] z-50 flex flex-col"
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 border-b border-[#E5E5E7]">
          <div className="flex items-center justify-between p-6">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 bg-[#0A84FF] hover:bg-[#0077ED] text-white rounded-lg font-medium text-sm transition-colors">
                Book Appointment
              </button>
              <button className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#F5F5F7] transition-colors">
                <MoreVertical className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>
          </div>

          {/* Patient Summary */}
          <div className="px-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-xl font-semibold flex-shrink-0">
                {getInitials(fullName)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-1">{fullName}, {age}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <a href={`tel:${phone}`} className="text-[#0A84FF] hover:underline flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {phone}
                  </a>
                  {email && (
                    <a href={`mailto:${email}`} className="text-[#0A84FF] hover:underline flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-4 px-1 text-sm font-medium border-b-3 whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'border-[#0A84FF] text-[#1D1D1F]'
                    : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="p-6 space-y-6"
          >
            {activeTab === 'overview' && (
              <>
                {/* General Information */}
                <div className="rounded-xl border border-[#E5E5E7] p-4 space-y-3">
                  <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">General Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#86868B]">Full Name</span>
                      <span className="text-sm text-[#1D1D1F] font-medium">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#86868B]">Date of Birth</span>
                      <span className="text-sm text-[#1D1D1F]">{new Date(patient.dateOfBirth).toLocaleDateString()} ({age} years old)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#86868B]">Phone</span>
                      <a href={`tel:${phone}`} className="text-sm text-[#0A84FF] hover:underline">{phone}</a>
                    </div>
                    {email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#86868B]">Email</span>
                        <a href={`mailto:${email}`} className="text-sm text-[#0A84FF] hover:underline">{email}</a>
                      </div>
                    )}
                    {patient.emergencyContact && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#86868B]">Emergency Contact</span>
                        <span className="text-sm text-[#1D1D1F]">
                          {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) - {patient.emergencyContact.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insurance Details */}
                <div className="rounded-xl border border-[#E5E5E7] p-4 space-y-3">
                  <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">Insurance Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868B]">Provider</span>
                      <span className="text-sm text-[#1D1D1F] font-semibold">{insurance.provider}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868B]">Plan</span>
                      <span className="text-sm text-[#1D1D1F]">{insurance.planName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868B]">Coverage</span>
                      <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold', getCoverageBadgeColor(insurance.coveragePercent))}>
                        {insurance.coveragePercent}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868B]">Member ID</span>
                      <span className="text-sm text-[#1D1D1F] font-mono">{maskMemberId(insurance.memberId)}</span>
                    </div>
                    {insurance.groupNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#86868B]">Group Number</span>
                        <span className="text-sm text-[#1D1D1F] font-mono">{insurance.groupNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868B]">Policy Expires</span>
                      <span className="text-sm text-[#1D1D1F]">{new Date(insurance.policyExpiry).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Health Flags */}
                {(allergies.length > 0 || preMedicationNotes) && (
                  <div className="rounded-xl border border-[#E5E5E7] p-4 space-y-3">
                    <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">Health Flags</h3>
                    
                    {allergies.length > 0 && (
                      <div>
                        <p className="text-sm text-[#86868B] mb-2">Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {allergies.map((allergy) => (
                            <span
                              key={allergy.id}
                              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', getAllergySeverityColor(allergy.severity))}
                            >
                              {allergy.allergen} - {allergy.severity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {preMedicationNotes && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs uppercase font-medium text-blue-700 mb-1">Pre-medication Required</p>
                        <p className="text-sm text-[#1D1D1F]">{preMedicationNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'medical' && (
              <>
                {/* Allergies Table */}
                <div className="rounded-xl border border-[#E5E5E7] overflow-hidden">
                  <div className="p-4 border-b border-[#E5E5E7] bg-[#FBFBFB]">
                    <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">Allergies</h3>
                  </div>
                  {allergies.length > 0 ? (
                    <div className="divide-y divide-[#E5E5E7]">
                      {allergies.map((allergy) => (
                        <div key={allergy.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-semibold text-[#1D1D1F]">{allergy.allergen}</span>
                            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium', getAllergySeverityColor(allergy.severity))}>
                              {allergy.severity}
                            </span>
                          </div>
                          {allergy.reaction && (
                            <p className="text-sm text-[#86868B] mb-1">Reaction: {allergy.reaction}</p>
                          )}
                          <p className="text-xs text-[#B0B0B5]">Recorded: {new Date(allergy.dateRecorded).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-[#86868B]">No allergies recorded</div>
                  )}
                </div>

                {/* Pre-medication Notes */}
                {preMedicationNotes && (
                  <div className="rounded-xl border border-[#E5E5E7] p-4">
                    <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide mb-3">Pre-medication Protocol</h3>
                    <p className="text-sm text-[#1D1D1F]">{preMedicationNotes}</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'visits' && (
              <>
                {/* Last Visit Summary */}
                {visits.length > 0 && (
                  <div className="rounded-xl border border-[#0A84FF]/20 bg-[#0A84FF]/5 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[#1D1D1F]">Last Visit</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#86868B]">Date</span>
                        <span className="text-sm text-[#1D1D1F] font-semibold">{new Date(visits[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#86868B]">Provider</span>
                        <span className="text-sm text-[#1D1D1F]">{visits[0].provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#86868B]">Reason</span>
                        <span className="text-sm text-[#1D1D1F]">{visits[0].reason}</span>
                      </div>
                      <div className="pt-2 border-t border-[#0A84FF]/10">
                        <p className="text-xs text-[#86868B] mb-2">Procedures</p>
                        {visits[0].procedures.map((proc, idx) => (
                          <div key={idx} className="flex justify-between text-sm mb-1">
                            <span className="text-[#1D1D1F]">{proc.name} ({proc.code})</span>
                            <span className="text-[#1D1D1F]">${proc.cost}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-[#0A84FF]/10 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#86868B]">Total Cost</span>
                          <span className="text-[#1D1D1F] font-semibold">${visits[0].totalCost}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#86868B]">Insurance Paid</span>
                          <span className="text-green-600">${visits[0].insurancePaid}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#86868B]">Patient Paid</span>
                          <span className="text-[#1D1D1F]">${visits[0].patientPaid}</span>
                        </div>
                      </div>
                      {visits[0].outcome && (
                        <div className="pt-2 border-t border-[#0A84FF]/10">
                          <p className="text-xs text-[#86868B] mb-1">Outcome</p>
                          <p className="text-sm text-[#1D1D1F]">{visits[0].outcome}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Visit History */}
                <div className="rounded-xl border border-[#E5E5E7] overflow-hidden">
                  <div className="p-4 border-b border-[#E5E5E7] bg-[#FBFBFB]">
                    <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">Visit History</h3>
                  </div>
                  {visits.length > 0 ? (
                    <div className="divide-y divide-[#E5E5E7]">
                      {visits.map((visit) => (
                        <div key={visit.id} className="p-4 hover:bg-[#FBFBFB] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-semibold text-[#1D1D1F]">{new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              <p className="text-xs text-[#86868B]">{visit.provider} • {visit.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#1D1D1F]">${visit.totalCost}</p>
                              <p className="text-xs text-[#86868B]">Patient: ${visit.patientPaid}</p>
                            </div>
                          </div>
                          <p className="text-xs text-[#B0B0B5]">
                            {visit.procedures.map(p => p.name).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-[#86868B]">No visits recorded</div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'billing' && (
              <>
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#E5E5E7] p-4">
                    <p className="text-xs uppercase text-[#86868B] mb-2 tracking-wide">Lifetime Spend</p>
                    <p className="text-3xl font-semibold text-[#1D1D1F]">${billing.lifetimeSpend.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-[#E5E5E7] p-4">
                    <p className="text-xs uppercase text-[#86868B] mb-2 tracking-wide">Outstanding Balance</p>
                    <p className={cn('text-3xl font-semibold', billing.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                      ${billing.outstandingBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Coverage Utilization */}
                <div className="rounded-xl border border-[#E5E5E7] p-4 space-y-3">
                  <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">Coverage Utilization</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#86868B]">Annual Maximum</span>
                      <span className="text-[#1D1D1F] font-medium">${insurance.annualMaximum.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#86868B]">Used</span>
                      <span className="text-[#1D1D1F]">${billing.coverageUsed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#86868B]">Remaining</span>
                      <span className="text-[#1D1D1F] font-semibold">${(insurance.annualMaximum - billing.coverageUsed).toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-[#E5E5E7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0A84FF] rounded-full transition-all"
                        style={{ width: `${Math.min((billing.coverageUsed / insurance.annualMaximum) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#86868B] text-right">
                      {Math.round((billing.coverageUsed / insurance.annualMaximum) * 100)}% utilized
                    </p>
                  </div>
                </div>

                {/* Next Payment Due */}
                {billing.nextPaymentDue && (
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                    <h3 className="text-sm font-semibold text-[#1D1D1F] mb-2">Next Payment Due</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868B]">{new Date(billing.nextPaymentDue.date).toLocaleDateString()}</span>
                      <span className="text-lg font-semibold text-orange-700">${billing.nextPaymentDue.amount}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

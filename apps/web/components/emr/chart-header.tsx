'use client';

import React from 'react';
import { AlertTriangle, Calendar, ChevronLeft, Pill, ClipboardList, Plus, ShieldCheck } from 'lucide-react';
import { Chip } from './emr-chips';

export interface ChartHeaderAllergy {
  allergen: string;
  severity: string;
}
export interface ChartHeaderProps {
  name: string;
  patientId: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  allergies: ChartHeaderAllergy[];
  activeProblems: string[];
  activeMedications: string[];
  nextAppointment?: { date?: string; label?: string } | null;
  onBack?: () => void;
  onQuickAdd?: (kind: 'allergy' | 'medication' | 'problem' | 'note') => void;
}

function ageFrom(dob?: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const yrs = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return yrs > 0 && yrs < 130 ? `${yrs}y` : '';
}

const SEVERE = new Set(['severe', 'life_threatening']);

export default function ChartHeader({
  name,
  patientId,
  dateOfBirth,
  gender,
  phone,
  allergies,
  activeProblems,
  activeMedications,
  nextAppointment,
  onBack,
  onQuickAdd,
}: ChartHeaderProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  const hasSevere = allergies.some((a) => SEVERE.has(a.severity));
  const age = ageFrom(dateOfBirth);
  const demo = [age, gender, dateOfBirth ? `DOB ${dateOfBirth}` : '', `#${patientId.slice(0, 8)}`, phone]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <div className="space-y-3">
      {/* Identity row */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#87CEEB] to-[#6BA8D9] flex items-center justify-center text-white font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{name}</h1>
          <p className="text-xs text-gray-500 truncate">{demo}</p>
        </div>

        {/* Quick-add actions */}
        {onQuickAdd && (
          <div className="ml-auto hidden sm:flex items-center gap-1.5">
            <QuickAdd label="Allergy" onClick={() => onQuickAdd('allergy')} />
            <QuickAdd label="Med" onClick={() => onQuickAdd('medication')} />
            <QuickAdd label="Problem" onClick={() => onQuickAdd('problem')} />
            <QuickAdd label="Note" onClick={() => onQuickAdd('note')} />
          </div>
        )}
      </div>

      {/* Allergy / alert safety banner */}
      {allergies.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="font-semibold">NKDA</span>
          <span className="text-emerald-700/80">No known allergies on file</span>
        </div>
      ) : (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            hasSevere
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold uppercase tracking-wide">Allergies</span>
            {allergies.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="font-medium">{a.allergen}</span>
                <span className="opacity-70">({a.severity.replace(/_/g, ' ')})</span>
                {i < allergies.length - 1 && <span className="opacity-40">·</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* At-a-glance summary chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="purple">
          <ClipboardList className="w-3.5 h-3.5" />
          {activeProblems.length} active {activeProblems.length === 1 ? 'problem' : 'problems'}
        </Chip>
        <Chip tone="blue">
          <Pill className="w-3.5 h-3.5" />
          {activeMedications.length} {activeMedications.length === 1 ? 'medication' : 'medications'}
        </Chip>
        {nextAppointment?.date && (
          <Chip tone="green">
            <Calendar className="w-3.5 h-3.5" />
            Next: {nextAppointment.date}
            {nextAppointment.label ? ` · ${nextAppointment.label}` : ''}
          </Chip>
        )}
        {activeProblems.slice(0, 3).map((p) => (
          <Chip key={p} tone="gray">
            {p}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function QuickAdd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-[#87CEEB] hover:text-[#2f6f95] transition-colors"
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

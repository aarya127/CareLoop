import { mockPatients } from '@/lib/data/mock-patients';
import { mockDentalRecords } from '@/lib/data/mock-dental-records';
import fs from 'fs';
import path from 'path';
import type { Document } from './types';
import { buildIndex, saveIndex } from './store';

function doc(id: string, source: Document['source'], text: string, metadata?: Record<string, any>): Document {
  return { id, source, text, metadata };
}

export function collectDocuments(): Document[] {
  const docs: Document[] = [];

  // Patients basic profiles
  for (const p of mockPatients) {
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
    const demographics = [
      fullName,
      p.email,
      p.phone,
      p.address ? `${p.address.street}, ${p.address.city}, ${p.address.state} ${p.address.zip}` : '',
    ].filter(Boolean).join(' | ');
    const insurance = p.insurance ? `${p.insurance.provider} ${p.insurance.planName || ''}` : '';
    const allergyStr = (p.allergies || []).map(a => `${a.allergen} (${a.severity})`).join(', ');
    const preMed = p.preMedicationNotes ? `Pre-med: ${p.preMedicationNotes}` : '';
    const billing = p.billing ? `Lifetime spend ${p.billing.lifetimeSpend}, balance ${p.billing.outstandingBalance}` : '';
    const text = [demographics, insurance, allergyStr, preMed, billing].filter(Boolean).join(' \n ');
    docs.push(doc(`patient:${p.id}`, 'patients', text, { type: 'patient', id: p.id }));

    // visits
    for (const v of p.visits || []) {
      const procs = (v.procedures || []).map(pr => `${pr.code} ${pr.name} $${pr.cost}`).join('; ');
      const vt = `Visit on ${v.date} with ${v.provider} for ${v.reason}. Procedures: ${procs}. Outcome: ${v.outcome ?? ''}. Notes: ${v.notes ?? ''}. Payments: total ${v.totalCost}, insurance ${v.insurancePaid}, patient ${v.patientPaid}.`;
      docs.push(doc(`patient:${p.id}:visit:${v.id}`, 'patients', vt, { type: 'visit', patientId: p.id, visitId: v.id }));
    }
  }

  // Dental records
  for (const [pid, rec] of Object.entries(mockDentalRecords)) {
    const header = `${rec.first_name} ${rec.last_name} (${rec.patient_id}) age ${rec.age}, insurance ${rec.insurance?.provider_name}, dentist ${rec.preferences?.preferred_dentist_name}`;
    const fin = rec.financial ? `Spent ${rec.financial.total_lifetime_spent}, balance ${rec.financial.outstanding_balance}, avg visit ${rec.financial.average_visit_cost}` : '';
    const nextApt = rec.next_appointment ? `Next appointment ${rec.next_appointment.date} ${rec.next_appointment.time} for ${rec.next_appointment.procedure_type} with ${rec.next_appointment.dentist_name}` : '';
    const text = [header, fin, nextApt].filter(Boolean).join(' \n ');
    docs.push(doc(`drec:${pid}`, 'dental-records', text, { type: 'dental-record', patientId: pid }));

    for (const xr of rec.radiographic_records || []) {
      const issues = (xr.ai_analysis?.detected_issues || []).map(i => `${i.type} at ${i.location} (conf ${i.confidence_score})`).join('; ');
      const xrtext = `XRay ${xr.id} type ${xr.type} on ${xr.date_taken}. Notes: ${xr.dentist_notes}. AI: ${xr.ai_analysis?.summary}. Issues: ${issues}`;
      docs.push(doc(`drec:${pid}:xray:${xr.id}`, 'images', xrtext, { type: 'xray', patientId: pid, xrayId: xr.id }));
    }
  }

  // Optional: External dental image dataset (e.g., "/Users/you/Desktop/dental rec")
  const extDir = process.env.DENTAL_REC_DIR;
  if (extDir && fs.existsSync(extDir)) {
    const exts = new Set(['.jpg', '.jpeg', '.png', '.bmp']);
    const walk = (p: string) => {
      for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
        const full = path.join(p, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (exts.has(ext)) {
            const rel = full.replace(extDir, '').replaceAll('\\', '/');
            const label = rel.split('/').filter(Boolean).slice(0, -1).join(' ');
            const text = `Dental image ${entry.name} ${label ? `labels: ${label}` : ''} path: ${rel}`.trim();
            docs.push(doc(`image:${rel}`, 'images', text, { path: full, labels: label }));
          }
        }
      }
    };
    walk(extDir);
  }

  return docs;
}

export function buildAndSaveIndex() {
  const docs = collectDocuments();
  const index = buildIndex(docs);
  saveIndex(index);
  return { count: index.docCount };
}

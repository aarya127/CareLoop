'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { intakeApi } from '@/lib/api/intake';
import type { IntakeDraft } from '@/types/intake';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ id: string }>;
}

function SectionRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2 py-2 border-b last:border-0">
      <span className="text-muted-foreground text-sm w-40 shrink-0">{label}</span>
      <span className="text-sm">{value || <span className="text-muted-foreground/60 italic">—</span>}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-5 mb-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function ReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [draft, setDraft] = useState<IntakeDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    intakeApi.getDraft(id).then(setDraft).catch(() => router.replace('/intake'));
  }, [id, router]);

  async function handleSubmit() {
    // Stable idempotency key: store in sessionStorage so refresh replays safely
    const storageKey = `intake-ikey-${id}`;
    let ikey = sessionStorage.getItem(storageKey);
    if (!ikey) {
      ikey = crypto.randomUUID();
      sessionStorage.setItem(storageKey, ikey);
    }

    setSubmitting(true);
    setError(null);
    try {
      await intakeApi.submitDraft(id, ikey);
      router.push(`/intake/${id}/success`);
    } catch (err: any) {
      setError(err?.message ?? 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }

  if (!draft) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>
      </main>
    );
  }

  const { demographics: d, emergencyContact: ec, insurance: ins, notes } = draft.data;

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Review Your Information</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Please check your details before submitting.
        </p>
      </div>

      <Section title="Demographics">
        <SectionRow label="First Name" value={d?.firstName} />
        <SectionRow label="Last Name" value={d?.lastName} />
        <SectionRow label="Date of Birth" value={d?.dateOfBirth} />
        <SectionRow label="Email" value={d?.email} />
        <SectionRow label="Phone" value={d?.phone} />
        <SectionRow
          label="Address"
          value={[d?.address?.street, d?.address?.city, d?.address?.state, d?.address?.zip]
            .filter(Boolean)
            .join(', ')}
        />
      </Section>

      <Section title="Emergency Contact">
        <SectionRow label="Name" value={ec?.name} />
        <SectionRow label="Relationship" value={ec?.relationship} />
        <SectionRow label="Phone" value={ec?.phone} />
      </Section>

      <Section title="Insurance">
        {ins?.payerName ? (
          <>
            <SectionRow label="Payer" value={ins?.payerName} />
            <SectionRow label="Plan" value={ins?.planName} />
            <SectionRow label="Member ID" value={ins?.memberId} />
            <SectionRow label="Group Number" value={ins?.groupNumber} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">No insurance provided.</p>
        )}
      </Section>

      {notes && (
        <Section title="Notes">
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        </Section>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
          Edit
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Intake Form'}
        </Button>
      </div>
    </main>
  );
}

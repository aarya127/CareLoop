'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { intakeApi } from '@/lib/api/intake';
import type { IntakeDraft, IntakeDraftData, DemographicsData, EmergencyContactData, InsuranceData } from '@/types/intake';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Helpers ─────────────────────────────────────────────────────────────────

const STEPS = ['Demographics', 'Emergency Contact', 'Insurance', 'Notes'] as const;
type Step = 0 | 1 | 2 | 3;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-destructive text-xs mt-1">{msg}</p>;
}

// ── Per-step validation ──────────────────────────────────────────────────────

function validateDemographics(d: DemographicsData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!d.firstName?.trim()) errors.firstName = 'First name is required';
  if (!d.lastName?.trim()) errors.lastName = 'Last name is required';
  if (!d.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
  if (!d.email?.trim() && !d.phone?.trim()) {
    errors.email = 'Provide email or phone';
    errors.phone = 'Provide email or phone';
  }
  return errors;
}

function validateEmergencyContact(_ec: EmergencyContactData): Record<string, string> {
  // optional section — no hard requirements
  return {};
}

function validateInsurance(ins: InsuranceData): Record<string, string> {
  const errors: Record<string, string> = {};
  const hasAny = ins.payerName || ins.memberId || ins.planName || ins.groupNumber;
  if (hasAny) {
    if (!ins.payerName?.trim()) errors.payerName = 'Payer name is required';
    if (!ins.memberId?.trim()) errors.memberId = 'Member ID is required';
  }
  return errors;
}

// ── Form sections ────────────────────────────────────────────────────────────

function DemographicsSection({
  data,
  errors,
  onChange,
}: {
  data: DemographicsData;
  errors: Record<string, string>;
  onChange: (d: DemographicsData) => void;
}) {
  const set = (key: keyof DemographicsData, val: string) =>
    onChange({ ...data, [key]: val });
  const setAddr = (key: string, val: string) =>
    onChange({ ...data, address: { ...data.address, [key]: val } });

  return (
    <FieldGroup>
      <Row>
        <div>
          <Label required>First Name</Label>
          <Input value={data.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" />
          <ErrorMsg msg={errors.firstName} />
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input value={data.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} placeholder="Smith" />
          <ErrorMsg msg={errors.lastName} />
        </div>
      </Row>
      <div>
        <Label required>Date of Birth</Label>
        <Input type="date" value={data.dateOfBirth ?? ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
        <ErrorMsg msg={errors.dateOfBirth} />
      </div>
      <Row>
        <div>
          <Label>Email</Label>
          <Input type="email" value={data.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" />
          <ErrorMsg msg={errors.email} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input type="tel" value={data.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
          <ErrorMsg msg={errors.phone} />
        </div>
      </Row>
      <div>
        <Label>Street Address</Label>
        <Input value={data.address?.street ?? ''} onChange={(e) => setAddr('street', e.target.value)} placeholder="123 Main St" />
      </div>
      <Row>
        <div>
          <Label>City</Label>
          <Input value={data.address?.city ?? ''} onChange={(e) => setAddr('city', e.target.value)} />
        </div>
        <div>
          <Label>State</Label>
          <Input value={data.address?.state ?? ''} onChange={(e) => setAddr('state', e.target.value)} maxLength={2} placeholder="NY" />
        </div>
      </Row>
      <div className="w-1/2">
        <Label>ZIP Code</Label>
        <Input value={data.address?.zip ?? ''} onChange={(e) => setAddr('zip', e.target.value)} placeholder="10001" />
      </div>
    </FieldGroup>
  );
}

function EmergencyContactSection({
  data,
  errors,
  onChange,
}: {
  data: EmergencyContactData;
  errors: Record<string, string>;
  onChange: (d: EmergencyContactData) => void;
}) {
  const set = (key: keyof EmergencyContactData, val: string) =>
    onChange({ ...data, [key]: val });

  return (
    <FieldGroup>
      <div>
        <Label>Full Name</Label>
        <Input value={data.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="John Smith" />
        <ErrorMsg msg={errors.name} />
      </div>
      <Row>
        <div>
          <Label>Relationship</Label>
          <Input value={data.relationship ?? ''} onChange={(e) => set('relationship', e.target.value)} placeholder="Spouse, Parent, Friend…" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input type="tel" value={data.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
          <ErrorMsg msg={errors.phone} />
        </div>
      </Row>
    </FieldGroup>
  );
}

function InsuranceSection({
  data,
  errors,
  onChange,
}: {
  data: InsuranceData;
  errors: Record<string, string>;
  onChange: (d: InsuranceData) => void;
}) {
  const set = (key: keyof InsuranceData, val: string) =>
    onChange({ ...data, [key]: val });

  return (
    <FieldGroup>
      <Row>
        <div>
          <Label>Insurance Company (Payer)</Label>
          <Input value={data.payerName ?? ''} onChange={(e) => set('payerName', e.target.value)} placeholder="Blue Cross Blue Shield" />
          <ErrorMsg msg={errors.payerName} />
        </div>
        <div>
          <Label>Plan Name</Label>
          <Input value={data.planName ?? ''} onChange={(e) => set('planName', e.target.value)} placeholder="PPO Gold" />
        </div>
      </Row>
      <Row>
        <div>
          <Label>Member ID</Label>
          <Input value={data.memberId ?? ''} onChange={(e) => set('memberId', e.target.value)} placeholder="XYZ123456" />
          <ErrorMsg msg={errors.memberId} />
        </div>
        <div>
          <Label>Group Number</Label>
          <Input value={data.groupNumber ?? ''} onChange={(e) => set('groupNumber', e.target.value)} placeholder="GRP987" />
        </div>
      </Row>
      <p className="text-xs text-muted-foreground">
        Leave this section blank if you do not have dental insurance.
      </p>
    </FieldGroup>
  );
}

function NotesSection({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (n: string) => void;
}) {
  return (
    <FieldGroup>
      <div>
        <Label>Additional Notes</Label>
        <textarea
          className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Allergies, special needs, questions for your provider…"
        />
      </div>
    </FieldGroup>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default function IntakeFormPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [draft, setDraft] = useState<IntakeDraft | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Local form state — each section's data
  const [demographics, setDemographics] = useState<DemographicsData>({});
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactData>({});
  const [insurance, setInsurance] = useState<InsuranceData>({});
  const [notes, setNotes] = useState('');

  // Load draft on mount
  useEffect(() => {
    intakeApi.getDraft(id).then((d) => {
      setDraft(d);
      const data: IntakeDraftData = d.data ?? {};
      if (data.demographics) setDemographics(data.demographics);
      if (data.emergencyContact) setEmergencyContact(data.emergencyContact);
      if (data.insurance) setInsurance(data.insurance);
      if (data.notes) setNotes(data.notes);
      // Redirect if already submitted
      if (d.status === 'submitted') router.replace(`/intake/${id}/success`);
    });
  }, [id, router]);

  // Auto-save current section to the draft
  const saveSection = useCallback(
    async (sectionData: Partial<IntakeDraftData>) => {
      setSaving(true);
      try {
        const updated = await intakeApi.updateDraft(id, sectionData);
        setDraft(updated);
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  function validateStep(): boolean {
    let errs: Record<string, string> = {};
    if (step === 0) errs = validateDemographics(demographics);
    if (step === 1) errs = validateEmergencyContact(emergencyContact);
    if (step === 2) errs = validateInsurance(insurance);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validateStep()) return;

    // Save the current section
    const payload: Partial<IntakeDraftData> =
      step === 0 ? { demographics }
      : step === 1 ? { emergencyContact }
      : step === 2 ? { insurance }
      : { notes };
    await saveSection(payload);

    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      setErrors({});
    } else {
      // Last step — go to review page
      router.push(`/intake/${id}/review`);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => (s - 1) as Step);
      setErrors({});
    }
  }

  if (!draft) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm animate-pulse">Loading form…</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">New Patient Intake</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Section */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold mb-5">{STEPS[step]}</h2>

        {step === 0 && (
          <DemographicsSection
            data={demographics}
            errors={errors}
            onChange={setDemographics}
          />
        )}
        {step === 1 && (
          <EmergencyContactSection
            data={emergencyContact}
            errors={errors}
            onChange={setEmergencyContact}
          />
        )}
        {step === 2 && (
          <InsuranceSection
            data={insurance}
            errors={errors}
            onChange={setInsurance}
          />
        )}
        {step === 3 && (
          <NotesSection notes={notes} onChange={setNotes} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
          <Button onClick={handleNext}>
            {step < STEPS.length - 1 ? 'Continue' : 'Review'}
          </Button>
        </div>
      </div>
    </main>
  );
}

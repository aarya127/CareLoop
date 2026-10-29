// Static reference data for the synthetic demo practice. Every person, phone
// number, email address and identifier here is fictional:
//   - phone numbers use the 555-01xx block reserved for fiction
//   - email addresses use example.com (RFC 2606, never deliverable)
//   - member/group ids are prefixed DEMO

export type Gender = 'female' | 'male';

export const FIRST_NAMES: ReadonlyArray<readonly [string, Gender]> = [
  ['Olivia', 'female'],
  ['Liam', 'male'],
  ['Emma', 'female'],
  ['Noah', 'male'],
  ['Charlotte', 'female'],
  ['Lucas', 'male'],
  ['Amelia', 'female'],
  ['Benjamin', 'male'],
  ['Sophie', 'female'],
  ['Ethan', 'male'],
  ['Chloé', 'female'],
  ['Mateo', 'male'],
  ['Mei', 'female'],
  ['Arjun', 'male'],
  ['Fatima', 'female'],
  ['Wei', 'male'],
  ['Isabella', 'female'],
  ['Omar', 'male'],
  ['Grace', 'female'],
  ['Gabriel', 'male'],
  ['Hannah', 'female'],
  ['Samuel', 'male'],
  ['Leah', 'female'],
  ['Theo', 'male'],
  ['Zoe', 'female'],
  ['Jacob', 'male'],
  ['Nadia', 'female'],
  ['Owen', 'male'],
  ['Ana', 'female'],
  ['Hiroshi', 'male'],
  ['Yasmin', 'female'],
  ['Marcus', 'male'],
  ['Keira', 'female'],
  ['Felix', 'male'],
  ['Maya', 'female'],
  ['Rohan', 'male'],
  ['Aisha', 'female'],
  ['Kwame', 'male'],
  ['Elise', 'female'],
  ['Mathis', 'male'],
];

export const LAST_NAMES: readonly string[] = [
  'Tremblay',
  'Gagnon',
  'Bouchard',
  'Côté',
  'Lavoie',
  'Fortin',
  'Morin',
  'Gauthier',
  'Wilson',
  'Thompson',
  'Campbell',
  'MacDonald',
  'Stewart',
  'Anderson',
  'Nguyen',
  'Chen',
  'Wong',
  'Patel',
  'Singh',
  'Khan',
  'Rodriguez',
  'Silva',
  'Kowalski',
  'Novak',
  'Rossi',
  'Murphy',
  "O'Brien",
  'Clarke',
  'Mensah',
  'Haddad',
  'Yamamoto',
  'Kim',
  'Park',
  'Petrov',
  'Fischer',
  'Lindqvist',
  'Okafor',
  'Ramos',
  'Dubois',
  'Hughes',
];

export const STREET_NAMES = [
  'Maple',
  'Cedar',
  'Willow',
  'Birch',
  'Elm',
  'Juniper',
  'Aspen',
  'Spruce',
];
export const STREET_TYPES = ['Street', 'Avenue', 'Crescent', 'Drive', 'Court', 'Lane'];
export const CITIES = [
  'Toronto',
  'North York',
  'Etobicoke',
  'Scarborough',
  'Mississauga',
  'Markham',
];
export const RELATIONSHIPS = ['Spouse', 'Partner', 'Parent', 'Sibling', 'Friend'];
export const LANGUAGES: ReadonlyArray<readonly [string, number]> = [
  ['English', 8],
  ['French', 2],
  ['Mandarin', 1],
  ['Punjabi', 1],
];

/** Strip accents and punctuation so names make valid example.com addresses. */
export function emailFor(first: string, last: string): string {
  const clean = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();
  return `${clean(first)}.${clean(last)}@example.com`;
}

// ── Staff & providers ──────────────────────────────────────────────────────────

export interface DemoUserDef {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff';
  /** Only this account can sign in; every other demo user has no password. */
  canSignIn: boolean;
}

export const DEMO_USERS: readonly DemoUserDef[] = [
  {
    id: 'user-dev',
    email: 'demo@careloop.dev',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'admin',
    canSignIn: true,
  },
  {
    id: 'user-admin',
    email: 'admin@careloop.demo',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'manager',
    canSignIn: false,
  },
  {
    id: 'user-doctor',
    email: 'doctor@careloop.demo',
    firstName: 'Elena',
    lastName: 'Marchetti',
    role: 'staff',
    canSignIn: false,
  },
  {
    id: 'user-dentist2',
    email: 'dentist2@careloop.demo',
    firstName: 'Daniel',
    lastName: 'Okonkwo',
    role: 'staff',
    canSignIn: false,
  },
  {
    id: 'user-hygienist',
    email: 'hygienist@careloop.demo',
    firstName: 'Jordan',
    lastName: 'Lee',
    role: 'staff',
    canSignIn: false,
  },
  {
    id: 'user-receptionist',
    email: 'receptionist@careloop.demo',
    firstName: 'Sam',
    lastName: 'Okafor',
    role: 'staff',
    canSignIn: false,
  },
];

export type ProviderKind = 'dentist' | 'hygienist';

export interface ProviderDef {
  id: string;
  name: string;
  specialty: string;
  license: string;
  kind: ProviderKind;
  /** The staff user who signs this provider's clinical notes. */
  userId: string;
  roomId: string;
}

export const ROOMS = [
  { id: 'demo-room-1', name: 'Operatory 1' },
  { id: 'demo-room-2', name: 'Operatory 2' },
  { id: 'demo-room-3', name: 'Hygiene Room' },
] as const;

export const PROVIDERS: readonly ProviderDef[] = [
  {
    id: 'demo-prov-marchetti',
    name: 'Dr. Elena Marchetti',
    specialty: 'General Dentistry',
    license: 'DEMO-RCDSO-10412',
    kind: 'dentist',
    userId: 'user-doctor',
    roomId: 'demo-room-1',
  },
  {
    id: 'demo-prov-okonkwo',
    name: 'Dr. Daniel Okonkwo',
    specialty: 'Restorative & Endodontics',
    license: 'DEMO-RCDSO-11877',
    kind: 'dentist',
    userId: 'user-dentist2',
    roomId: 'demo-room-2',
  },
  {
    id: 'demo-prov-lee',
    name: 'Jordan Lee, RDH',
    specialty: 'Dental Hygiene',
    license: 'DEMO-CDHO-20931',
    kind: 'hygienist',
    userId: 'user-hygienist',
    roomId: 'demo-room-3',
  },
];

// ── Procedures & visit types (CDT codes, fees in CAD cents) ───────────────────

export type CoverageCategory = 'preventive' | 'basic' | 'major';

export interface FeeLine {
  code: string;
  description: string;
  feeCents: number;
  category: CoverageCategory;
  qty?: number;
  /** Line applies to the visit's tooth. */
  perTooth?: boolean;
}

export type VisitKey =
  | 'new_patient'
  | 'recall'
  | 'child_recall'
  | 'filling'
  | 'crown_prep'
  | 'crown_seat'
  | 'root_canal'
  | 'extraction'
  | 'emergency'
  | 'srp'
  | 'perio_maint';

export interface VisitType {
  key: VisitKey;
  label: string;
  minutes: number;
  kind: ProviderKind;
  encounterType: 'exam' | 'cleaning' | 'consult' | 'procedure' | 'followup';
  lines: FeeLine[];
}

export const VISIT_TYPES: Record<VisitKey, VisitType> = {
  new_patient: {
    key: 'new_patient',
    label: 'New patient exam',
    minutes: 60,
    kind: 'dentist',
    encounterType: 'exam',
    lines: [
      {
        code: 'D0150',
        description: 'Comprehensive oral evaluation',
        feeCents: 12_500,
        category: 'preventive',
      },
      {
        code: 'D0210',
        description: 'Intraoral complete series of radiographs',
        feeCents: 15_000,
        category: 'preventive',
      },
    ],
  },
  recall: {
    key: 'recall',
    label: 'Recall exam & cleaning',
    minutes: 60,
    kind: 'hygienist',
    encounterType: 'cleaning',
    lines: [
      {
        code: 'D0120',
        description: 'Periodic oral evaluation',
        feeCents: 5_500,
        category: 'preventive',
      },
      {
        code: 'D1110',
        description: 'Prophylaxis — adult',
        feeCents: 13_000,
        category: 'preventive',
      },
      {
        code: 'D0274',
        description: 'Bitewings — four radiographic images',
        feeCents: 7_000,
        category: 'preventive',
      },
    ],
  },
  child_recall: {
    key: 'child_recall',
    label: 'Child recall & fluoride',
    minutes: 45,
    kind: 'hygienist',
    encounterType: 'cleaning',
    lines: [
      {
        code: 'D0120',
        description: 'Periodic oral evaluation',
        feeCents: 5_500,
        category: 'preventive',
      },
      {
        code: 'D1120',
        description: 'Prophylaxis — child',
        feeCents: 8_500,
        category: 'preventive',
      },
      {
        code: 'D1206',
        description: 'Topical application of fluoride varnish',
        feeCents: 3_500,
        category: 'preventive',
      },
    ],
  },
  filling: {
    key: 'filling',
    label: 'Composite filling',
    minutes: 60,
    kind: 'dentist',
    encounterType: 'procedure',
    lines: [
      {
        code: 'D2392',
        description: 'Resin-based composite — two surfaces, posterior',
        feeCents: 26_500,
        category: 'basic',
        perTooth: true,
      },
    ],
  },
  crown_prep: {
    key: 'crown_prep',
    label: 'Crown preparation',
    minutes: 90,
    kind: 'dentist',
    encounterType: 'procedure',
    lines: [
      {
        code: 'D2740',
        description: 'Crown — porcelain/ceramic',
        feeCents: 125_000,
        category: 'major',
        perTooth: true,
      },
    ],
  },
  crown_seat: {
    key: 'crown_seat',
    label: 'Crown seat',
    minutes: 30,
    kind: 'dentist',
    encounterType: 'followup',
    lines: [],
  },
  root_canal: {
    key: 'root_canal',
    label: 'Root canal therapy',
    minutes: 90,
    kind: 'dentist',
    encounterType: 'procedure',
    lines: [
      {
        code: 'D3330',
        description: 'Endodontic therapy — molar',
        feeCents: 115_000,
        category: 'basic',
        perTooth: true,
      },
    ],
  },
  extraction: {
    key: 'extraction',
    label: 'Extraction',
    minutes: 45,
    kind: 'dentist',
    encounterType: 'procedure',
    lines: [
      {
        code: 'D7140',
        description: 'Extraction, erupted tooth',
        feeCents: 22_500,
        category: 'basic',
        perTooth: true,
      },
    ],
  },
  emergency: {
    key: 'emergency',
    label: 'Emergency exam',
    minutes: 30,
    kind: 'dentist',
    encounterType: 'consult',
    lines: [
      {
        code: 'D0140',
        description: 'Limited oral evaluation — problem focused',
        feeCents: 8_500,
        category: 'preventive',
      },
      {
        code: 'D0220',
        description: 'Periapical radiograph — first image',
        feeCents: 3_500,
        category: 'preventive',
      },
    ],
  },
  srp: {
    key: 'srp',
    label: 'Scaling & root planing',
    minutes: 90,
    kind: 'hygienist',
    encounterType: 'procedure',
    lines: [
      {
        code: 'D4341',
        description: 'Periodontal scaling and root planing — per quadrant',
        feeCents: 28_000,
        category: 'basic',
        qty: 2,
      },
    ],
  },
  perio_maint: {
    key: 'perio_maint',
    label: 'Periodontal maintenance',
    minutes: 60,
    kind: 'hygienist',
    encounterType: 'cleaning',
    lines: [
      {
        code: 'D4910',
        description: 'Periodontal maintenance',
        feeCents: 18_500,
        category: 'basic',
      },
    ],
  },
};

// ── Insurance (Canadian group benefit carriers; ids are fictional) ────────────

export const INSURERS = [
  { payerName: 'Sun Life', plans: ['Group Dental — Standard', 'Group Dental — Enhanced'] },
  { payerName: 'Manulife', plans: ['Group Benefits — Dental', 'FlexCare Dental'] },
  { payerName: 'Canada Life', plans: ['Group Dental'] },
  { payerName: 'Green Shield Canada', plans: ['Dental Plus'] },
  { payerName: 'Ontario Blue Cross', plans: ['Individual Dental'] },
  { payerName: 'Desjardins Insurance', plans: ['Group Dental'] },
] as const;

export const COVERAGE_TIERS = [
  { preventivePct: 100, basicPct: 80, majorPct: 50, annualMaximumCents: 150_000 },
  { preventivePct: 90, basicPct: 80, majorPct: 50, annualMaximumCents: 200_000 },
  { preventivePct: 100, basicPct: 70, majorPct: 50, annualMaximumCents: 125_000 },
] as const;

// ── Medical history ───────────────────────────────────────────────────────────

export const ALLERGIES: ReadonlyArray<{
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string;
  weight: number;
}> = [
  { allergen: 'Penicillin', severity: 'severe', reaction: 'Hives and facial swelling', weight: 5 },
  { allergen: 'Latex', severity: 'moderate', reaction: 'Contact dermatitis', weight: 3 },
  { allergen: 'Codeine', severity: 'moderate', reaction: 'Nausea and vomiting', weight: 2 },
  { allergen: 'Sulfonamides', severity: 'mild', reaction: 'Skin rash', weight: 2 },
  { allergen: 'Ibuprofen', severity: 'moderate', reaction: 'Wheezing', weight: 1 },
  { allergen: 'Chlorhexidine', severity: 'life_threatening', reaction: 'Anaphylaxis', weight: 1 },
];

export interface ConditionDef {
  name: string;
  code: string;
  status: 'active' | 'chronic';
  medication?: { name: string; dosage: string; frequency: string; route: string };
  /** Note a clinician would want to see before treatment. */
  dentalNote?: string;
  minAge: number;
}

export const CONDITIONS: readonly ConditionDef[] = [
  {
    name: 'Hypertension',
    code: 'I10',
    status: 'chronic',
    medication: { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', route: 'oral' },
    dentalNote: 'Check blood pressure before procedures; limit epinephrine.',
    minAge: 35,
  },
  {
    name: 'Type 2 diabetes mellitus',
    code: 'E11.9',
    status: 'chronic',
    medication: { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', route: 'oral' },
    dentalNote: 'Higher periodontal risk; schedule morning appointments after breakfast.',
    minAge: 35,
  },
  {
    name: 'Hypercholesterolemia',
    code: 'E78.5',
    status: 'chronic',
    medication: {
      name: 'Atorvastatin',
      dosage: '20 mg',
      frequency: 'Once daily at bedtime',
      route: 'oral',
    },
    minAge: 40,
  },
  {
    name: 'Hypothyroidism',
    code: 'E03.9',
    status: 'chronic',
    medication: { name: 'Levothyroxine', dosage: '75 mcg', frequency: 'Once daily', route: 'oral' },
    minAge: 25,
  },
  {
    name: 'Asthma',
    code: 'J45.909',
    status: 'active',
    medication: {
      name: 'Salbutamol inhaler',
      dosage: '100 mcg',
      frequency: 'As needed',
      route: 'inhaled',
    },
    dentalNote: 'Ask patient to bring inhaler to appointments.',
    minAge: 6,
  },
  {
    name: 'Gastroesophageal reflux disease',
    code: 'K21.9',
    status: 'active',
    medication: { name: 'Pantoprazole', dosage: '40 mg', frequency: 'Once daily', route: 'oral' },
    dentalNote: 'Monitor for acid erosion.',
    minAge: 25,
  },
  {
    name: 'Generalized anxiety disorder',
    code: 'F41.1',
    status: 'active',
    medication: { name: 'Sertraline', dosage: '50 mg', frequency: 'Once daily', route: 'oral' },
    minAge: 18,
  },
  {
    name: 'Atrial fibrillation',
    code: 'I48.91',
    status: 'chronic',
    medication: { name: 'Apixaban', dosage: '5 mg', frequency: 'Twice daily', route: 'oral' },
    dentalNote: 'On anticoagulant — consult physician before extractions.',
    minAge: 55,
  },
  {
    name: 'Osteoporosis',
    code: 'M81.0',
    status: 'chronic',
    medication: { name: 'Alendronate', dosage: '70 mg', frequency: 'Once weekly', route: 'oral' },
    dentalNote: 'Bisphosphonate therapy — assess MRONJ risk before extractions.',
    minAge: 55,
  },
  {
    name: 'Seasonal allergic rhinitis',
    code: 'J30.2',
    status: 'active',
    medication: { name: 'Cetirizine', dosage: '10 mg', frequency: 'As needed', route: 'oral' },
    minAge: 6,
  },
];

export const SURGERIES = [
  'Appendectomy',
  'Tonsillectomy',
  'Wisdom tooth extraction',
  'Knee arthroscopy',
  'Caesarean section',
  'Laparoscopic cholecystectomy',
  'ACL reconstruction',
];

export const FAMILY_CONDITIONS = [
  'Type 2 diabetes',
  'Heart disease',
  'Periodontal disease',
  'Hypertension',
  'Breast cancer',
  'Osteoporosis',
];

// ── Clinical notes ────────────────────────────────────────────────────────────

export interface SoapNote {
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface NoteContext {
  tooth?: number;
  decayFound?: number[];
  perioStage?: 'healthy' | 'gingivitis' | 'periodontitis';
  anxious: boolean;
}

const teethList = (teeth: number[]) => teeth.map((t) => `#${t}`).join(', ');

export function soapFor(visit: VisitKey, ctx: NoteContext): SoapNote {
  const t = ctx.tooth ? `#${ctx.tooth}` : '';
  const decay = ctx.decayFound?.length
    ? `Caries noted on ${teethList(ctx.decayFound)}.`
    : 'No new caries detected.';
  const gums =
    ctx.perioStage === 'periodontitis'
      ? 'Generalized 4–5 mm pockets with bleeding on probing.'
      : ctx.perioStage === 'gingivitis'
        ? 'Localized marginal gingivitis, bleeding on probing at several sites.'
        : 'Gingiva pink and firm, no bleeding on probing.';
  const anxiety = ctx.anxious
    ? ' Patient reports dental anxiety; procedure explained step by step.'
    : '';

  switch (visit) {
    case 'new_patient':
      return {
        chiefComplaint: 'New patient — establish care',
        subjective: `Patient presents to establish care. Last dental visit over a year ago.${anxiety}`,
        objective: `Full-mouth radiographs taken. ${gums} ${decay}`,
        assessment: ctx.decayFound?.length
          ? 'Caries present; otherwise stable dentition.'
          : 'Stable dentition.',
        plan: ctx.decayFound?.length
          ? `Treatment plan presented for ${teethList(ctx.decayFound)}. Recall in 6 months.`
          : 'Recall exam and cleaning in 6 months.',
      };
    case 'recall':
    case 'child_recall':
      return {
        chiefComplaint: 'Routine recall',
        subjective: `No complaints. Brushing twice daily, flossing occasionally.${anxiety}`,
        objective: `Prophylaxis completed. Light calculus removed. ${gums} ${decay}`,
        assessment: ctx.decayFound?.length
          ? 'Caries requiring restoration.'
          : 'Healthy, caries-free.',
        plan: ctx.decayFound?.length
          ? `Book restorative appointment for ${teethList(ctx.decayFound)}. Recall in 6 months.`
          : 'Continue home care. Recall in 6 months.',
      };
    case 'filling':
      return {
        chiefComplaint: `Restoration ${t}`,
        subjective: `Patient returns for planned restoration on ${t}.${anxiety}`,
        objective: `Local anaesthetic administered (2% lidocaine, 1:100k epi). Caries removed on ${t}; MO composite placed and polished. Occlusion checked.`,
        assessment: `${t} restored.`,
        plan: 'Post-operative sensitivity instructions given. Review at next recall.',
      };
    case 'crown_prep':
      return {
        chiefComplaint: `Crown preparation ${t}`,
        subjective: `Large failing restoration on ${t}; patient accepted crown.`,
        objective: `${t} prepared for full-coverage ceramic crown. Digital impression taken; temporary crown cemented.`,
        assessment: 'Crown preparation completed.',
        plan: 'Seat final crown in 2–3 weeks.',
      };
    case 'crown_seat':
      return {
        chiefComplaint: `Crown seat ${t}`,
        subjective: 'No issues with temporary crown.',
        objective: `Temporary removed. Final ceramic crown on ${t} tried in, margins and contacts verified, cemented.`,
        assessment: `${t} crown delivered.`,
        plan: 'Review at next recall.',
      };
    case 'root_canal':
      return {
        chiefComplaint: `Root canal ${t}`,
        subjective: `Lingering cold sensitivity and spontaneous pain on ${t}.${anxiety}`,
        objective: `Irreversible pulpitis confirmed. Rubber dam isolation. Canals located, cleaned, shaped and obturated on ${t}.`,
        assessment: `Endodontic therapy completed on ${t}.`,
        plan: 'Full-coverage crown recommended. Ibuprofen as needed for 2–3 days.',
      };
    case 'extraction':
      return {
        chiefComplaint: `Extraction ${t}`,
        subjective: `Non-restorable ${t}; extraction discussed and consented.`,
        objective: `${t} extracted atraumatically under local anaesthetic. Haemostasis achieved.`,
        assessment: `${t} removed without complication.`,
        plan: 'Post-extraction instructions given. Discuss implant or bridge options at follow-up.',
      };
    case 'emergency':
      return {
        chiefComplaint: `Toothache ${t}`,
        subjective: `Pain on ${t} for 3 days, worse when chewing.`,
        objective: `Periapical radiograph of ${t}. Tender to percussion. Deep caries approaching pulp.`,
        assessment: `Symptomatic ${t}, likely irreversible pulpitis.`,
        plan: `Book definitive treatment for ${t}. Analgesics as needed.`,
      };
    case 'srp':
      return {
        chiefComplaint: 'Periodontal therapy',
        subjective: 'Bleeding gums when brushing.',
        objective: `Scaling and root planing, two quadrants, under local anaesthetic. ${gums}`,
        assessment: 'Periodontitis, Stage II Grade B.',
        plan: 'Re-evaluate in 6 weeks. Periodontal maintenance every 3 months.',
      };
    case 'perio_maint':
      return {
        chiefComplaint: 'Periodontal maintenance',
        subjective: 'Home care improved; using interdental brushes.',
        objective: `Full-mouth debridement completed. ${gums}`,
        assessment: 'Periodontitis, stable under maintenance.',
        plan: 'Continue 3-month maintenance interval.',
      };
  }
}

// ── AI phone calls ─────────────────────────────────────────────────────────────

export type CallIntent = 'booking' | 'reschedule' | 'treatment_followup' | 'billing' | 'emergency';

export interface CallLine {
  speaker: 'ai' | 'patient' | 'staff';
  text: string;
}

export function callScript(
  intent: CallIntent,
  ctx: { firstName: string; visitLabel?: string; when?: string; accepted?: boolean },
): CallLine[] {
  const hello: CallLine = {
    speaker: 'ai',
    text: 'Thank you for calling Maple Grove Dental. This is the virtual assistant — how can I help?',
  };
  switch (intent) {
    case 'booking':
      return [
        hello,
        {
          speaker: 'patient',
          text: `Hi, this is ${ctx.firstName}. I'd like to book a ${ctx.visitLabel?.toLowerCase() ?? 'cleaning'}.`,
        },
        {
          speaker: 'ai',
          text: `Of course. I have an opening ${ctx.when ?? 'next week'}. Does that work for you?`,
        },
        { speaker: 'patient', text: 'Yes, that works.' },
        {
          speaker: 'ai',
          text: "You're booked. You'll get a reminder the day before. Anything else?",
        },
        { speaker: 'patient', text: "No, that's all. Thanks!" },
      ];
    case 'reschedule':
      return [
        hello,
        {
          speaker: 'patient',
          text: `Hi, it's ${ctx.firstName}. I need to move my appointment, something came up at work.`,
        },
        {
          speaker: 'ai',
          text: `No problem. I can offer ${ctx.when ?? 'later this week'} instead.`,
        },
        { speaker: 'patient', text: "That's perfect, thank you." },
        {
          speaker: 'ai',
          text: "Done — your appointment has been moved. We'll send an updated reminder.",
        },
      ];
    case 'treatment_followup':
      return ctx.accepted
        ? [
            {
              speaker: 'ai',
              text: `Hi ${ctx.firstName}, I'm calling from Maple Grove Dental about the treatment plan Dr. Marchetti recommended.`,
            },
            { speaker: 'patient', text: 'Yes, I looked it over. What would my insurance cover?' },
            {
              speaker: 'ai',
              text: 'Based on your plan, most of the cost is covered. Your estimated portion is on the plan we emailed.',
            },
            { speaker: 'patient', text: "OK, let's go ahead and book it." },
            { speaker: 'ai', text: 'Great, I have booked the first visit. See you soon!' },
          ]
        : [
            {
              speaker: 'ai',
              text: `Hi ${ctx.firstName}, I'm calling from Maple Grove Dental about your recommended treatment.`,
            },
            {
              speaker: 'patient',
              text: "I'd like to hold off for now — it's a bit expensive this year.",
            },
            {
              speaker: 'ai',
              text: "Understood. I'll note that, and we can revisit it at your next checkup.",
            },
          ];
    case 'billing':
      return [
        hello,
        {
          speaker: 'patient',
          text: `Hi, ${ctx.firstName} here. I got a statement and I don't understand why I owe a balance.`,
        },
        {
          speaker: 'ai',
          text: 'I can see your account. Let me connect you with our front desk to go through the details.',
        },
        {
          speaker: 'staff',
          text: `Hi ${ctx.firstName}, this is Sam. Your insurer covered part of the visit; the balance is your co-pay. I can take a payment now if you like.`,
        },
        { speaker: 'patient', text: "Oh, that makes sense. I'll pay by card." },
      ];
    case 'emergency':
      return [
        hello,
        {
          speaker: 'patient',
          text: `This is ${ctx.firstName}. I have a really bad toothache, it kept me up all night.`,
        },
        {
          speaker: 'ai',
          text: "I'm sorry to hear that. We keep emergency slots open — I can see you today.",
        },
        { speaker: 'patient', text: 'Yes please, as soon as possible.' },
        {
          speaker: 'ai',
          text: `You're booked for ${ctx.when ?? 'this afternoon'}. If swelling spreads to your eye or neck, go to the emergency department.`,
        },
      ];
  }
}

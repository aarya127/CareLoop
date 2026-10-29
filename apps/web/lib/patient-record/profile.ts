import type { PatientProfile } from '../types/dental-record';

export type ApiPatient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  phoneE164?: string | null;
  gender?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  insuranceRecords?: Array<{
    payerName: string;
    planName?: string | null;
    memberIdMasked?: string | null;
  }>;
};

const GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

/** Maps the Patient API record to the UI profile without inventing any values. */
export function toPatientProfileFromApi(patient: ApiPatient): PatientProfile {
  const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
  const validDob = dob && !Number.isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : '';
  const firstInsurance = patient.insuranceRecords?.[0];

  return {
    patient_id: patient.id,
    first_name: patient.firstName,
    last_name: patient.lastName,
    date_of_birth: validDob,
    gender: (GENDER_VALUES as readonly string[]).includes(patient.gender ?? '')
      ? (patient.gender as PatientProfile['gender'])
      : 'prefer_not_to_say',
    preferences: { appointment_reminder_method: 'email', communication_language: 'en' },
    contact: {
      email: '',
      phone: patient.phoneE164 ?? '',
      address: { street: '', city: '', state: '', postal_code: '', country: '' },
      ...(patient.emergencyContactName || patient.emergencyContactPhone
        ? {
            emergency_contact: {
              name: patient.emergencyContactName ?? '',
              relationship: patient.emergencyContactRelationship ?? '',
              phone: patient.emergencyContactPhone ?? '',
            },
          }
        : {}),
    },
    insurance: firstInsurance
      ? {
          provider_name: firstInsurance.payerName,
          plan_id: firstInsurance.planName ?? '',
          policy_number: firstInsurance.memberIdMasked ?? '',
          coverage_type: 'private',
          effective_date: '',
        }
      : undefined,
  };
}

// Older builds saved fabricated emails like "first.last@careloop.local".
const isFabricatedEmail = (email?: string) => Boolean(email?.endsWith('@careloop.local'));

/**
 * Overlays the saved profile section (email, address, preferences, photo — data
 * the Patient table has no column for) onto the API profile. Fields the API owns
 * (name, DOB, gender, phone, insurance) always come from the API; financials are
 * never taken from the saved copy because older builds persisted placeholder zeros.
 */
export function mergePersistedProfile(
  api: PatientProfile,
  persisted: Partial<PatientProfile> | null,
): PatientProfile {
  if (!persisted) return api;
  const savedEmail = persisted.contact?.email;
  return {
    ...api,
    profile_photo_url: persisted.profile_photo_url ?? api.profile_photo_url,
    preferences: persisted.preferences ?? api.preferences,
    contact: {
      ...api.contact,
      email: savedEmail && !isFabricatedEmail(savedEmail) ? savedEmail : api.contact.email,
      address: persisted.contact?.address ?? api.contact.address,
    },
  };
}

/** The subset of a profile stored in the profile section (everything else is API-owned). */
export function persistableProfile(p: PatientProfile): Partial<PatientProfile> {
  return {
    profile_photo_url: p.profile_photo_url,
    preferences: p.preferences,
    contact: { ...p.contact, phone: '', emergency_contact: undefined },
  };
}

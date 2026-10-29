import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mergePersistedProfile,
  persistableProfile,
  toPatientProfileFromApi,
  type ApiPatient,
} from './profile';

const apiPatient: ApiPatient = {
  id: 'p1',
  firstName: 'Ana',
  lastName: 'Lee',
  dateOfBirth: '1984-03-09T00:00:00.000Z',
  phoneE164: '+15550100123',
};

describe('toPatientProfileFromApi', () => {
  it('does not invent a DOB, email, phone or financials when the API has none', () => {
    const p = toPatientProfileFromApi({ id: 'p2', firstName: 'No', lastName: 'Data' });
    assert.equal(p.date_of_birth, '');
    assert.equal(p.contact.email, '');
    assert.equal(p.contact.phone, '');
    assert.equal(p.financial, undefined);
    assert.equal(p.insurance, undefined);
  });

  it('maps real values through', () => {
    const p = toPatientProfileFromApi(apiPatient);
    assert.equal(p.date_of_birth, '1984-03-09');
    assert.equal(p.contact.phone, '+15550100123');
  });

  it('leaves unknown insurance details blank instead of placeholders', () => {
    const p = toPatientProfileFromApi({
      ...apiPatient,
      insuranceRecords: [{ payerName: 'Sun Life' }],
    });
    assert.equal(p.insurance?.plan_id, '');
    assert.equal(p.insurance?.policy_number, '');
    assert.equal(p.insurance?.coverage_percent, undefined);
  });
});

describe('mergePersistedProfile', () => {
  const api = toPatientProfileFromApi(apiPatient);

  it('lets API-owned fields win over a stale saved copy', () => {
    const merged = mergePersistedProfile(api, {
      date_of_birth: '1990-01-01',
      first_name: 'Stale',
      contact: { ...api.contact, phone: 'N/A', email: 'real@example.com' },
      financial: {
        outstanding_balance: 0,
        total_lifetime_spent: 0,
        average_visit_cost: 0,
        payment_plan_active: false,
      },
    });
    assert.equal(merged.date_of_birth, '1984-03-09');
    assert.equal(merged.first_name, 'Ana');
    assert.equal(merged.contact.phone, '+15550100123');
    assert.equal(merged.financial, undefined);
    assert.equal(merged.contact.email, 'real@example.com');
  });

  it('ignores fabricated @careloop.local emails saved by older builds', () => {
    const merged = mergePersistedProfile(api, {
      contact: { ...api.contact, email: 'ana.lee@careloop.local' },
    });
    assert.equal(merged.contact.email, '');
  });
});

describe('persistableProfile', () => {
  it('excludes API-owned and financial fields', () => {
    const saved = persistableProfile({
      ...toPatientProfileFromApi(apiPatient),
      financial: {
        outstanding_balance: 5,
        total_lifetime_spent: 5,
        average_visit_cost: 5,
        payment_plan_active: false,
      },
    });
    assert.equal(saved.financial, undefined);
    assert.equal(saved.date_of_birth, undefined);
    assert.equal(saved.first_name, undefined);
    assert.equal(saved.contact?.phone, '');
  });
});

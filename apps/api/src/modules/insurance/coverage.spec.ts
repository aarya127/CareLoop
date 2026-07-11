import { describe, it, expect } from 'vitest';
import { remainingBenefitCents } from './dto';

describe('insurance coverage: remainingBenefitCents', () => {
  it('returns null when there is no annual maximum', () => {
    expect(remainingBenefitCents(null)).toBeNull();
    expect(remainingBenefitCents({})).toBeNull();
    expect(remainingBenefitCents({ usedToDateCents: 5000 })).toBeNull();
  });

  it('subtracts used-to-date from the annual maximum', () => {
    expect(remainingBenefitCents({ annualMaximumCents: 150000, usedToDateCents: 40000 })).toBe(110000);
  });

  it('treats missing used-to-date as zero', () => {
    expect(remainingBenefitCents({ annualMaximumCents: 150000 })).toBe(150000);
  });

  it('never returns a negative remaining benefit', () => {
    expect(remainingBenefitCents({ annualMaximumCents: 100000, usedToDateCents: 130000 })).toBe(0);
  });
});

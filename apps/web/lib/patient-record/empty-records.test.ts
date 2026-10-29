import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  blankPerioMeasurements,
  emptyClinicalChart,
  emptyMedicalHistory,
  emptyPeriodontalRecords,
} from './empty-records';

describe('empty records', () => {
  it('medical history invents no clinical facts', () => {
    const h = emptyMedicalHistory('p1');
    assert.deepEqual(h.allergies, []);
    assert.deepEqual(h.current_medications, []);
    assert.deepEqual(h.systemic_conditions, []);
    assert.equal(h.lifestyle_factors, undefined);
    assert.equal(h.dental_history, undefined);
  });

  it('clinical chart has no teeth charted and no gum summary', () => {
    const c = emptyClinicalChart('p1');
    assert.deepEqual(c.teeth, []);
    assert.equal(c.gum_health_summary, undefined);
  });

  it('periodontal records have no exams or summary', () => {
    const r = emptyPeriodontalRecords('p1');
    assert.deepEqual(r.exams, []);
    assert.equal(r.summary, undefined);
  });

  it('blank perio template covers 32 teeth with 6 unprobed sites each', () => {
    const m = blankPerioMeasurements();
    assert.equal(m.length, 32);
    assert.ok(
      m.every((t) => t.pocket_depths.length === 6 && t.pocket_depths.every((d) => d === 0)),
    );
    assert.deepEqual(
      m.map((t) => t.tooth_number),
      Array.from({ length: 32 }, (_, i) => i + 1),
    );
  });
});

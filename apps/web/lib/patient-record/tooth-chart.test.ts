import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ToothRecord } from '../types/dental-record';
import { buildArch, mergeToothChart, teethToUpsert, upsertTooth } from './tooth-chart';

const tooth = (n: number, status: ToothRecord['status'] = 'filled'): ToothRecord => ({
  tooth_number: n,
  status,
  color_code: '#000',
});
const persisted = (t: ToothRecord) => ({ condition: t.status, notes: t.notes ?? null });

describe('mergeToothChart', () => {
  it('keeps EMR teeth even when the base chart is empty', () => {
    const merged = mergeToothChart([], new Map([[14, tooth(14)]]));
    assert.deepEqual(
      merged.map((t) => t.tooth_number),
      [14],
    );
  });

  it('lets the EMR entry override the base entry and sorts by tooth number', () => {
    const merged = mergeToothChart(
      [tooth(30, 'healthy'), tooth(3, 'healthy')],
      new Map([[30, tooth(30, 'crowned')]]),
    );
    assert.deepEqual(
      merged.map((t) => [t.tooth_number, t.status]),
      [
        [3, 'healthy'],
        [30, 'crowned'],
      ],
    );
  });
});

describe('buildArch', () => {
  it('always returns 32 slots and marks uncharted teeth as null, not healthy', () => {
    const arch = buildArch([tooth(1)]);
    assert.equal(arch.length, 32);
    assert.equal(arch[0].tooth?.status, 'filled');
    assert.equal(arch[1].tooth, null);
    assert.equal(arch[31].tooth_number, 32);
  });
});

describe('upsertTooth', () => {
  it('appends a tooth that was not charted before', () => {
    assert.deepEqual(
      upsertTooth([tooth(5)], tooth(2)).map((t) => t.tooth_number),
      [2, 5],
    );
  });

  it('replaces an existing tooth', () => {
    const next = upsertTooth([tooth(5, 'filled')], tooth(5, 'crowned'));
    assert.equal(next.length, 1);
    assert.equal(next[0].status, 'crowned');
  });
});

describe('teethToUpsert', () => {
  it('includes newly charted teeth, even when charted as healthy', () => {
    assert.deepEqual(
      teethToUpsert([], [tooth(8, 'healthy')], persisted).map((t) => t.tooth_number),
      [8],
    );
  });

  it('includes a tooth changed back to healthy and skips unchanged teeth', () => {
    const changed = teethToUpsert(
      [tooth(3, 'decayed'), tooth(4, 'filled')],
      [tooth(3, 'healthy'), tooth(4, 'filled')],
      persisted,
    );
    assert.deepEqual(
      changed.map((t) => t.tooth_number),
      [3],
    );
  });
});

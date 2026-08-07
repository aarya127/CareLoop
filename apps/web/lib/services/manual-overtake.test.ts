import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activateStaff, getOrCreateControlSession, requestHandoff } from './manual-overtake';

describe('manual overtake tenant isolation', () => {
  it('keeps identical call ids isolated between practices', () => {
    const callId = `shared-call-${Date.now()}`;

    requestHandoff('practice-A', callId, 'user-A');
    activateStaff('practice-A', callId, 'user-A');

    const practiceA = getOrCreateControlSession('practice-A', callId);
    const practiceB = getOrCreateControlSession('practice-B', callId);

    assert.equal(practiceA.status, 'staff');
    assert.equal(practiceA.staffUserId, 'user-A');
    assert.equal(practiceB.status, 'ai');
    assert.equal(practiceB.staffUserId, undefined);
    assert.notStrictEqual(practiceA, practiceB);
  });
});

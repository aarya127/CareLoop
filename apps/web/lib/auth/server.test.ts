import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { requireRole, type SessionUser } from './authorization';

function user(role: string): SessionUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role,
    firstName: 'Test',
    lastName: 'User',
    practiceId: 'practice-A',
  };
}

describe('requireRole', () => {
  it('allows a configured role case-insensitively', () => {
    assert.equal(requireRole(user('Manager'), ['admin', 'manager']).role, 'Manager');
  });

  it('rejects authenticated users without analytics permission', () => {
    assert.throws(
      () => requireRole(user('staff'), ['admin', 'manager']),
      (error: unknown) => error instanceof Response && error.status === 403,
    );
  });
});

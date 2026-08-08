import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  invitationUpdateMany: vi.fn(),
  invitationCreate: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    invitation: {
      updateMany: mocks.invitationUpdateMany,
      create: mocks.invitationCreate,
    },
  },
}));

import { InvitationsService } from './invitations.service';

function service() {
  return new InvitationsService({} as any, {} as any, {} as any);
}

describe('InvitationsService role delegation', () => {
  it('prevents a manager from granting administrator privileges', async () => {
    await expect(
      service().create('practice-A', 'manager-A', ['manager'], {
        email: 'new-admin@example.com',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });
});

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  practiceId: string;
}

/** Reject an authenticated user whose role is not permitted for the resource. */
export function requireRole(user: SessionUser, allowedRoles: readonly string[]): SessionUser {
  if (!allowedRoles.includes(user.role.toLowerCase())) {
    throw Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

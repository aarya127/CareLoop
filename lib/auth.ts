export type UserRole = 'TENANT_ADMIN' | 'PROVIDER' | 'FRONT_DESK' | 'BILLING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  TENANT_ADMIN: ['*'],
  PROVIDER: ['schedule:read', 'schedule:write', 'patient:clinical', 'patient:demographics'],
  FRONT_DESK: ['schedule:read', 'schedule:write', 'patient:demographics', 'patient:insurance'],
  BILLING: ['patient:financial', 'patient:insurance', 'schedule:read'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}

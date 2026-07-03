'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AuthUser, AuthScope, AuthContextValue, UserRole } from './types';
import { ROLE_SCOPES } from './types';

const AuthContext = createContext<AuthContextValue | null>(null);

// Map backend DB roles to frontend UserRole
// Accepts the API's `roles` array or a single role name, case-insensitively.
// Backend role names are canonically lowercase (admin, manager, staff,
// service_account, provider, hygienist); older seed data may be uppercase.
function mapBackendRole(backendRole: string | string[] | undefined): UserRole {
  const name = (Array.isArray(backendRole) ? backendRole[0] : backendRole)?.toLowerCase();
  switch (name) {
    case 'admin':
    case 'service_account':
      return 'admin';
    case 'hygienist':
      return 'hygienist';
    case 'manager':
    case 'provider':
    case 'staff':
    default:
      return 'doctor';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from server-side cookie on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const frontendRole = mapBackendRole(data.roles ?? data.role);
          const authUser: AuthUser = {
            id: data.id,
            email: data.email,
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            role: frontendRole,
            scopes: ROLE_SCOPES[frontendRole],
            practiceId: data.practiceId ?? '',
            createdAt: new Date(),
            lastLoginAt: new Date(),
          };
          setUser(authUser);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const hasScope = useCallback(
    (scope: AuthScope): boolean => {
      return user?.scopes.includes(scope) ?? false;
    },
    [user]
  );

  const hasAnyScope = useCallback(
    (scopes: AuthScope[]): boolean => {
      return scopes.some((scope) => user?.scopes.includes(scope)) ?? false;
    },
    [user]
  );

  const hasAllScopes = useCallback(
    (scopes: AuthScope[]): boolean => {
      return scopes.every((scope) => user?.scopes.includes(scope)) ?? false;
    },
    [user]
  );

  const canAccessPatient = useCallback(
    (patientId: string): boolean => {
      if (!user) return false;
      if (user.role === 'admin' || user.scopes.includes('ADMIN_ACCESS')) return true;
      if (user.role === 'doctor' && user.assignedPatientIds) {
        return user.assignedPatientIds.includes(patientId);
      }
      return true;
    },
    [user]
  );

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      // Surface the API's reason instead of silently returning — the login page's
      // catch block relies on a thrown error to render feedback to the user.
      let message = `Login failed (${res.status})`;
      try {
        const errBody = await res.json();
        if (errBody?.error) message = String(errBody.error);
      } catch {
        // non-JSON error body; keep the status-based message
      }
      throw new Error(message);
    }

    const data = await res.json();
    const frontendRole = mapBackendRole(data.user.roles ?? data.user.role);
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName ?? '',
      lastName: data.user.lastName ?? '',
      role: frontendRole,
      scopes: ROLE_SCOPES[frontendRole],
      practiceId: data.user.practiceId ?? '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    setUser(authUser);
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // best-effort
    }
    setUser(null);
  }, []);

  // Server-side rolling sessions handle refresh — this is a no-op
  const refreshToken = useCallback(async () => {}, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasScope,
    hasAnyScope,
    hasAllScopes,
    canAccessPatient,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredScopes?: AuthScope[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasAllScopes } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#87CEEB]" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please log in to continue</p>
          </div>
        </div>
      );
    }

    if (requiredScopes && !hasAllScopes(requiredScopes)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don&apos;t have permission to access this resource
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

'use client';

/**
 * Authentication Context Provider
 * Manages JWT auth, scopes, and RBAC
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AuthUser, AuthScope, AuthContextValue, JWTPayload, UserRole } from './types';
import { auditLog } from '@/lib/services/audit-service';

const AuthContext = createContext<AuthContextValue | null>(null);

// Base64URL helpers for mock JWTs
function base64UrlEncode(str: string): string {
  if (typeof window === 'undefined') return '';
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str: string): string {
  if (typeof window === 'undefined') return '';
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return atob(s);
}

// Mock JWT decode (in production, use jose or jsonwebtoken)
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from stored token
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Only access localStorage in browser environment
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const token = localStorage.getItem('auth_token');
        if (token) {
          const payload = decodeJWT(token);
          if (payload && payload.exp * 1000 > Date.now()) {
            // Token valid
            const authUser: AuthUser = {
              id: payload.sub,
              email: payload.email,
              firstName: payload.email.split('@')[0], // Temporary
              lastName: '',
              role: payload.role,
              scopes: payload.scopes,
              assignedPatientIds: payload.assigned_patient_ids,
              practiceId: payload.practice_id,
              createdAt: new Date(payload.iat * 1000),
              lastLoginAt: new Date(),
            };
            setUser(authUser);
            
            // Log session restored
            await auditLog({
              action: 'session_restored',
              actor_id: authUser.id,
              source: 'auth_provider',
              metadata: { role: authUser.role },
            });
          } else {
            // Token expired
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
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
      
      // Admin can access all
      if (user.role === 'admin' || user.scopes.includes('ADMIN_ACCESS')) {
        return true;
      }

      // Doctors can only access their assigned patients
      if (user.role === 'doctor' && user.assignedPatientIds) {
        return user.assignedPatientIds.includes(patientId);
      }

      // Other roles can access all patients (receptionists, hygienists, etc.)
      return true;
    },
    [user]
  );

  const login = useCallback(async (email: string, password: string) => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Login only available in browser');
      }

      // Determine role from email
      let role: UserRole = 'doctor';
      let scopes: AuthScope[] = ['PATIENT_READ', 'APPT_READ', 'COMMS_READ'];
      
      if (email.includes('admin@')) {
        role = 'admin';
        scopes = ['PATIENT_READ', 'PATIENT_WRITE', 'APPT_READ', 'APPT_WRITE', 'COMMS_READ', 'COMMS_WRITE', 'VOIP_CALL', 'VOIP_RECORD', 'AUDIT_READ', 'ADMIN_ACCESS', 'PII_REVEAL'];
      } else if (email.includes('doctor@')) {
        role = 'doctor';
        scopes = ['PATIENT_READ', 'PATIENT_WRITE', 'APPT_READ', 'APPT_WRITE', 'COMMS_READ', 'COMMS_WRITE', 'VOIP_CALL', 'VOIP_RECORD', 'PII_REVEAL'];
      } else if (email.includes('hygienist@')) {
        role = 'hygienist';
        scopes = ['PATIENT_READ', 'APPT_READ', 'COMMS_READ'];
      } else if (email.includes('receptionist@')) {
        role = 'receptionist';
        scopes = ['APPT_READ', 'APPT_WRITE', 'COMMS_READ', 'COMMS_WRITE'];
      }

      // Mock JWT token (in production, received from server)
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload: JWTPayload = {
        sub: 'u_demo_' + Date.now().toString(),
        email,
        role,
        scopes,
        practice_id: 'prac_001',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        jti: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : 'mock-jti',
      } as JWTPayload;
      const headerB64 = base64UrlEncode(JSON.stringify(header));
      const payloadB64 = base64UrlEncode(JSON.stringify(payload));
      const signatureB64 = base64UrlEncode('mock_signature');
      const mockToken = `${headerB64}.${payloadB64}.${signatureB64}`;

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('demo_user_email', email); // Store for demo mode check
      
      const payloadDecoded = decodeJWT(mockToken);
      if (payloadDecoded) {
        const authUser: AuthUser = {
          id: payloadDecoded.sub,
          email: payloadDecoded.email,
          firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          lastName: 'User',
          role: payloadDecoded.role,
          scopes: payloadDecoded.scopes,
          assignedPatientIds: payloadDecoded.assigned_patient_ids,
          practiceId: payloadDecoded.practice_id,
          createdAt: new Date(payloadDecoded.iat * 1000),
          lastLoginAt: new Date(),
        };
        setUser(authUser);

        // Audit log
        await auditLog({
          action: 'user_login',
          actor_id: authUser.id,
          source: 'auth_form',
          metadata: { email, role: authUser.role },
        });
        
        console.log('✅ Login successful:', { email, role: authUser.role });
        return true; // Indicate success
      }
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;

      if (user) {
        await auditLog({
          action: 'user_logout',
          actor_id: user.id,
          source: 'auth_provider',
        });
      }

      localStorage.removeItem('auth_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [user]);

  const refreshToken = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;

      // In production: POST /api/auth/refresh
      const currentToken = localStorage.getItem('auth_token');
      if (!currentToken) return;

      // Mock token refresh
      const payload = decodeJWT(currentToken);
      if (payload) {
        const newToken = btoa(JSON.stringify({
          ...JSON.parse(atob(currentToken.split('.')[1])),
          exp: Math.floor(Date.now() / 1000) + 86400,
        }));
        localStorage.setItem('auth_token', newToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
    }
  }, [logout]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 3600000); // Refresh every hour

    return () => clearInterval(interval);
  }, [user, refreshToken]);

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
      // Redirect to login
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
              You don't have permission to access this resource
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

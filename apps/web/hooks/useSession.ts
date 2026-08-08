'use client';

import { useEffect, useState } from 'react';
import { PUBLIC_API_URL } from '@/lib/config/api-client';

interface SessionUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PUBLIC_API_URL}/auth/session`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAuthenticated: user !== null };
}

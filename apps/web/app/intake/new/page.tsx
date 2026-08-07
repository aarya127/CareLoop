'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { intakeApi } from '@/lib/api/intake';

/**
 * /intake/new — Creates a fresh draft then redirects to the multi-step form.
 *
 * The signed `?token=` capability identifies the clinic without exposing a
 * client-controlled practice id. The resulting draft token stays in
 * sessionStorage and is sent on every PHI read/write request.
 */
export default function NewIntakePage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const linkToken = new URLSearchParams(window.location.search).get('token') ?? '';
    intakeApi
      .createDraft(linkToken)
      .then((draft) => router.replace(`/intake/${draft.id}`))
      .catch(() => setFailed(true));
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      {failed ? (
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium">We couldn&apos;t start your intake form.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Please check the link your dental office gave you, or contact them for a new one.
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm animate-pulse">Preparing intake form…</p>
      )}
    </main>
  );
}

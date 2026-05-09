'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { intakeApi } from '@/lib/api/intake';

/**
 * /intake/new — Creates a fresh draft then redirects to the multi-step form.
 */
export default function NewIntakePage() {
  const router = useRouter();

  useEffect(() => {
    intakeApi
      .createDraft()
      .then((draft) => router.replace(`/intake/${draft.id}`))
      .catch(() => router.replace('/intake'));
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground text-sm animate-pulse">
        Preparing intake form…
      </p>
    </main>
  );
}

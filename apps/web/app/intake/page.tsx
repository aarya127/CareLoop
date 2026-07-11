'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function IntakePage() {
  const [practice, setPractice] = useState<string | null>(null);

  useEffect(() => {
    setPractice(new URLSearchParams(window.location.search).get('practice'));
  }, []);

  // Carry the practice through so the clinic's link routes patients to the right office.
  const newHref = practice ? `/intake/new?practice=${encodeURIComponent(practice)}` : '/intake/new';

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Patient Intake</h1>
          <p className="text-muted-foreground mt-1">
            Start a new patient intake form or review submitted forms.
          </p>
        </div>
        <Button asChild>
          <Link href={newHref}>New Intake Form</Link>
        </Button>
      </div>
    </main>
  );
}

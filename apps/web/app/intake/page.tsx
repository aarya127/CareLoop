'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function IntakePage() {
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
          <Link href="/intake/new">New Intake Form</Link>
        </Button>
      </div>
    </main>
  );
}

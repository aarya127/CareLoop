'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Patients() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the admin patients page
    router.push('/admin/patients');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to admin dashboard...</p>
    </div>
  );
}

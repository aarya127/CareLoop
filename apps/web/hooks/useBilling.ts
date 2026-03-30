'use client';

import { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  patientId: string;
  amountCents: number;
  status: string;
  dueDate: string;
}

export function useBilling(patientId: string | null) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetch(`/api/billing/invoices?patientId=${patientId}`)
      .then((r) => r.json())
      .then(setInvoices)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [patientId]);

  return { invoices, loading, error };
}

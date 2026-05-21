import { PatientDocuments } from '@/components/patients/patient-documents';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientOverviewPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-1">Patient Files</h1>
      <p className="text-sm text-[#86868B] mb-6">Patient ID: {id}</p>
      <PatientDocuments patientId={id} />
    </main>
  );
}

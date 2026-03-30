interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientTreatmentsPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Treatments</h1>
      <p className="text-muted-foreground mt-2">Treatment history for patient {id}</p>
    </main>
  );
}

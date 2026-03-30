interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientDocumentsPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <p className="text-muted-foreground mt-2">Documents for patient {id}</p>
    </main>
  );
}

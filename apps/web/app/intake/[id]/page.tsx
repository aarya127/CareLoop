interface Props {
  params: Promise<{ id: string }>;
}

export default async function IntakeDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Intake Form</h1>
      <p className="text-muted-foreground mt-2">Form ID: {id}</p>
    </main>
  );
}

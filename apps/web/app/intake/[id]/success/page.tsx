import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SuccessPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-md">
        {/* Checkmark icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-primary"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold mb-2">You&apos;re all set!</h1>
        <p className="text-muted-foreground mb-8">
          Your intake form has been submitted successfully. Our team will be in touch to confirm
          your appointment.
        </p>

        <p className="text-xs text-muted-foreground mb-6">
          Reference ID: <span className="font-mono">{id}</span>
        </p>

        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}

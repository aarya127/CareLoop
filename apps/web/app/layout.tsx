import { Manrope } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers/providers';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CareLoop - AI Dental Receptionist',
  description: 'Answers calls, books visits, verifies insurance—24/7.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CareLoop',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

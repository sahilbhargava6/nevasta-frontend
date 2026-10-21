import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import GlobalInteractiveWidgets from '@/components/GlobalInteractiveWidgets';
import QueryProvider from '@/components/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Navesta — Institutional Debt Management & Balance Transfer Platform',
  description: 'Personal finance optimization platform for Indian borrowers. Debt visibility, algorithmic repayment planning, and bank-to-bank balance transfer takeovers.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F172A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <QueryProvider>
          <Toaster richColors position="top-right" closeButton />
          {children}
          <GlobalInteractiveWidgets />
        </QueryProvider>
      </body>
    </html>
  );
}

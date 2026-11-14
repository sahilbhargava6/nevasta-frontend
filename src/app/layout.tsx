import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import '@/styles/navesta-design.css';
import GlobalInteractiveWidgets from '@/components/GlobalInteractiveWidgets';
import QueryProvider from '@/components/QueryProvider';
import SessionProvider from '@/components/session/SessionProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Headline face of the design prototype (Navesta_Website_22Sep26.html)
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FEFAF3] text-[#2D1606] font-sans selection:bg-[#F09020] selection:text-white">
        <QueryProvider>
          <SessionProvider>
            <Toaster richColors position="top-right" closeButton />
            {children}
            <GlobalInteractiveWidgets />
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

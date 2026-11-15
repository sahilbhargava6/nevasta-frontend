'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

/**
 * Header for journey screens: the site navbar plus a slim "Back" bar.
 * `backHref` / `onBack` choose where Back goes (default: browser back).
 * `minimal` is accepted for compatibility and has no effect.
 */
export default function JourneyHeader({ backHref, onBack, label = 'Back' }: { backHref?: string; onBack?: () => void; minimal?: boolean; label?: string }) {
  const router = useRouter();
  const back = () => (onBack ? onBack() : backHref ? router.push(backHref) : router.back());

  return (
    <>
      <Navbar />
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center">
          <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            {label}
          </button>
        </div>
      </div>
    </>
  );
}

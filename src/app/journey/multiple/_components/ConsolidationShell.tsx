'use client';

import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';

/**
 * Frame shared by the debt-consolidation screens: sign-in gate, page background
 * and the sticky journey header.
 */
export default function ConsolidationShell({
  backHref,
  onBack,
  children,
}: {
  backHref?: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <JourneyGate intent="debt-consolidation">
      <div className="min-h-screen bg-slate-50">
        <JourneyHeader backHref={backHref} onBack={onBack} />
        {children}
      </div>
    </JourneyGate>
  );
}

'use client';

import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';

/**
 * Frame shared by the debt-consolidation screens: sign-in gate, design scope,
 * the overlay pages' warm gradient background and the sticky journey header.
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
      <div
        className="nv"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)',
          fontFamily: 'var(--sans)',
        }}
      >
        <JourneyHeader backHref={backHref} onBack={onBack} />
        {children}
      </div>
    </JourneyGate>
  );
}

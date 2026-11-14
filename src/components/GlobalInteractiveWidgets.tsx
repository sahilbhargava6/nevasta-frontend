'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, type AuthIntent } from '@/components/session/SessionProvider';
import NavaChatWidget from './NavaChatWidget';

/**
 * Widgets on every page. The old 30-second audit popup is replaced by the
 * design journeys: anything that still fires `navesta:open-audit` (with an
 * optional debtType) is routed into the matching journey, behind sign-in.
 */
const JOURNEY_FOR: Record<string, { intent: AuthIntent; path: string }> = {
  card: { intent: 'debt-cc', path: '/journey/credit-card' },
  loan: { intent: 'debt-loan', path: '/journey/loan' },
  both: { intent: 'debt-consolidation', path: '/journey/multiple' },
};

export function useStartJourney() {
  const router = useRouter();
  const { requireAuth } = useSession();

  return useCallback(
    (debtType?: string) => {
      const target = (debtType && JOURNEY_FOR[debtType]) || { intent: 'debt-management' as AuthIntent, path: '/debt-management' };
      requireAuth(target.intent, () => router.push(target.path));
    },
    [requireAuth, router],
  );
}

export default function GlobalInteractiveWidgets() {
  const startJourney = useStartJourney();

  useEffect(() => {
    const handle = (e: Event) => {
      const type = (e as CustomEvent).detail?.debtType;
      startJourney(typeof type === 'string' ? type : undefined);
    };
    window.addEventListener('navesta:open-audit', handle);
    return () => window.removeEventListener('navesta:open-audit', handle);
  }, [startJourney]);

  return <NavaChatWidget onOpenAudit={() => startJourney()} />;
}

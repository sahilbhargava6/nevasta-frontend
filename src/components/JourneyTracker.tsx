'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/session/SessionProvider';
import { trackStep, type TrackJourney } from '@/lib/track';

/**
 * Records each journey screen a person reaches (one event per screen per
 * browser session). Screens that need an account are only recorded once the
 * customer is signed in. In-page moments (offers shown, applied, consent
 * given, sign-up steps) are recorded where they happen with trackStep().
 */
const SCREENS: Record<string, { journey: TrackJourney; step: string; needsAccount?: boolean }> = {
  '/': { journey: 'signup', step: 'home_visit' },
  '/debt-management': { journey: 'debt_management', step: 'chooser', needsAccount: true },
  '/journey/credit-card': { journey: 'credit_card', step: 'add_card', needsAccount: true },
  '/journey/credit-card/analysis': { journey: 'credit_card', step: 'analysis', needsAccount: true },
  '/journey/credit-card/fixes': { journey: 'credit_card', step: 'fixes', needsAccount: true },
  '/journey/credit-card/plan': { journey: 'credit_card', step: 'plan', needsAccount: true },
  '/journey/credit-card/simulator': { journey: 'credit_card', step: 'simulator', needsAccount: true },
  '/journey/credit-card/switch-to-loan': { journey: 'credit_card', step: 'switch_to_loan', needsAccount: true },
  '/journey/credit-card/offers': { journey: 'credit_card', step: 'offers', needsAccount: true },
  '/journey/hard-month': { journey: 'credit_card', step: 'hard_month', needsAccount: true },
  '/journey/cant-pay': { journey: 'credit_card', step: 'cant_pay', needsAccount: true },
  '/journey/loan': { journey: 'loan', step: 'details', needsAccount: true },
  '/journey/loan/analysis': { journey: 'loan', step: 'analysis', needsAccount: true },
  '/journey/loan/fixes': { journey: 'loan', step: 'fixes', needsAccount: true },
  '/journey/loan/balance-transfer': { journey: 'loan', step: 'eligibility', needsAccount: true },
  '/journey/multiple': { journey: 'multiple', step: 'debts', needsAccount: true },
  '/journey/multiple/summary': { journey: 'multiple', step: 'summary', needsAccount: true },
  '/journey/multiple/eligibility': { journey: 'multiple', step: 'eligibility', needsAccount: true },
  '/journey/multiple/plan': { journey: 'multiple', step: 'offers_shown', needsAccount: true },
  '/life-events': { journey: 'life_events', step: 'hub' },
};

export default function JourneyTracker() {
  const pathname = usePathname() ?? '';
  const { user, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    const screen = SCREENS[pathname.replace(/\/+$/, '') || '/'];
    if (screen) {
      if (!screen.needsAccount || user) trackStep(screen.journey, screen.step);
      return;
    }
    const lifeEvent = pathname.match(/^\/life-events\/([a-z0-9-]+)\/?$/);
    if (lifeEvent) trackStep('life_events', 'planner', lifeEvent[1]);
  }, [pathname, ready, user]);

  return null;
}

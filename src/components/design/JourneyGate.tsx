'use client';

import { useEffect, useRef } from 'react';
import { useSession, type AuthIntent } from '@/components/session/SessionProvider';

/**
 * Journey screens need an account (as in the design, where showDMPage /
 * showLoanPage / showMultiDebtPage open sign-up first). Opens sign-up once
 * when a signed-out visitor lands here directly, then shows the screen.
 */
export default function JourneyGate({ intent, children }: { intent: AuthIntent; children: React.ReactNode }) {
  const { user, ready, openAuth } = useSession();
  const asked = useRef(false);

  useEffect(() => {
    if (ready && !user && !asked.current) {
      asked.current = true;
      openAuth({ mode: 'signup', intent });
    }
  }, [ready, user, intent, openAuth]);

  if (!ready) return null;

  if (!user) {
    return (
      <div className="nv" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 28, color: '#1A0800', marginBottom: 10 }}>Create your free account to continue</h1>
          <p style={{ color: '#7A5E44', fontSize: 15, lineHeight: 1.6, marginBottom: 22 }}>Your plan is built from your own numbers, so we keep it in your private account. Free forever, no card needed.</p>
          <button className="l-primary" onClick={() => openAuth({ mode: 'signup', intent })}>
            Get Started →
          </button>
          <div style={{ marginTop: 14, fontSize: 14, color: '#7A5E44' }}>
            Already have an account?{' '}
            <a style={{ color: '#D96010', fontWeight: 700, cursor: 'pointer' }} onClick={() => openAuth({ mode: 'login', intent })}>
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

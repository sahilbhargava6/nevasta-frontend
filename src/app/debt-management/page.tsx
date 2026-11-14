'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useSession } from '@/components/session/SessionProvider';

// Design: #dm-page (Navesta_Website_22Sep26.html ~4498–4687)

type DebtType = 'cc' | 'loan' | 'multiple';

const OPTIONS: { type: DebtType; title: string; body: string; icon: string; color: string; grad: string; glow: string }[] = [
  {
    type: 'cc',
    title: 'Credit card debt',
    body: 'Paying only the minimum? Bleeding interest every month? Break the cycle.',
    icon: '💳',
    color: '#DC2626',
    grad: 'linear-gradient(135deg,#DC2626,#991B1B)',
    glow: '220,38,38',
  },
  {
    type: 'loan',
    title: 'Loan',
    body: 'Have a personal, home, car or education loan? Cut the rate, the EMI or the tenure.',
    icon: '🏦',
    color: '#2563EB',
    grad: 'linear-gradient(135deg,#2563EB,#1E40AF)',
    glow: '37,99,235',
  },
  {
    type: 'multiple',
    title: 'Multiple debts',
    body: 'Juggling several cards or loans? We will simplify into one clear plan.',
    icon: '🔀',
    color: '#7C3AED',
    grad: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
    glow: '124,58,237',
  },
];

const LABELS: Record<DebtType, string> = { cc: 'Credit card debt', loan: 'Loan', multiple: 'Multiple debts' };
const ROUTES: Record<DebtType, string> = { cc: '/journey/credit-card', loan: '/journey/loan', multiple: '/journey/multiple' };

export default function DebtManagementPage() {
  return (
    <JourneyGate intent="debt-management">
      <DebtManagement />
    </JourneyGate>
  );
}

function DebtManagement() {
  const router = useRouter();
  const { user } = useSession();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  const [selected, setSelected] = useState<DebtType | null>(null);
  const [sheetIn, setSheetIn] = useState(false);
  // DPDP Act: consents are never pre-ticked
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [showErr, setShowErr] = useState(false);
  const timers = useRef<number[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const selectDebtType = (type: DebtType) => {
    setSelected(type);
    setC1(false);
    setC2(false);
    setC3(false);
    setShowErr(false);
    later(() => {
      setSheetIn(true);
      sheetRef.current?.focus();
    }, 10);
  };

  const closeConsent = () => {
    setSheetIn(false);
    later(() => setSelected(null), 300);
  };

  const proceedDebtType = () => {
    if (!c1 || !c2) {
      setShowErr(true);
      return;
    }
    setShowErr(false);
    const type = selected;
    setSheetIn(false);
    later(() => {
      if (type) router.push(ROUTES[type]);
    }, 280);
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConsent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden', width: '100%' }}>
      <JourneyHeader backHref="/" />

      <div style={{ padding: '36px 24px 160px', maxWidth: 560, margin: '0 auto' }}>
        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,96,16,0.12)', border: '1px solid rgba(201,96,16,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 12 }} aria-hidden>
            💸
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#7C3200', textTransform: 'uppercase' }}>Debt Management</span>
        </div>

        {/* Hero heading */}
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,6vw,36px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', marginBottom: 14 }}>
          {firstName}, you are in the
          <br />
          <span style={{ color: '#1099CF', fontStyle: 'italic' }}>right place.</span>
        </h1>

        <p style={{ fontSize: 15, color: 'rgba(42,22,6,0.62)', lineHeight: 1.7, marginBottom: 32 }}>
          Feeling stuck in debt is exhausting — but there is always a way out, and it is closer than you think. Tell us what is weighing on you and we will build your personal escape plan in minutes.
        </p>

        <div style={{ fontSize: 15, fontWeight: 700, color: '#2A1606', marginBottom: 16 }} id="dm-question">
          What do you need help with?
        </div>

        <div role="group" aria-labelledby="dm-question">
          {OPTIONS.map((o) => (
            <button
              key={o.type}
              type="button"
              className="dm-option"
              onClick={() => selectDebtType(o.type)}
              style={{ width: '100%', textAlign: 'left', fontFamily: 'inherit', background: '#fff', border: '1.5px solid rgba(196,168,130,0.3)', borderLeft: `4px solid ${o.color}`, borderRadius: 16, padding: 20, marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s', boxShadow: '0 2px 12px rgba(58,35,16,0.05)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 24px rgba(${o.glow},0.12)`;
                e.currentTarget.style.borderColor = `rgba(${o.glow},0.5)`;
                e.currentTarget.style.borderLeftColor = o.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(58,35,16,0.05)';
                e.currentTarget.style.borderColor = 'rgba(196,168,130,0.3)';
                e.currentTarget.style.borderLeftColor = o.color;
              }}
            >
              <div aria-hidden style={{ width: 46, height: 46, borderRadius: 13, background: o.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: `0 4px 12px rgba(${o.glow},0.3)` }}>
                {o.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2A1606', marginBottom: 4 }}>{o.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.58)', lineHeight: 1.45 }}>{o.body}</div>
              </div>
              <div aria-hidden style={{ fontSize: 20, color: 'rgba(42,22,6,0.3)' }}>
                ›
              </div>
            </button>
          ))}
        </div>

        {/* Reassurance note */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(201,96,16,0.06)', borderRadius: 14, padding: '14px 16px', marginTop: 8 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden>
            🔒
          </span>
          <span style={{ fontSize: 12, color: 'rgba(42,22,6,0.55)', lineHeight: 1.55 }}>Your information is fully encrypted and never shared. Navesta is RBI-compliant and NBFC registered.</span>
        </div>
      </div>

      {selected && (
        <>
          {/* Consent bottom sheet backdrop */}
          <div onClick={closeConsent} style={{ position: 'fixed', inset: 0, background: 'rgba(22,10,2,0.45)', zIndex: 820, opacity: sheetIn ? 1 : 0, transition: 'opacity .25s' }} aria-hidden />

          {/* Consent bottom sheet */}
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dm-consent-title"
            tabIndex={-1}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#FFFDF9', borderRadius: '24px 24px 0 0', padding: '0 24px 40px', boxShadow: '0 -8px 48px rgba(42,22,6,0.14)', zIndex: 830, transform: sheetIn ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .3s cubic-bezier(.34,1.26,.64,1)', maxWidth: 540, margin: '0 auto', overflowY: 'auto', maxHeight: '90vh', outline: 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
              <div style={{ width: 40, height: 4, background: 'rgba(42,22,6,0.15)', borderRadius: 2 }} />
            </div>

            <div id="dm-consent-title" style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 800, color: '#2A1606', marginBottom: 4, marginTop: 10 }}>
              Before we continue
            </div>
            <p style={{ fontSize: 13, color: 'rgba(42,22,6,0.58)', marginBottom: 16, lineHeight: 1.55 }}>
              To build your personalised {LABELS[selected]} escape plan, we need your agreement on the following.
            </p>

            <div style={{ background: '#FFF8EE', border: '1.5px solid rgba(196,168,130,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: '#7C3200', textTransform: 'uppercase', marginBottom: 8 }}>What we collect &amp; why</div>
              <p style={{ fontSize: 13, color: 'rgba(42,22,6,0.72)', lineHeight: 1.6, margin: 0 }}>
                Your card outstanding, minimum due, payment history and — if you upload one — statement details. Used only to calculate your interest cost and build your payoff plan. Nothing else.
              </p>
            </div>

            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, cursor: 'pointer', padding: 14, background: '#fff', borderRadius: 14, border: '1.5px solid rgba(196,168,130,0.28)' }}>
              <input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} required style={{ width: 20, height: 20, marginTop: 1, accentColor: '#2D7A3A', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'rgba(42,22,6,0.85)', lineHeight: 1.6 }}>
                I <strong>consent</strong> to Navesta collecting and processing my financial data to generate personalised debt guidance. <span style={{ color: '#C96010', fontWeight: 700 }}>*</span>
              </span>
            </label>

            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, cursor: 'pointer', padding: 14, background: '#fff', borderRadius: 14, border: '1.5px solid rgba(196,168,130,0.28)' }}>
              <input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} required style={{ width: 20, height: 20, marginTop: 1, accentColor: '#2D7A3A', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'rgba(42,22,6,0.85)', lineHeight: 1.6 }}>
                I understand my data is <strong>encrypted</strong>, used only for this purpose, <strong>never sold</strong>, and that I can <strong>withdraw consent anytime</strong>.{' '}
                <span style={{ color: '#C96010', fontWeight: 700 }}>*</span>
              </span>
            </label>

            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer', padding: 14, background: '#fff', borderRadius: 14, border: '1.5px solid rgba(196,168,130,0.18)' }}>
              <input type="checkbox" checked={c3} onChange={(e) => setC3(e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, accentColor: '#2D7A3A', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'rgba(42,22,6,0.65)', lineHeight: 1.6 }}>
                Send me money tips &amp; product updates from Navesta <span style={{ color: 'rgba(42,22,6,0.4)', fontStyle: 'italic' }}>(optional)</span>.
              </span>
            </label>

            {showErr && (
              <div role="alert" style={{ fontSize: 13, color: '#DC2626', fontWeight: 500, marginBottom: 12, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8 }}>
                ⚠ Please accept the required consents to continue.
              </div>
            )}

            <button
              type="button"
              onClick={proceedDebtType}
              style={{ width: '100%', background: 'linear-gradient(135deg,#F09020,#C96010)', border: 'none', borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: '.2px', boxShadow: '0 6px 20px rgba(201,96,16,0.35)', transition: 'all .2s' }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = '')}
            >
              Continue →
            </button>
            <button type="button" onClick={closeConsent} style={{ width: '100%', background: 'transparent', border: 'none', padding: 12, fontSize: 14, color: 'rgba(42,22,6,0.45)', cursor: 'pointer', fontFamily: 'var(--sans)', marginTop: 6 }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

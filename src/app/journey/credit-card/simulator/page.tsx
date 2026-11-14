'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_CC_JOURNEY, fmtCompact, fmtINR, useJourney } from '@/lib/journey';
import { cardMonthlyRate, combineCards, fixedMinPayment, payoffWith, pmtMonthly } from '@/lib/ccPlanMath';

/* Pay-More Simulator — design #cc-pms-page (prototype lines ~6187–6271, JS ~9700–9796) */

const NAVY = '#1A2E3F';

export default function CCSimulatorPage() {
  return (
    <JourneyGate intent="debt-cc">
      <SimulatorScreen />
    </JourneyGate>
  );
}

function SimulatorScreen() {
  const router = useRouter();
  const [cc, , , ready] = useJourney('cc', DEFAULT_CC_JOURNEY);
  const combined = useMemo(() => combineCards(cc.cards), [cc.cards]);

  const outstanding = combined.outstanding;
  const rate = combined.rate > 0 ? combined.rate : 42;
  const minDue = fixedMinPayment(outstanding, combined.minDue);
  const r = cardMonthlyRate(rate);

  const range = useMemo(() => {
    if (outstanding <= 0) return null;
    // Slider min = PMT for 48 months (or min due, whichever higher); max = PMT for 4 months; default = 12 months
    const max = Math.ceil(pmtMonthly(outstanding, r, 4));
    const min = Math.min(Math.max(Math.ceil(pmtMonthly(outstanding, r, 48)), Math.ceil(minDue)), max);
    const def = Math.min(Math.max(Math.ceil(pmtMonthly(outstanding, r, 12)), min), max);
    const minOnly = payoffWith(outstanding, r, minDue);
    return { min, max, def, minOnly };
  }, [outstanding, r, minDue]);

  const [payment, setPayment] = useState<number | null>(null);

  if (!ready) return null;

  const pay = range ? Math.min(range.max, Math.max(range.min, payment ?? range.def)) : 0;
  const res = range ? payoffWith(outstanding, r, pay) : null;
  const saving = range && res ? Math.max(0, range.minOnly.totalInterest - res.totalInterest) : 0;
  const barPct = range && res && range.minOnly.months > 0 ? Math.round((res.months / range.minOnly.months) * 100) : 50;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'var(--sans)', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <JourneyHeader backHref="/journey/credit-card/plan" />

      {/* Dark gradient header */}
      <div style={{ background: 'linear-gradient(160deg,#1A2E3F 0%,#0D2233 100%)', padding: '24px 20px 28px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Pay-More Simulator</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Small change, big freedom</div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 40px', maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box', flex: 1 }}>
        {!range || !res ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Add your card balance first</div>
            <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.6, marginBottom: 16 }}>We need your outstanding balance to run the simulator.</div>
            <Link href="/journey/credit-card" style={{ display: 'inline-block', background: '#0D9488', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Add my cards →
            </Link>
          </div>
        ) : (
          <>
            {/* Slider card */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }} aria-hidden>
                  💡
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>Pay-more simulator</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.5)', marginBottom: 20, lineHeight: 1.5 }}>Drag to see how a bigger monthly payment changes your payoff.</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <label htmlFor="cpms-slider" style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', fontWeight: 500 }}>
                  Monthly payment
                </label>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 900, color: NAVY }}>{fmtINR(pay)}</span>
              </div>

              <input
                id="cpms-slider"
                type="range"
                min={range.min}
                max={range.max}
                value={pay}
                onChange={(e) => setPayment(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#0D9488', height: 6, cursor: 'pointer', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)' }}>Min {fmtINR(range.min)}</span>
                <span style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)' }}>{fmtINR(range.max)}</span>
              </div>
            </div>

            {/* Stats card */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <StatRow label="Debt-free in" value={`${res.months} month${res.months !== 1 ? 's' : ''}`} />
              <StatRow label="Total interest paid" value={fmtINR(res.totalInterest)} />
              <StatRow label="vs minimum-due path" value={`save ${fmtCompact(saving)}`} color="#059669" />
              <div style={{ paddingTop: 16 }}>
                <div style={{ width: '100%', height: 8, background: 'rgba(26,46,63,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${Math.max(4, Math.min(100, barPct))}%`, borderRadius: 4, background: 'linear-gradient(90deg,#059669,#0D9488)', transition: 'width .4s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)', textAlign: 'center' }}>Shorter bar = faster freedom.</div>
              </div>
            </div>

            {/* Navesta AI */}
            <div style={{ background: 'linear-gradient(135deg,#1B2B3A 0%,#1A2E3F 100%)', borderRadius: 20, padding: '22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#F5A623,#E07C10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>N</div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#F5A623', letterSpacing: 0.5 }}>Navesta AI</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
                Paying <strong style={{ color: '#F5A623' }}>{fmtINR(pay)}/mo</strong> clears everything in <strong style={{ color: '#F5A623' }}>{res.months} months</strong> and saves{' '}
                <strong style={{ color: '#F5A623' }}>{fmtCompact(saving)}</strong> vs the minimum.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Back button bar */}
      <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid rgba(196,168,130,0.2)', padding: '14px 20px', boxShadow: '0 -4px 20px rgba(58,35,16,0.06)' }}>
        <button
          onClick={() => router.push('/journey/credit-card/plan')}
          style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 16, fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: 'var(--sans)', padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = NAVY }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(26,46,63,0.07)', gap: 12 }}>
      <span style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

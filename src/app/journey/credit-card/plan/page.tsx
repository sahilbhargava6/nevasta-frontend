'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_CC_JOURNEY, fmtCompact, fmtINR, useJourney } from '@/lib/journey';
import {
  calcMinOnlyPayoff,
  cardMonthlyRate,
  combineCards,
  fixedMinPayment,
  fmtAxis,
  fmtDuration,
  monthsForAmount,
  pmtMonthly,
  smoothPath,
} from '@/lib/ccPlanMath';

/* "Pay More, Save More." — design #cc-plan-page (prototype lines ~6040–6186, JS ~7896–8248) */

const NAVY = '#1A2E3F';
const TEAL = '#0D9488';

export default function CCPlanPage() {
  return (
    <JourneyGate intent="debt-cc">
      <PlanScreen />
    </JourneyGate>
  );
}

function PlanScreen() {
  const router = useRouter();
  const [cc, , , ready] = useJourney('cc', DEFAULT_CC_JOURNEY);
  const [tab, setTab] = useState<'deadline' | 'amount'>('deadline');
  const [months, setMonths] = useState(12);
  const [overridePmt, setOverridePmt] = useState<number | null>(null);
  const [amountText, setAmountText] = useState('');
  const [amountMsg, setAmountMsg] = useState('Enter an amount above to see your payoff timeline');

  const combined = useMemo(() => combineCards(cc.cards), [cc.cards]);

  // Design fallbacks when a field is missing: 42% a year, ₹1,500 minimum due
  const outstanding = combined.outstanding;
  const annualRate = combined.rate > 0 ? combined.rate : 42;
  const minDue = combined.minDue > 0 ? combined.minDue : 1500;
  const r = cardMonthlyRate(annualRate);

  const plan = useMemo(() => {
    if (outstanding <= 0) return null;
    const pmt = overridePmt && overridePmt > 0 ? Math.ceil(overridePmt) : Math.ceil(pmtMonthly(outstanding, r, months));
    const belowMin = minDue > 0 && pmt < minDue;

    // Plan simulation (paying pmt every month)
    const planBals: number[] = [];
    let bal = outstanding;
    for (let m = 0; m <= Math.max(months + 2, 36); m++) {
      planBals.push(Math.max(0, bal));
      if (bal <= 0) break;
      const int = bal * (annualRate / 1200);
      bal = bal + int + int * 0.18 - pmt;
    }

    // Minimum-only simulation (fixed payment)
    const fixedMin = fixedMinPayment(outstanding, minDue);
    const minBals: number[] = [];
    let mBal = outstanding;
    for (let mm = 0; mm <= Math.max(months * 3, 60); mm++) {
      minBals.push(Math.max(0, mBal));
      if (mBal <= 0) break;
      const mi = mBal * (annualRate / 1200);
      mBal = mBal + mi + mi * 0.18 - fixedMin;
      if (mBal < 0) mBal = 0;
    }

    const planInterest = Math.max(0, pmt * months - outstanding);
    const minResult = calcMinOnlyPayoff(outstanding, annualRate, minDue);
    const interestSaved = Math.max(0, minResult.totalInterest - planInterest);
    const monthsSaved = minResult.months - months;

    // Step 2 rows: split the plan payment across cards by balance
    const cardsWithBal = cc.cards.filter((c) => (Number(c.outstanding) || 0) > 0);
    const rows = cardsWithBal.map((c, i) => {
      const share = cardsWithBal.length === 1 ? pmt : Math.round((pmt * c.outstanding) / outstanding);
      const cMin = cardsWithBal.length === 1 ? minDue : Math.max(0, Number(c.minDue) || 0);
      const extra = Math.max(0, share - cMin);
      const minPct = share > 0 ? Math.min(100, Math.round((cMin / share) * 100)) : 0;
      return {
        key: `${c.bank}-${i}`,
        name: c.bank?.trim() || `Card ${i + 1}`,
        outstanding: c.outstanding,
        rate: Number(c.rate) > 0 ? Number(c.rate) : annualRate,
        pay: share,
        min: cMin,
        extra,
        minPct,
      };
    });

    return { pmt, belowMin, planBals, minBals, minResult, interestSaved, monthsSaved, rows };
  }, [outstanding, overridePmt, r, months, minDue, annualRate, cc.cards]);

  const onSlider = (v: number) => {
    setOverridePmt(null);
    setMonths(v);
  };

  const onAmount = (text: string) => {
    setAmountText(text);
    const amount = parseFloat(text);
    if (!amount || amount <= 0) return;
    const m = monthsForAmount(outstanding, r, amount);
    if (m === null) {
      setAmountMsg('This amount only covers interest — try a higher number.');
      return;
    }
    setAmountMsg(`Debt-free in ${fmtDuration(m)}`);
    setMonths(m);
    setOverridePmt(amount);
  };

  if (!ready) return null;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/journey/credit-card/fixes" />

      <div style={{ padding: '20px 20px 120px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Intro card (dark navy) */}
        <div style={{ background: 'linear-gradient(135deg,#1B2B3A 0%,#1A2E3F 100%)', borderRadius: 20, padding: '22px 20px', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.18)', border: '1px solid rgba(245,166,35,0.35)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 10 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#F5A623', textTransform: 'uppercase' }}>AI-powered plan</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 10, lineHeight: 1.25 }}>
            Pay More, <span style={{ color: '#F5A623' }}>Save More.</span>
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Your {outstanding > 0 ? fmtCompact(outstanding) : '₹X'} debt at {annualRate.toFixed(0)}%/yr costs you money every single day. Paying even a little more than the minimum rewrites your future — dramatically.
          </div>
        </div>

        {!plan ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Add your card balance first</div>
            <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.6, marginBottom: 16 }}>We need your outstanding balance to build your plan.</div>
            <Link href="/journey/credit-card" style={{ display: 'inline-block', background: TEAL, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Add my cards →
            </Link>
          </div>
        ) : (
          <>
            {/* Step 1: When debt-free? */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <StepBadge n={1} title="When do you want to be debt-free?" />

              <div role="tablist" aria-label="Plan by" style={{ display: 'flex', background: 'rgba(26,46,63,0.07)', borderRadius: 10, padding: 3, marginBottom: 18 }}>
                {(['deadline', 'amount'] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    style={{ flex: 1, border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === t ? TEAL : 'transparent', color: tab === t ? '#fff' : 'rgba(26,46,63,0.45)', fontFamily: 'var(--sans)', transition: 'all 0.2s' }}
                  >
                    {t === 'deadline' ? 'By deadline' : '🌱 By amount'}
                  </button>
                ))}
              </div>

              <div style={{ minHeight: 110, position: 'relative' }}>
                {tab === 'deadline' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,46,63,0.5)' }}>Debt-free in</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 900, color: TEAL, lineHeight: 1 }}>{months}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>months</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={36}
                      value={Math.min(36, months)}
                      aria-label="Debt-free in months"
                      onChange={(e) => onSlider(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: TEAL, height: 6, cursor: 'pointer', marginBottom: 6 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)' }}>1 mo</span>
                      <span style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)' }}>36 mo</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <label htmlFor="ccp-amount-input" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(26,46,63,0.5)', marginBottom: 6 }}>
                        Monthly payment you can afford (₹)
                      </label>
                      <input
                        id="ccp-amount-input"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="e.g. 5000"
                        value={amountText}
                        onChange={(e) => onAmount(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid rgba(13,148,136,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(13,148,136,0.3)')}
                      />
                    </div>
                    <div aria-live="polite" style={{ fontSize: 13, color: 'rgba(26,46,63,0.55)', textAlign: 'center', padding: '8px 0' }}>
                      {amountMsg}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', marginTop: 14, marginBottom: 14, lineHeight: 1.55, minHeight: 36 }}>
                Clears all <strong style={{ color: NAVY }}>{fmtCompact(outstanding)}</strong> of card debt in <strong style={{ color: NAVY }}>{months} months</strong>. Minimum-only would take{' '}
                <strong style={{ color: '#DC2626' }}>{plan.minResult.neverClears ? '50+ years' : `${plan.minResult.months} months`}</strong>.
              </div>

              <div style={{ background: 'linear-gradient(135deg,#0D9488,#0891B2)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 4 }}>YOU&apos;D NEED TO PAY</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{fmtINR(plan.pmt)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  {plan.belowMin ? `/month · your bank requires min ${fmtINR(minDue)}` : '/month to clear this in time'}
                </div>
              </div>
            </div>

            {/* Step 2: Monthly plan breakdown */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Badge n={2} />
                <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>Your monthly plan</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.45)', marginBottom: 14, paddingLeft: 40 }}>How your monthly payment breaks down:</div>
              <div style={{ marginBottom: 14 }}>
                {plan.rows.map((row) => (
                  <div key={row.key} style={{ padding: '12px 0', borderBottom: '1px solid rgba(26,46,63,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, overflowWrap: 'anywhere' }}>{row.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.45)', marginTop: 2 }}>
                          {fmtCompact(row.outstanding)} · {row.rate.toFixed(0)}% yearly
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: TEAL }}>{fmtINR(row.pay)}</div>
                        <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)' }}>/mo</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'rgba(26,46,63,0.08)', borderRadius: 6, overflow: 'hidden', marginBottom: 10, display: 'flex', gap: 2 }}>
                      <div style={{ height: '100%', width: `${row.minPct}%`, background: '#64748B', borderRadius: '6px 0 0 6px', flexShrink: 0 }} />
                      {row.extra > 0 && <div style={{ height: '100%', width: `${100 - row.minPct}%`, background: TEAL, borderRadius: '0 6px 6px 0', flexShrink: 0 }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, background: 'rgba(26,46,63,0.07)', color: NAVY, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>Min {fmtINR(row.min)}</span>
                      {row.extra > 0 && (
                        <span style={{ fontSize: 11, background: '#CCFBF1', color: TEAL, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>+ {fmtINR(row.extra)} extra</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1.5px solid rgba(26,46,63,0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(26,46,63,0.6)' }}>Total per month</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: TEAL }}>{fmtINR(plan.pmt)}</span>
              </div>
            </div>

            {/* Step 3: Plan vs minimum chart */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                <div style={{ marginTop: 1 }}>
                  <Badge n={3} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>Your debt — plan vs minimum</div>
                  <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.5)', marginTop: 2 }}>What happens to your balance on each path</div>
                </div>
              </div>
              <PlanChart planBals={plan.planBals} minBals={plan.minBals} planM={months} />
              <div style={{ display: 'flex', gap: 20, marginTop: 10, marginBottom: 16, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 3, background: TEAL, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,46,63,0.6)' }}>Your plan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 18, height: 0, borderTop: '2px dashed #DC2626' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,46,63,0.6)' }}>Minimum only</span>
                </div>
              </div>
              <div style={{ background: '#E6FAF8', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: TEAL, textTransform: 'uppercase', marginBottom: 6 }}>YOU SAVE ON INTEREST</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 900, color: NAVY, lineHeight: 1, marginBottom: 6 }}>{fmtCompact(plan.interestSaved)}</div>
                <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.4 }}>
                  {plan.monthsSaved > 0 ? (
                    <>
                      Debt-free <strong style={{ color: NAVY }}>{plan.minResult.neverClears ? 'years' : `${plan.monthsSaved} months`} sooner</strong> than paying the minimum
                    </>
                  ) : (
                    'vs. paying the minimum every month'
                  )}
                </div>
              </div>
            </div>

            {/* Navesta AI card */}
            <div style={{ background: 'linear-gradient(135deg,#1B2B3A 0%,#1A2E3F 100%)', borderRadius: 20, padding: '22px 20px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#F5A623,#E07C10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#fff', fontWeight: 900 }}>N</div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#F5A623', letterSpacing: 0.5 }}>Navesta AI</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
                Paying <strong style={{ color: '#F5A623' }}>{fmtINR(plan.pmt)}/month</strong> clears your {fmtCompact(outstanding)} debt in{' '}
                <strong style={{ color: '#F5A623' }}>{months} months</strong>, saving you <strong style={{ color: '#4ADE80' }}>{fmtCompact(plan.interestSaved)}</strong> in interest vs minimum payments.
                {plan.monthsSaved > 0 && !plan.minResult.neverClears && (
                  <>
                    {' '}That&apos;s <strong style={{ color: '#4ADE80' }}>{plan.monthsSaved} months sooner</strong> than paying the minimum.
                  </>
                )}
              </div>
            </div>

            {/* Pay-More Simulator (design #cc-pms-page, unreachable in the prototype) */}
            <Link
              href="/journey/credit-card/simulator"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', border: '1.5px solid rgba(13,148,136,0.3)', borderRadius: 16, padding: '16px 18px', marginBottom: 24, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }} aria-hidden>
                  💡
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: NAVY }}>Try the Pay-More Simulator →</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(26,46,63,0.5)', marginTop: 2 }}>Small change, big freedom</span>
                </span>
              </span>
            </Link>
          </>
        )}

        <button
          onClick={() => router.push('/journey/credit-card/fixes')}
          style={{ width: '100%', background: 'rgba(26,46,63,0.08)', border: 'none', borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: 'var(--sans)' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(26,46,63,0.14)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(26,46,63,0.08)')}
        >
          ← Back to fixes
        </button>
      </div>
    </div>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{n}</div>
  );
}

function StepBadge({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <Badge n={n} />
      <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{title}</div>
    </div>
  );
}

/** Design drawPlanChart(): balance on the plan vs paying the minimum only. */
function PlanChart({ planBals, minBals, planM }: { planBals: number[]; minBals: number[]; planM: number }) {
  const W = 340;
  const H = 210;
  const padL = 56;
  const padR = 18;
  const padT = 28;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  let xMax = Math.max(planBals.length - 1, minBals.length - 1);
  xMax = Math.max(1, Math.min(xMax, Math.max(planM + 6, 36)));

  let maxY = Math.max(0, ...planBals, ...minBals);
  if (maxY === 0) maxY = 1;
  maxY *= 1.1;

  const xAt = (m: number) => padL + (m / xMax) * cW;
  const yAt = (v: number) => padT + cH - (v / maxY) * cH;
  const pts = (bals: number[]) => bals.slice(0, xMax + 1).map((v, i) => ({ x: xAt(i), y: yAt(v) }));

  const planPath = smoothPath(pts(planBals));
  const minPath = smoothPath(pts(minBals));

  const planEndIdx = Math.min(planBals.length - 1, xMax);
  const planEndX = xAt(planEndIdx);
  const planEndY = yAt(planBals[planEndIdx]);
  const minEndIdx = Math.min(minBals.length - 1, xMax);
  const minEndX = xAt(minEndIdx);
  const minEndY = yAt(minBals[minEndIdx]);
  const base = padT + cH;

  const label = `Balance chart. Your plan clears the debt in ${planM} months. Paying the minimum only${
    minBals[minEndIdx] > 500 ? `, you still owe ${fmtCompact(minBals[minEndIdx])} after ${minEndIdx} months` : ` clears it in ${minEndIdx} months`
  }.`;

  const font = { fontFamily: 'Inter,sans-serif' };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}>
      <title>{label}</title>
      <g shapeRendering="geometricPrecision" textRendering="optimizeLegibility">
        <defs>
          <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.18" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="minGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => {
          const val = (maxY / 1.1) * t;
          const yPos = yAt(val);
          return (
            <g key={t}>
              <line x1={padL} y1={yPos} x2={W - padR} y2={yPos} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <text x={padL - 5} y={Math.round(yPos + 3.5)} textAnchor="end" fontSize="9" fill="rgba(42,22,6,0.45)" fontWeight="600" {...font}>
                {fmtAxis(val)}
              </text>
            </g>
          );
        })}

        <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="rgba(0,0,0,0.10)" strokeWidth="1.2" />

        {planPath && <path d={`${planPath} L${planEndX.toFixed(1)},${base} L${xAt(0).toFixed(1)},${base} Z`} fill="url(#planGrad)" />}
        {minPath && <path d={`${minPath} L${minEndX.toFixed(1)},${base} L${xAt(0).toFixed(1)},${base} Z`} fill="url(#minGrad2)" />}

        {minPath && <path d={minPath} fill="none" stroke="#DC2626" strokeWidth="2" strokeDasharray="5,3" strokeLinejoin="round" strokeLinecap="round" />}
        {planPath && <path d={planPath} fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {planBals[planEndIdx] < 100 && (
          <g>
            <circle cx={planEndX} cy={planEndY} r="5" fill={TEAL} />
            <circle cx={planEndX} cy={planEndY} r="2.5" fill="#fff" />
            <text x={planEndX} y={Math.round(planEndY - 9)} textAnchor={planEndX > W * 0.7 ? 'end' : 'middle'} fontSize="9" fill={TEAL} fontWeight="800" {...font}>
              Debt-free! 🎉
            </text>
          </g>
        )}

        {minBals[minEndIdx] > 500 && (
          <g>
            <circle cx={minEndX} cy={minEndY} r="4.5" fill="#DC2626" />
            <circle cx={minEndX} cy={minEndY} r="2" fill="#fff" />
            <text x={minEndX} y={Math.round(minEndY - 8)} textAnchor="end" fontSize="9" fill="#DC2626" fontWeight="800" {...font}>
              Still {fmtCompact(minBals[minEndIdx])}
            </text>
          </g>
        )}

        <text x={xAt(0)} y={base + 16} textAnchor="start" fontSize="9" fill="rgba(42,22,6,0.45)" fontWeight="600" {...font}>
          Now
        </text>
        {planEndIdx > 1 && planEndIdx < xMax && (
          <g>
            <line x1={planEndX} y1={base} x2={planEndX} y2={base + 4} stroke={TEAL} strokeWidth="1.5" />
            <text x={planEndX} y={base + 16} textAnchor="middle" fontSize="9" fill={TEAL} fontWeight="800" {...font}>
              {planEndIdx}m ✓
            </text>
          </g>
        )}
        <text x={xAt(xMax)} y={base + 16} textAnchor="end" fontSize="9" fill="rgba(42,22,6,0.45)" {...font}>
          {xMax}m
        </text>
      </g>
    </svg>
  );
}

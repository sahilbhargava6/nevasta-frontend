'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calculator, Sparkles } from 'lucide-react';
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

const BLUE = '#2563EB';

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
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/credit-card/fixes" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Intro panel */}
        <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" aria-hidden /> AI-powered plan
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Pay More, <span className="text-blue-400">Save More.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your {outstanding > 0 ? fmtCompact(outstanding) : '₹X'} debt at {annualRate.toFixed(0)}%/yr costs you money every single day. Paying even a little more than the minimum rewrites your future — dramatically.
          </p>
        </div>

        {!plan ? (
          <div className="card-fintech p-5 sm:p-6 text-center">
            <div className="text-sm font-semibold text-slate-900 mb-2">Add your card balance first</div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">We need your outstanding balance to build your plan.</p>
            <Link href="/journey/credit-card" className="btn-accent">
              Add my cards <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            {/* Step 1: When debt-free? */}
            <div className="card-fintech p-5 sm:p-6">
              <StepBadge n={1} title="When do you want to be debt-free?" />

              <div role="tablist" aria-label="Plan by" className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-5">
                {(['deadline', 'amount'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                      tab === t ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t === 'deadline' ? 'By deadline' : 'By amount'}
                  </button>
                ))}
              </div>

              <div className="min-h-[110px]">
                {tab === 'deadline' ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-500">Debt-free in</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-blue-600 tabular-nums leading-none">{months}</span>
                        <span className="text-lg font-semibold text-blue-600">months</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={36}
                      value={Math.min(36, months)}
                      aria-label="Debt-free in months"
                      onChange={(e) => onSlider(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-500">1 mo</span>
                      <span className="text-xs text-slate-500">36 mo</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <label htmlFor="ccp-amount-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                    <div aria-live="polite" className="text-sm text-slate-600 text-center py-2">
                      {amountMsg}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 mt-4 mb-4 leading-relaxed min-h-[36px]">
                Clears all <strong className="text-slate-900">{fmtCompact(outstanding)}</strong> of card debt in <strong className="text-slate-900">{months} months</strong>. Minimum-only would take{' '}
                <strong className="text-rose-600">{plan.minResult.neverClears ? '50+ years' : `${plan.minResult.months} months`}</strong>.
              </p>

              <div className="rounded-2xl bg-slate-900 text-white p-5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">YOU&apos;D NEED TO PAY</div>
                <div className="text-3xl font-bold tabular-nums leading-none">{fmtINR(plan.pmt)}</div>
                <div className="text-xs text-slate-400 mt-1.5">
                  {plan.belowMin ? `/month · your bank requires min ${fmtINR(minDue)}` : '/month to clear this in time'}
                </div>
              </div>
            </div>

            {/* Step 2: Monthly plan breakdown */}
            <div className="card-fintech p-5 sm:p-6">
              <StepBadge n={2} title="Your monthly plan" />
              <p className="text-xs text-slate-500 -mt-2 mb-3">How your monthly payment breaks down:</p>
              <div className="mb-3">
                {plan.rows.map((row) => (
                  <div key={row.key} className="py-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex justify-between items-start mb-2.5 gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 break-words">{row.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {fmtCompact(row.outstanding)} · {row.rate.toFixed(0)}% yearly
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold text-blue-600 tabular-nums">{fmtINR(row.pay)}</div>
                        <div className="text-[11px] text-slate-500">/mo</div>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5 flex gap-0.5">
                      <div className="h-full bg-slate-400 shrink-0" style={{ width: `${row.minPct}%` }} />
                      {row.extra > 0 && <div className="h-full bg-blue-600 shrink-0" style={{ width: `${100 - row.minPct}%` }} />}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="badge-slate">Min {fmtINR(row.min)}</span>
                      {row.extra > 0 && <span className="badge-blue">+ {fmtINR(row.extra)} extra</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">Total per month</span>
                <span className="text-lg font-bold text-blue-600 tabular-nums">{fmtINR(plan.pmt)}</span>
              </div>
            </div>

            {/* Step 3: Plan vs minimum chart */}
            <div className="card-fintech p-5 sm:p-6">
              <StepBadge n={3} title="Your debt — plan vs minimum" />
              <p className="text-xs text-slate-500 -mt-2 mb-4">What happens to your balance on each path</p>
              <PlanChart planBals={plan.planBals} minBals={plan.minBals} planM={months} />
              <div className="flex gap-5 mt-3 mb-4 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-[3px] bg-blue-600 rounded-sm" />
                  <span className="text-xs font-medium text-slate-600">Your plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 border-t-2 border-dashed border-rose-500" />
                  <span className="text-xs font-medium text-slate-600">Minimum only</span>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">YOU SAVE ON INTEREST</div>
                <div className="text-3xl font-bold text-slate-900 tabular-nums leading-none mb-1.5">{fmtCompact(plan.interestSaved)}</div>
                <div className="text-sm text-slate-600 leading-snug">
                  {plan.monthsSaved > 0 ? (
                    <>
                      Debt-free <strong className="text-slate-900">{plan.minResult.neverClears ? 'years' : `${plan.monthsSaved} months`} sooner</strong> than paying the minimum
                    </>
                  ) : (
                    'vs. paying the minimum every month'
                  )}
                </div>
              </div>
            </div>

            {/* Navesta AI card */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">N</div>
                <span className="text-xs font-semibold text-blue-400">Navesta AI</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Paying <strong className="text-blue-400">{fmtINR(plan.pmt)}/month</strong> clears your {fmtCompact(outstanding)} debt in{' '}
                <strong className="text-blue-400">{months} months</strong>, saving you <strong className="text-emerald-400">{fmtCompact(plan.interestSaved)}</strong> in interest vs minimum payments.
                {plan.monthsSaved > 0 && !plan.minResult.neverClears && (
                  <>
                    {' '}That&apos;s <strong className="text-emerald-400">{plan.monthsSaved} months sooner</strong> than paying the minimum.
                  </>
                )}
              </p>
            </div>

            {/* Pay-More Simulator */}
            <Link href="/journey/credit-card/simulator" className="card-fintech-interactive flex items-center justify-between gap-3 p-4 sm:p-5">
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4 text-blue-600" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Try the Pay-More Simulator →</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Small change, big freedom</span>
                </span>
              </span>
            </Link>
          </>
        )}

        <button type="button" onClick={() => router.push('/journey/credit-card/fixes')} className="btn-secondary w-full">
          <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden /> Back to fixes
        </button>
      </main>
    </div>
  );
}

function StepBadge({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{n}</div>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
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
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} className="block max-w-full overflow-visible">
      <title>{label}</title>
      <g shapeRendering="geometricPrecision" textRendering="optimizeLegibility">
        <defs>
          <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity="0.18" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="minGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => {
          const val = (maxY / 1.1) * t;
          const yPos = yAt(val);
          return (
            <g key={t}>
              <line x1={padL} y1={yPos} x2={W - padR} y2={yPos} stroke="#E2E8F0" strokeWidth="1" />
              <text x={padL - 5} y={Math.round(yPos + 3.5)} textAnchor="end" fontSize="11" fill="#64748B" fontWeight="600" {...font}>
                {fmtAxis(val)}
              </text>
            </g>
          );
        })}

        <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="#E2E8F0" strokeWidth="1.2" />

        {planPath && <path d={`${planPath} L${planEndX.toFixed(1)},${base} L${xAt(0).toFixed(1)},${base} Z`} fill="url(#planGrad)" />}
        {minPath && <path d={`${minPath} L${minEndX.toFixed(1)},${base} L${xAt(0).toFixed(1)},${base} Z`} fill="url(#minGrad2)" />}

        {minPath && <path d={minPath} fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="5,3" strokeLinejoin="round" strokeLinecap="round" />}
        {planPath && <path d={planPath} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {planBals[planEndIdx] < 100 && (
          <g>
            <circle cx={planEndX} cy={planEndY} r="5" fill={BLUE} />
            <circle cx={planEndX} cy={planEndY} r="2.5" fill="#fff" />
            <text x={planEndX} y={Math.round(planEndY - 9)} textAnchor={planEndX > W * 0.7 ? 'end' : 'middle'} fontSize="11" fill={BLUE} fontWeight="800" {...font}>
              Debt-free!
            </text>
          </g>
        )}

        {minBals[minEndIdx] > 500 && (
          <g>
            <circle cx={minEndX} cy={minEndY} r="4.5" fill="#F43F5E" />
            <circle cx={minEndX} cy={minEndY} r="2" fill="#fff" />
            <text x={minEndX} y={Math.round(minEndY - 8)} textAnchor="end" fontSize="11" fill="#F43F5E" fontWeight="800" {...font}>
              Still {fmtCompact(minBals[minEndIdx])}
            </text>
          </g>
        )}

        <text x={xAt(0)} y={base + 16} textAnchor="start" fontSize="11" fill="#64748B" fontWeight="600" {...font}>
          Now
        </text>
        {planEndIdx > 1 && planEndIdx < xMax && (
          <g>
            <line x1={planEndX} y1={base} x2={planEndX} y2={base + 4} stroke={BLUE} strokeWidth="1.5" />
            <text x={planEndX} y={base + 16} textAnchor="middle" fontSize="11" fill={BLUE} fontWeight="800" {...font}>
              {planEndIdx}m ✓
            </text>
          </g>
        )}
        <text x={xAt(xMax)} y={base + 16} textAnchor="end" fontSize="11" fill="#64748B" {...font}>
          {xMax}m
        </text>
      </g>
    </svg>
  );
}

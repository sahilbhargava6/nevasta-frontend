'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Info, Landmark, Sparkles } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { fetchOffers } from '@/lib/applyOffer';
import { DEFAULT_CC_JOURNEY, fmtCompact, fmtINR, useJourney } from '@/lib/journey';
import { cardMinOnlyInterest, cardMonthlyRate, combineCards, pmtMonthly } from '@/lib/ccPlanMath';

/* "Switch to a Loan." — design #cc-loan-page (prototype lines ~6352–6542, JS ~9799–10169) */

/** Illustrative starting personal-loan rate used throughout the design. */
const LOAN_RATE_PCT = 10.75;
const LOAN_R = LOAN_RATE_PCT / 100 / 12;
const GRID = [6, 18, 60] as const;
const CHART_TENURES = [6, 12, 18, 24, 30, 36, 42, 48, 54, 60];

export default function CCSwitchToLoanPage() {
  return (
    <JourneyGate intent="debt-cc">
      <SwitchScreen />
    </JourneyGate>
  );
}

function SwitchScreen() {
  const router = useRouter();
  const [cc, , , ready] = useJourney('cc', DEFAULT_CC_JOURNEY);
  const combined = useMemo(() => combineCards(cc.cards), [cc.cards]);

  const outstanding = combined.outstanding;
  const cardRate = combined.rate > 0 ? combined.rate : 42;
  const income = Number(cc.income) || 0;
  const incomeKnown = income > 0;
  const takeHome = income * 0.72;
  const safeEmi = takeHome * 0.4;

  const minOnlyTotal = useMemo(() => cardMinOnlyInterest(outstanding, cardRate), [outstanding, cardRate]);

  // Best option: the shortest tenure whose EMI fits within 40% of take-home pay
  // (the prototype's loop never moved off 6 months).
  const best = useMemo(() => {
    if (!incomeKnown || outstanding <= 0) return { n: 6, custom: false, affordable: !incomeKnown };
    for (const n of GRID) if (pmtMonthly(outstanding, LOAN_R, n) <= safeEmi) return { n, custom: false, affordable: true };
    for (let n = 61; n <= 84; n++) if (pmtMonthly(outstanding, LOAN_R, n) <= safeEmi) return { n, custom: true, affordable: true };
    return { n: 60, custom: false, affordable: false };
  }, [incomeKnown, outstanding, safeEmi]);

  const [sel, setSel] = useState<number | 'custom' | null>(null);
  const [customMonthsState, setCustomMonths] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [lowestRate, setLowestRate] = useState<number | null>(null);

  const isCustom = sel === 'custom' || (sel === null && best.custom);
  const customMonths = customMonthsState ?? (best.custom ? best.n : 24);
  const tenure = isCustom ? customMonths : sel === null ? best.n : (sel as number);

  const calc = (n: number) => {
    const emi = pmtMonthly(outstanding, LOAN_R, n);
    const totalInt = emi * n - outstanding;
    return { emi, totalInt, saving: Math.max(0, minOnlyTotal - totalInt) };
  };
  const cur = calc(tenure);

  // Real partner offers for the amount and tenure (debounced while sliding)
  useEffect(() => {
    if (outstanding <= 0) return;
    let live = true;
    const t = setTimeout(() => {
      fetchOffers(outstanding, tenure)
        .then((offers) => {
          if (live) setLowestRate(offers.length ? Math.min(...offers.map((o) => o.offeredRatePercent)) : null);
        })
        .catch(() => {
          if (live) setLowestRate(null);
        });
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [outstanding, tenure]);

  if (!ready) return null;

  const pct = incomeKnown ? Math.round((cur.emi / takeHome) * 100) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/credit-card/fixes" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page heading */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            <Landmark className="w-4 h-4" aria-hidden /> Loan Optimiser
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Switch to a <span className="text-blue-600">Loan.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">Cut interest · check eligibility</p>
        </div>

        {outstanding <= 0 ? (
          <div className="card-fintech p-5 sm:p-6 text-center">
            <div className="text-sm font-semibold text-slate-900 mb-2">Add your card balance first</div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">We need your outstanding balance to compare a loan with your cards.</p>
            <Link href="/journey/credit-card" className="btn-accent">
              Add my cards <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            {/* AI-MATCHED REFINANCE card */}
            <div className="card-fintech p-5 sm:p-6">
              <span className="badge-amber mb-4">
                <Sparkles className="w-3.5 h-3.5" aria-hidden /> AI-MATCHED REFINANCE
              </span>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 min-w-0 rounded-lg bg-rose-50 border border-rose-200 p-4 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CARDS NOW</div>
                  <div className="text-xs text-slate-500 mb-1">avg. rate</div>
                  <div className="text-3xl font-bold text-rose-600 tabular-nums leading-none">{Math.round(cardRate)}%</div>
                  <div className="text-xs text-slate-500 mt-1">per year</div>
                  <div className="text-xs text-slate-500">no end date</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
                <div className="flex-1 min-w-0 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">PERSONAL LOAN</div>
                  <div className="text-xs text-slate-500 mb-1">Starts @</div>
                  <div className="text-3xl font-bold text-emerald-600 tabular-nums leading-none">{LOAN_RATE_PCT}%</div>
                  <div className="text-xs text-slate-500 mt-1">per year</div>
                  <div className="text-xs text-slate-500">{tenure} months</div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 text-white p-5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">YOU COULD SAVE</div>
                <div className="text-3xl font-bold text-emerald-400 tabular-nums leading-none mb-1.5">{fmtCompact(cur.saving)}</div>
                <div className="text-xs text-slate-400">
                  vs card minimum · EMI <span className="text-white font-semibold">{fmtINR(cur.emi)}/mo</span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 mt-4 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-px" aria-hidden />
                <div>
                  <div className="leading-relaxed">Starts @{LOAN_RATE_PCT}% per year — your actual rate is confirmed after the lender reviews your profile</div>
                  {lowestRate !== null && <div className="font-semibold text-emerald-700 mt-1.5">Lowest rate from our partners: {lowestRate}% p.a.</div>}
                </div>
              </div>
            </div>

            {/* Pick your plan */}
            <div className="card-fintech p-5 sm:p-6">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">PICK YOUR PLAN</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">How long do you want to take?</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {GRID.map((n) => {
                  const c = calc(n);
                  const selected = !isCustom && tenure === n;
                  return (
                    <PlanCard
                      key={n}
                      selected={selected}
                      best={!best.custom && best.n === n}
                      onClick={() => setSel(n)}
                      title={`${n} months`}
                      emi={c.emi}
                      sub={`saves ${fmtCompact(c.saving)}`}
                    />
                  );
                })}
                <PlanCard
                  selected={isCustom}
                  best={best.custom}
                  onClick={() => setSel('custom')}
                  title="Choose myself"
                  emi={isCustom ? cur.emi : null}
                  sub={isCustom ? `saves ${fmtCompact(cur.saving)} · ${customMonths}m` : 'choose months'}
                />
              </div>

              {isCustom && (
                <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <label htmlFor="ccl-custom-months" className="block text-xs font-semibold text-slate-700">
                      Choose tenure
                    </label>
                    <span className="text-base font-bold text-blue-600 tabular-nums">
                      {customMonths} month{customMonths === 1 ? '' : 's'}
                    </span>
                  </div>
                  <input
                    id="ccl-custom-months"
                    type="range"
                    min={3}
                    max={84}
                    value={customMonths}
                    onChange={(e) => setCustomMonths(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500">3m</span>
                    <span className="text-xs text-slate-500">84m</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Numbers based on a starting rate of {LOAN_RATE_PCT}% — your actual rate is confirmed by the lender after review.
              </p>
            </div>

            {/* Optimisation insight */}
            <div className="card-fintech p-5 sm:p-6">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">OPTIMISATION INSIGHT</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-3">Why {tenure} months?</h2>
              <div className="text-sm text-slate-600 leading-relaxed mb-4">
                {pct === null ? (
                  <>Add your monthly income on the earlier step to see the shortest tenure your income supports — we keep your EMI within a safe 40% of take-home pay.</>
                ) : pct <= 40 ? (
                  tenure === best.n ? (
                    <>
                      {tenure} months is the <strong className="text-slate-900">shortest tenure your income supports</strong> — keeping your EMI within a safe 40% of take-home pay (yours: {pct}%). Shorter tenure = less total interest. This is your sweet spot.
                    </>
                  ) : (
                    <>
                      At {tenure} months your EMI is {pct}% of take-home — within the safe 40% limit. {best.affordable && best.n < tenure ? `${best.n} months is the shortest tenure your income supports and saves more interest.` : 'Shorter tenure = less total interest.'}
                    </>
                  )
                ) : (
                  <>
                    At {tenure} months, your EMI is {pct}% of take-home — above the 40% safety threshold. Consider a longer tenure to keep repayments comfortable.
                  </>
                )}
              </div>

              <TenureBars outstanding={outstanding} safeEmi={incomeKnown ? safeEmi : Infinity} selected={tenure} best={best.affordable && incomeKnown ? best.n : null} />
            </div>

            {/* Toggle comparison */}
            <button
              type="button"
              onClick={() => setShowCompare((v) => !v)}
              aria-expanded={showCompare}
              className="btn-secondary w-full"
            >
              {showCompare ? 'Hide comparison' : 'Show comparison'}
              <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform ${showCompare ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            {showCompare && <Comparison outstanding={outstanding} cardRate={cardRate} loanMonths={tenure} minOnlyTotal={minOnlyTotal} />}

            {/* Next step */}
            <div className="card-fintech p-5 sm:p-6">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">NEXT STEP</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Compare loan offers from banks &amp; NBFCs</h2>
              <button type="button" onClick={() => router.push(`/journey/credit-card/offers?tenure=${tenure}`)} className="btn-accent w-full sm:w-auto">
                See offers <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PlanCard(props: { selected: boolean; best: boolean; onClick: () => void; title: string; emi: number | null; sub: string }) {
  const { selected, best, onClick, title, emi, sub } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
        selected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white hover:border-slate-300'
      } ${best ? 'mt-2' : ''}`}
    >
      {best && <span className="badge-emerald absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">★ Best option</span>}
      <div className={`text-sm font-semibold mb-1 ${selected ? 'text-blue-700' : 'text-slate-900'}`}>{title}</div>
      <div className="text-lg font-bold text-slate-900 tabular-nums">
        <span className="text-xs">₹</span>
        {emi === null ? '–' : Math.round(emi).toLocaleString('en-IN')}
        <span className="text-xs text-slate-500">/mo</span>
      </div>
      <div className="text-xs font-medium text-emerald-600 mt-1">{sub}</div>
    </button>
  );
}

/** Design cclRenderChart(): total loan interest by tenure, greyed where the EMI is too high for income. */
function TenureBars({ outstanding, safeEmi, selected, best }: { outstanding: number; safeEmi: number; selected: number; best: number | null }) {
  const data = CHART_TENURES.map((n) => {
    const emi = pmtMonthly(outstanding, LOAN_R, n);
    return { n, totalInt: emi * n - outstanding, affordable: emi <= safeEmi };
  });
  const maxInt = data[data.length - 1].totalInt || 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[11px] text-slate-500">← total over loan term (less = better)</div>
        <div className="text-[11px] font-semibold text-emerald-600">+ Optimal</div>
      </div>
      {data.map((row) => {
        const barW = Math.max(4, Math.round((row.totalInt / maxInt) * 100));
        const isSel = row.n === selected;
        const isOpt = best !== null ? row.n === best : isSel;
        const barClass = !row.affordable ? 'bg-slate-300' : isSel ? 'bg-blue-600' : 'bg-blue-300';
        const textClass = isSel ? 'text-blue-700 font-bold' : row.affordable ? 'text-slate-600 font-semibold' : 'text-slate-400 font-semibold';
        return (
          <div key={row.n} className="flex items-center gap-2" title={`${row.n} months: ${fmtINR(row.totalInt)} total interest${row.affordable ? '' : ' (EMI too high for income)'}`}>
            <div className={`text-[11px] w-10 shrink-0 ${textClass}`}>
              {row.n}m{isOpt && <span className="text-blue-600"> ★</span>}
            </div>
            <div className="flex-1 h-2.5 bg-slate-100 rounded overflow-hidden">
              <div className={`h-full rounded transition-all duration-300 ${barClass}`} style={{ width: `${barW}%` }} />
            </div>
            <div className={`text-[11px] text-right min-w-[60px] tabular-nums ${textClass}`}>{fmtINR(row.totalInt)}</div>
          </div>
        );
      })}
      <div className="flex gap-4 mt-2.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 bg-blue-600 rounded-sm" />
          <span className="text-[11px] text-slate-500">Affordable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 bg-slate-300 rounded-sm" />
          <span className="text-[11px] text-slate-500">EMI too high for income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-blue-600">★</span>
          <span className="text-[11px] text-slate-500">Optimal point</span>
        </div>
      </div>
    </div>
  );
}

/** Design cclDrawLineChart(): cumulative interest, loan vs cards on minimum only. */
function Comparison({ outstanding, cardRate, loanMonths, minOnlyTotal }: { outstanding: number; cardRate: number; loanMonths: number; minOnlyTotal: number }) {
  const cardR = cardMonthlyRate(cardRate);
  const loanEMI = pmtMonthly(outstanding, LOAN_R, loanMonths);
  const minPay = Math.max(outstanding * 0.05, 200);

  const loanPts = [{ m: 0, v: 0 }];
  const cardPts = [{ m: 0, v: 0 }];
  let loanBal = outstanding;
  let cardBal = outstanding;
  let loanCum = 0;
  let cardCum = 0;
  for (let i = 1; i <= loanMonths; i++) {
    if (loanBal > 0.01) {
      const li = loanBal * LOAN_R;
      loanCum += li;
      loanBal = Math.max(0, loanBal + li - loanEMI);
    }
    if (cardBal > 0.01) {
      const ci = cardBal * cardR;
      cardCum += ci;
      const pay = Math.min(minPay, cardBal + ci);
      cardBal = Math.max(0, cardBal + ci - pay);
    }
    loanPts.push({ m: i, v: loanCum });
    cardPts.push({ m: i, v: cardCum });
  }

  let maxV = Math.max(cardCum, loanCum) * 1.08;
  if (!maxV || maxV <= 0) maxV = outstanding;
  const pad = { l: 55, r: 10, t: 10, b: 30 };
  const W = 320;
  const H = 180;
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const px = (m: number) => pad.l + (m / loanMonths) * cw;
  const py = (v: number) => pad.t + ch - (v / maxV) * ch;

  // ~4 evenly spaced "nice" ticks
  const raw = maxV / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const yTicks: number[] = [];
  for (let t = 0; t <= maxV; t += step) yTicks.push(t);
  const fmtY = (v: number) => (v >= 100000 ? '₹' + (v / 100000).toFixed(1).replace('.0', '') + 'L' : '₹' + Math.round(v).toLocaleString('en-IN'));

  const xTicks = Array.from(new Set([0, Math.round(loanMonths / 2), loanMonths]));
  const line = (pts: { m: number; v: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.m).toFixed(1)} ${py(p.v).toFixed(1)}`).join(' ');
  const greenArea = `${line(loanPts)} L ${px(loanMonths).toFixed(1)} ${py(0).toFixed(1)} Z`;
  const lp = loanPts[loanPts.length - 1];
  const cp = cardPts[cardPts.length - 1];
  const totalSaving = Math.max(0, minOnlyTotal - lp.v);
  const label = `Cumulative interest over ${loanMonths} months: ${fmtINR(lp.v)} with a loan versus ${fmtINR(cp.v)} on cards paying the minimum.`;

  return (
    <div className="card-fintech p-5 sm:p-6">
      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">INTEREST YOU&apos;D PAY</div>
      <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-3">Card route vs Loan route</h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        Cards only — interest piles up with no end date. With a loan — fixed end, far less total interest.
      </p>

      <div className="relative w-full overflow-hidden mb-3">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label} className="block">
          <title>{label}</title>
          {yTicks.map((t) => {
            const y = py(t);
            if (y < pad.t || y > pad.t + ch + 2) return null;
            return (
              <g key={t}>
                <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E2E8F0" strokeWidth="1" />
                <text x={pad.l - 4} y={y + 4} fontSize="11" fill="#64748B" textAnchor="end">
                  {fmtY(t)}
                </text>
              </g>
            );
          })}
          {xTicks.map((m) => {
            const isSel = m === loanMonths;
            return (
              <text key={m} x={px(m)} y={H - pad.b + 14} fontSize="11" fontWeight={isSel ? 800 : 400} fill={isSel ? '#0F172A' : '#64748B'} textAnchor={m === 0 ? 'start' : isSel ? 'end' : 'middle'}>
                {m}m
              </text>
            );
          })}
          <path d={greenArea} fill="rgba(16,185,129,0.10)" />
          <path d={line(cardPts)} fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={line(loanPts)} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={px(lp.m)} cy={py(lp.v)} r="4" fill="#10B981" />
          <text x={px(lp.m) - 6} y={py(lp.v) - 8} fontSize="11" fontWeight="700" fill="#10B981" textAnchor="end">
            {fmtINR(lp.v)}
          </text>
          <circle cx={px(cp.m)} cy={py(cp.v)} r="4" fill="#F43F5E" />
          <text x={px(cp.m) - 6} y={py(cp.v) - 8} fontSize="11" fontWeight="700" fill="#F43F5E" textAnchor="end">
            {fmtINR(cp.v)}
          </text>
        </svg>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-[3px] bg-emerald-500 rounded-sm" />
          <span className="text-xs text-slate-600">With a loan ({LOAN_RATE_PCT}% illustrated)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-[3px] bg-rose-500 rounded-sm" />
          <span className="text-xs text-slate-600">Cards · minimum only</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        After <strong className="text-slate-900">{loanMonths} months</strong> the loan is fully cleared. On cards only, you&apos;d still owe <strong className="text-slate-900">{fmtCompact(cardBal)}</strong> and have paid{' '}
        <strong className="text-slate-900">{fmtINR(cp.v)}</strong> in interest by then.
      </p>

      <div className="rounded-2xl bg-slate-900 text-white p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1.5">YOU SAVE</div>
        <div className="text-3xl font-bold text-emerald-400 tabular-nums leading-none mb-1.5">{fmtCompact(totalSaving)}</div>
        <div className="text-xs text-slate-400 leading-relaxed">vs staying on card minimum · illustrated at {LOAN_RATE_PCT}% p.a. (your rate will vary)</div>
      </div>
    </div>
  );
}

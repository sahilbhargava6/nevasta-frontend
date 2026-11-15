'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronDown, Layers, PiggyBank, RefreshCw, TrendingDown } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_LOAN_JOURNEY, fmtCompact, useJourney, type LoanJourney } from '@/lib/journey';
import { fetchOffers, type Offer } from '@/lib/applyOffer';
import { FIXES_TYPE_LABEL, analyzeLoan, fmtRate, interestSavedAtRate, isUsableLoan, payChartSeries, simulatePrepay, type PayPoint } from '@/lib/loanMath';

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

const CHIPS = [
  { label: '10%', pct: 0.1 },
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.5 },
  { label: 'Close', pct: 1, sub: 'full loan' },
];

export default function LoanFixesPage() {
  return (
    <JourneyGate intent="debt-loan">
      <LoanFixes />
    </JourneyGate>
  );
}

function LoanFixes() {
  const router = useRouter();
  const [loan, , , ready] = useJourney<LoanJourney>('loan', DEFAULT_LOAN_JOURNEY);
  const [chartOpen, setChartOpen] = useState(false);
  const [prepayOpen, setPrepayOpen] = useState(true);
  const [prepay, setPrepay] = useState('');
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);

  const usable = isUsableLoan(loan);

  // Default prepayment: 10% of outstanding (lfBuildChips)
  useEffect(() => {
    if (ready) setPrepay(String(Math.round(loan.outstanding * 0.1)));
  }, [ready, loan.outstanding]);

  // Real lenders instead of the prototype's hard-coded 9.9%
  useEffect(() => {
    if (!ready || !usable) return;
    let alive = true;
    setOffers(null);
    setOffersError(null);
    fetchOffers(loan.outstanding, loan.tenureLeft)
      .then((list) => alive && setOffers(list))
      .catch((err: Error) => alive && setOffersError(err.message || 'Could not load lender rates'));
    return () => {
      alive = false;
    };
  }, [ready, usable, loan.outstanding, loan.tenureLeft]);

  if (!ready) return null;

  const typeStr = FIXES_TYPE_LABEL[loan.loanType] ?? 'PERSONAL';
  const a = analyzeLoan(loan);
  const pp = Math.round(a.principalPct);
  const ip = 100 - pp;
  const prepayNum = parseFloat(prepay) || 0;
  const sim = simulatePrepay(loan, prepayNum);
  const activeChip = CHIPS.findIndex((c) => Math.round(loan.outstanding * c.pct) === Math.round(prepayNum));

  const best = offers && offers.length ? offers[0] : null;
  const better = best && best.offeredRatePercent < loan.rate ? best : null;
  const btSave = better ? interestSavedAtRate(loan, better.offeredRatePercent) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/loan/analysis" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Layers className="w-4 h-4" aria-hidden />
            {typeStr} · LOAN FIXES
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your Loan Fixes</h1>
          <p className="text-sm text-slate-600 leading-relaxed">Refinance · prepay · restructure · foreclose</p>
        </div>

        {!usable ? (
          <div className="card-fintech p-5 sm:p-6 text-center space-y-4">
            <p className="text-sm text-slate-600">We need your outstanding amount, tenure left and interest rate first.</p>
            <Link href="/journey/loan" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Enter loan details →
            </Link>
          </div>
        ) : (
          <>
            {/* LOAN SNAPSHOT dark card */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">{typeStr} · LOAN SNAPSHOT</div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-lg sm:text-2xl font-bold tabular-nums">₹{fmt(loan.outstanding)}</div>
                  <div className="text-xs text-slate-400 mt-1">Outstanding</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-lg sm:text-2xl font-bold tabular-nums">{fmtRate(loan.rate)}% yearly</div>
                  <div className="text-xs text-slate-400 mt-1">Interest rate</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-lg sm:text-2xl font-bold tabular-nums">₹{fmt(a.emi)}/mo</div>
                  <div className="text-xs text-slate-400 mt-1">Monthly EMI</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-lg sm:text-2xl font-bold tabular-nums">{loan.tenureLeft} months</div>
                  <div className="text-xs text-slate-400 mt-1">Remaining tenure</div>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden mb-2" role="img" aria-label={`Principal ${pp}%, interest ${ip}%`}>
                <div className="bg-emerald-400 transition-all duration-500" style={{ width: `${pp}%` }} />
                <div className="bg-rose-400 flex-1" />
              </div>
              <div className="flex justify-between flex-wrap gap-2 mb-3 text-sm">
                <div className="text-slate-300">Principal {pp}%</div>
                <div className="text-rose-400 font-semibold">
                  Interest {ip}% = ₹{fmt(a.totalInterest)}
                </div>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">Of every rupee you repay from here, {ip}¢ goes to interest. The tools below help cut that.</div>
            </div>

            {/* WHAT YOU'LL HAND OVER chart (accordion) */}
            <div className="card-fintech overflow-hidden">
              <button
                type="button"
                aria-expanded={chartOpen}
                onClick={() => setChartOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-3 p-5 sm:p-6 text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Keep Paying the EMI</div>
                  <div className="text-sm font-semibold text-slate-900">What you&apos;ll hand over</div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${chartOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {chartOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <div className="text-xs text-slate-500 mb-3">Cumulative paid vs balance remaining, month by month.</div>
                  <div className="flex gap-5 mb-3">
                    <Legend color="#2563EB" label="Paid to Bank" />
                    <Legend color="#F43F5E" label="Still Owed" />
                  </div>
                  <PayChart points={payChartSeries(loan)} />
                </div>
              )}
            </div>

            {/* PART-PREPAYMENT */}
            <div className="card-fintech p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-expanded={prepayOpen}
                  aria-controls="lf-prepay-body"
                  onClick={() => setPrepayOpen((o) => !o)}
                  className="flex flex-1 min-w-0 items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" aria-hidden>
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Part-prepayment</div>
                    <div className="text-xs text-slate-500 mt-0.5">Lump sum → cuts principal &amp; interest</div>
                  </div>
                  <span className="btn-secondary whitespace-nowrap">Simulate</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${prepayOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              </div>

              {prepayOpen && (
                <div id="lf-prepay-body" className="mt-5 pt-5 border-t border-slate-200 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Prepayment simulator</div>
                    <p className="text-sm text-slate-600 leading-relaxed">A lump-sum goes straight to your principal — shrinks interest and ends the loan sooner. Try any amount.</p>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium" aria-hidden>
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      aria-label="Prepayment amount in rupees"
                      placeholder="0"
                      value={prepay}
                      onChange={(e) => setPrepay(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CHIPS.map((c, i) => {
                      const amt = Math.round(loan.outstanding * c.pct);
                      const active = i === activeChip;
                      return (
                        <button
                          type="button"
                          key={c.label}
                          aria-pressed={active}
                          onClick={() => setPrepay(String(amt))}
                          className={`rounded-xl border-2 p-3 text-center transition-all cursor-pointer min-w-0 ${
                            active ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-bold text-slate-900">{c.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">{c.sub || fmtCompact(amt)}</div>
                        </button>
                      );
                    })}
                  </div>

                  {sim && (
                    <>
                      <div className="rounded-2xl bg-slate-900 text-white p-5 text-center">
                        <div className="text-xs text-slate-400 uppercase tracking-wider">You save</div>
                        <div className="text-3xl font-bold tabular-nums text-emerald-400 mt-1">₹{fmt(sim.saved)}</div>
                        <div className="text-sm text-slate-300 mt-1">in interest · loan closes {sim.monthsFreed} months sooner</div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <div className="text-[11px] font-medium text-slate-500">New tenure</div>
                          <div className="text-lg font-bold text-blue-600 tabular-nums">{sim.newTenure} months</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <div className="text-[11px] font-medium text-slate-500">Months freed</div>
                          <div className="text-lg font-bold text-slate-900 tabular-nums">{sim.monthsFreed} months</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <div className="text-[11px] font-medium text-slate-500">Interest before</div>
                          <div className="text-lg font-bold text-slate-900 tabular-nums">₹{fmt(a.totalInterest)}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <div className="text-[11px] font-medium text-slate-500">Interest after</div>
                          <div className="text-lg font-bold text-emerald-600 tabular-nums">₹{fmt(sim.newInterest)}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500 w-10 shrink-0">Before</div>
                          <div className="flex-1 h-2 rounded-full bg-rose-500" />
                          <div className="text-xs font-semibold text-rose-600 whitespace-nowrap tabular-nums">₹{fmt(a.totalInterest)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500 w-10 shrink-0">After</div>
                          <div className="flex-1 flex">
                            <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${sim.afterPct}%` }} />
                          </div>
                          <div className="text-xs font-semibold text-emerald-600 whitespace-nowrap tabular-nums">₹{fmt(sim.newInterest)}</div>
                        </div>
                        <div className="text-xs text-slate-500 text-center pt-1">
                          A {sim.prepayPct}% prepayment eliminates {sim.savePct}% of remaining interest
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* BALANCE TRANSFER card */}
            <div className="card-fintech p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" aria-hidden>
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Balance transfer</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {better
                      ? `Move ${fmtRate(loan.rate)}% → ${fmtRate(better.offeredRatePercent)}% · save on interest`
                      : offers && !better
                        ? 'Your rate is already competitive — no better offers found.'
                        : 'Move to a lower-rate lender · save on interest'}
                  </div>
                </div>
                {better && <span className="badge-emerald whitespace-nowrap">Save ₹{fmt(btSave)}</span>}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                  <div className="text-[11px] font-medium text-slate-500 uppercase mb-1">Your rate now</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{fmtRate(loan.rate)}%</div>
                </div>
                <TrendingDown className="w-5 h-5 text-slate-400" aria-hidden />
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                  <div className="text-[11px] font-medium text-emerald-700 uppercase mb-1">Best available</div>
                  <div className="text-2xl font-bold text-emerald-600 tabular-nums">{best ? `${fmtRate(best.offeredRatePercent)}%` : offersError || (offers && !best) ? '—' : '…'}</div>
                </div>
              </div>
              {offersError && (
                <div role="alert" className="text-xs font-medium text-rose-600 text-center">
                  {offersError}
                </div>
              )}
              <button type="button" onClick={() => router.push('/journey/loan/balance-transfer')} className="btn-accent w-full sm:w-auto">
                Check Eligibility for Balance Transfer
                <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
              </button>
            </div>
          </>
        )}

        <button type="button" onClick={() => router.push('/journey/loan')} className="btn-secondary w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden />
          Edit loan details
        </button>
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="6" className="shrink-0" aria-hidden>
        <line x1="0" y1="3" x2="24" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="3" r="3" fill={color} />
      </svg>
      <span className="text-[11px] font-medium text-slate-600">{label}</span>
    </div>
  );
}

/** Paid-to-bank vs still-owed line chart (lfRenderPayChart). */
function PayChart({ points }: { points: PayPoint[] }) {
  if (points.length < 2) return null;
  const W = 320;
  const H = 210;
  const padL = 14;
  const padR = 14;
  const padT = 34;
  const padB = 26;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const N = points.length;
  const maxV = Math.max(...points.map((p) => Math.max(p.owed, p.paid))) * 1.25;
  if (!maxV) return null;
  const xAt = (i: number) => padL + (i / (N - 1)) * cW;
  const yAt = (v: number) => padT + cH - (v / maxV) * cH;
  const fmtV = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : `₹${Math.round(v).toLocaleString('en-IN')}`);
  const oPts = points.map((p, i) => ({ x: Math.round(xAt(i)), y: Math.round(yAt(p.owed)) }));
  const pPts = points.map((p, i) => ({ x: Math.round(xAt(i)), y: Math.round(yAt(p.paid)) }));
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const fill = (pts: { x: number; y: number }[]) => `${line(pts)} L${pts[N - 1].x},${padT + cH} L${pts[0].x},${padT + cH} Z`;
  const base = padT + cH;
  const font = 'Inter,sans-serif';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="block max-w-full overflow-hidden"
      shapeRendering="geometricPrecision"
      textRendering="optimizeLegibility"
      role="img"
      aria-label={`Over ${points[N - 1].month} months you pay ${fmtV(points[N - 1].paid)} to the bank; ${fmtV(points[N - 1].owed)} is still owed.`}
    >
      <defs>
        <linearGradient id="lfOGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lfPGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {points.map((_, i) => (
        <line key={`g${i}`} x1={xAt(i).toFixed(1)} y1={padT} x2={xAt(i).toFixed(1)} y2={base} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
      ))}
      <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="#E2E8F0" strokeWidth="1" />
      <path d={fill(oPts)} fill="url(#lfOGrad)" />
      <path d={fill(pPts)} fill="url(#lfPGrad)" />
      <path d={line(oPts)} fill="none" stroke="#F43F5E" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line(pPts)} fill="none" stroke="#2563EB" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        const anchor = i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle';
        const o = oPts[i];
        const b = pPts[i];
        const blueAbove = b.y < o.y;
        return (
          <g key={`d${i}`}>
            <circle cx={o.x} cy={o.y} r="5.5" fill="#F43F5E" stroke="#fff" strokeWidth="2" />
            <text x={o.x} y={o.y - 11} textAnchor={anchor} fontSize="10.5" fill="#F43F5E" fontWeight="800" fontFamily={font}>
              {fmtV(p.owed)}
            </text>
            <circle cx={b.x} cy={b.y} r="5.5" fill="#2563EB" stroke="#fff" strokeWidth="2" />
            <text x={b.x} y={blueAbove ? b.y - 11 : b.y + 16} textAnchor={anchor} fontSize="10.5" fill="#2563EB" fontWeight="800" fontFamily={font}>
              {fmtV(p.paid)}
            </text>
            <text x={o.x} y={base + 16} textAnchor={anchor} fontSize="10.5" fill="#64748B" fontFamily={font}>
              {p.month}M
            </text>
          </g>
        );
      })}
    </svg>
  );
}

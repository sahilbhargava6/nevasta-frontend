'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { fmtINR, useJourney, type CardEntry } from '@/lib/journey';
import { EMPTY_CC_JOURNEY, fmtLakh, hasCardDetails, minPayProjection, monthlySplit, weightedCard } from '@/lib/ccMath';
import { ArrowRight, CheckCircle2, CreditCard, Info, Landmark } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CCAnalysisPage() {
  return (
    <JourneyGate intent="debt-cc">
      <Analysis />
    </JourneyGate>
  );
}

function Analysis() {
  const router = useRouter();
  const [journey, , , ready] = useJourney('cc', EMPTY_CC_JOURNEY);
  const [tab, setTab] = useState<'cards' | 'know'>('cards');
  const filled = hasCardDetails(journey);

  useEffect(() => {
    if (ready && !filled) router.replace('/journey/credit-card');
  }, [ready, filled, router]);

  if (!ready || !filled) return <div className="min-h-screen bg-slate-50" />;

  const cards = journey.cards.filter((c) => c.outstanding > 0);
  const d = weightedCard(cards);
  const split = monthlySplit(d.outstanding, d.rate, d.minDue);
  const m3 = new Date();
  m3.setDate(1);
  m3.setMonth(m3.getMonth() + 3);
  const patternL = ((d.outstanding * 0.43) / 100000).toFixed(1);
  const limitPct = d.limit > 0 ? Math.round((d.outstanding / d.limit) * 100) : null;

  const income = journey.income;
  const debtMult = income > 0 ? d.outstanding / income : 0;
  const debtMultR = (Math.round(debtMult * 10) / 10).toFixed(1);
  const barPct = Math.min(98, (debtMult / 4) * 100);

  const tabCls = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-xs font-medium ${active ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/credit-card" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page heading */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            <CreditCard className="w-4 h-4" aria-hidden /> Your Credit-Card Debt
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Where your money <span className="text-blue-600">really</span> goes.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">Analysing your cards · a pattern worth ₹{patternL}L</p>
        </div>

        {/* Payment breakdown card */}
        <section className="card-fintech p-5 sm:p-6">
          <div className="text-center text-xs font-medium text-slate-500 mb-1">This month you paid</div>
          <div className="text-center text-4xl sm:text-5xl font-bold text-slate-900 tabular-nums mb-5">{fmtINR(d.minDue)}</div>

          <div
            role="img"
            aria-label={`${split.intPct}% of your payment goes to interest and GST, ${split.clearedPct}% clears debt`}
            className="flex h-2.5 rounded-full overflow-hidden bg-slate-200 mb-2"
          >
            <div className="bg-rose-500" style={{ width: `${split.intPct}%` }} />
            <div className="bg-emerald-500 flex-1" />
          </div>
          <div className="flex justify-between mb-4">
            <div className="text-[11px] font-semibold text-rose-600 tracking-wide">▶ INTEREST + GST</div>
            <div className="text-[11px] font-semibold text-emerald-600 tracking-wide">DEBT CLEARED ◀</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-center">
              <Landmark className="w-5 h-5 text-rose-600 mx-auto mb-2" aria-hidden />
              <div className="text-[11px] font-semibold text-rose-800 tracking-wide mb-2">INTEREST + GST</div>
              <div className="text-xl font-bold text-rose-600 tabular-nums">{fmtINR(split.interestGST)}</div>
              <div className="text-xs text-rose-700 mt-1">{split.intPct}% of payment</div>
              <div className="text-[11px] text-rose-700/70 mt-1.5 leading-snug">({(d.rate / 12).toFixed(2)}%/mo + 18% GST)</div>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-2" aria-hidden />
              <div className="text-[11px] font-semibold text-emerald-800 tracking-wide mb-2">DEBT CLEARED</div>
              <div className="text-xl font-bold text-emerald-600 tabular-nums">{fmtINR(split.cleared)}</div>
              <div className="text-xs text-emerald-700 mt-1">{split.clearedPct}% of payment</div>
              <div className="text-[11px] text-emerald-700/70 mt-1.5 leading-snug">
                Reduces your
                <br />
                outstanding
              </div>
            </div>
          </div>
        </section>

        {/* Debt trajectory card */}
        <section className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">You owe today</div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums">{fmtINR(d.outstanding)}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" aria-hidden />
            <div className="text-right min-w-0">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">You&apos;ll owe in {MONTHS[m3.getMonth()]}</div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-rose-400">{fmtINR(split.owe3m)}</div>
            </div>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed border-t border-slate-700 pt-4">
            Three more payments of about {fmtINR(d.minDue)} — and your debt barely moves.
          </div>
        </section>

        {/* CTA */}
        <div>
          <button type="button" onClick={() => router.push('/journey/credit-card/fixes')} className="btn-accent w-full">
            Show me how to fix this <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
          </button>
          <div className="text-center mt-2 text-xs text-slate-500">Your personalised debt escape plan</div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Card analysis" className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button type="button" role="tab" id="cca-tab-cards" aria-selected={tab === 'cards'} aria-controls="cca-panel-cards" onClick={() => setTab('cards')} className={tabCls(tab === 'cards')}>
            Your cards
          </button>
          <button type="button" role="tab" id="cca-tab-know" aria-selected={tab === 'know'} aria-controls="cca-panel-know" onClick={() => setTab('know')} className={tabCls(tab === 'know')}>
            Know more
          </button>
        </div>

        {tab === 'cards' && (
          <div id="cca-panel-cards" role="tabpanel" aria-labelledby="cca-tab-cards">
            <div className="card-fintech p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-900">Your cards</span>
                {cards.length > 1 && <span className="text-xs text-slate-500">swipe →</span>}
              </div>

              <div className={`flex gap-3 overflow-x-auto snap-x snap-mandatory mb-5 ${cards.length > 1 ? 'pb-1' : ''}`}>
                {cards.map((c, i) => (
                  <CardVisual key={i} card={c} />
                ))}
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-sm font-semibold text-slate-900">Card limit used</span>
                  <span title="Outstanding ÷ Credit limit" aria-label="Outstanding divided by credit limit" className="inline-flex items-center text-slate-400">
                    <Info className="w-4 h-4" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-slate-900 ml-0.5 tabular-nums">{limitPct === null ? '—' : `${limitPct}%`}</span>
                </div>
                <div className="relative flex h-2.5 rounded-full overflow-hidden bg-slate-200 mb-1.5">
                  <div className="bg-emerald-500 w-[30%]" />
                  <div className="bg-amber-500 w-[40%]" />
                  <div className="bg-rose-500 flex-1" />
                </div>
                {limitPct !== null && (
                  <div className="relative h-0">
                    <div className="absolute -top-[18px] w-1 h-4 bg-slate-900 rounded-sm -translate-x-1/2" style={{ left: `${Math.min(96, limitPct)}%` }} />
                  </div>
                )}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] font-semibold text-emerald-600">Good &lt;30%</span>
                  <span className="text-[11px] font-semibold text-amber-600">Watch 30–70%</span>
                  <span className="text-[11px] font-semibold text-rose-600">High</span>
                </div>
                {limitPct === null && <div className="text-xs text-slate-500 mt-2">Add your credit limit on the previous step to see how much of it you use.</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'know' && (
          <div id="cca-panel-know" role="tabpanel" aria-labelledby="cca-tab-know" className="space-y-6">
            {/* Reality check: Debt vs income */}
            <section className="card-fintech p-5 sm:p-6">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Reality Check</div>
              <div className="flex justify-between items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-slate-900">Debt vs income</h2>
                <span className="badge-amber whitespace-nowrap">{debtMultR}x income</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Monthly Income</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{fmtINR(income)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">You Owe</div>
                  <div className="text-lg font-bold text-rose-600 tabular-nums">{fmtINR(d.outstanding)}</div>
                </div>
              </div>
              <div className="relative mb-1.5">
                <div className="flex h-2 rounded overflow-hidden">
                  <div className="bg-emerald-500 w-1/4" />
                  <div className="bg-amber-400 w-1/4" />
                  <div className="bg-orange-500 w-1/4" />
                  <div className="bg-rose-500 w-1/4" />
                </div>
                <div className="absolute -top-1 w-3.5 h-4 bg-slate-900 rounded-sm -translate-x-1/2" style={{ left: `${barPct.toFixed(1)}%` }} />
              </div>
              <div className="flex justify-between mb-3">
                {['0×', '1×', '2×', '3×', '4×'].map((t) => (
                  <span key={t} className="text-[11px] text-slate-500">
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                You&apos;d need <strong>{debtMultR} months</strong> of your entire income to clear this outright.
              </div>
            </section>

            {/* Keep paying the minimum */}
            <section className="card-fintech p-5 sm:p-6">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Keep Paying the Minimum</div>
              <h2 className="text-sm font-semibold text-slate-900">What you&apos;ll hand over</h2>
              <div className="text-xs text-slate-500 mt-1 mb-3.5">Amount paid vs debt remaining, month by month.</div>
              <div className="flex gap-5 mb-3">
                <div className="flex items-center gap-2">
                  <svg width="24" height="6" aria-hidden>
                    <line x1="0" y1="3" x2="24" y2="3" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="12" cy="3" r="3" fill="#2563EB" />
                  </svg>
                  <span className="text-[11px] font-medium text-slate-600">Paid to Bank</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="6" aria-hidden>
                    <line x1="0" y1="3" x2="24" y2="3" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="12" cy="3" r="3" fill="#F43F5E" />
                  </svg>
                  <span className="text-[11px] font-medium text-slate-600">Still Owed</span>
                </div>
              </div>
              <MinPayChart outstanding={d.outstanding} rate={d.rate} minDue={d.minDue} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function CardVisual({ card }: { card: CardEntry }) {
  const bank = (card.bank.trim() || 'Bank').split(/\s+/)[0].toLowerCase().substring(0, 8);
  const limitPct = card.limit > 0 ? `${Math.round((card.outstanding / card.limit) * 100)}%` : '—';
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-5 min-h-[155px] w-full max-w-[320px] flex-[0_0_min(100%,320px)] snap-start">
      <div className="flex justify-between items-start mb-2.5">
        <div className="text-base font-semibold text-white/90 tracking-wide">{bank}</div>
        <CreditCard className="w-5 h-5 text-slate-400" aria-hidden />
      </div>
      <div className="w-9 h-7 rounded bg-slate-600 mb-3" aria-hidden />
      <div className="flex justify-between items-end gap-2">
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-0.5">Outstanding</div>
          <div className="text-xl font-bold tabular-nums">{fmtINR(card.outstanding)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-0.5">Limit Used · Rate</div>
          <div className="text-sm font-bold tabular-nums">
            {limitPct} · {card.rate.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/** Design's min-payment projection chart (milestones 3M…24M), drawn as SVG. */
function MinPayChart({ outstanding, rate, minDue }: { outstanding: number; rate: number; minDue: number }) {
  const { milestones, owed, paid } = minPayProjection(outstanding, rate, minDue);
  const N = milestones.length;
  const W = 320;
  const H = 210;
  const padL = 14;
  const padR = 14;
  const padT = 34;
  const padB = 26;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const maxV = Math.max(1, ...owed, ...paid) * 1.25;
  const xAt = (i: number) => padL + (i / (N - 1)) * cW;
  const yAt = (v: number) => padT + cH - (v / maxV) * cH;
  const oPts = owed.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const pPts = paid.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x)},${Math.round(p.y)}`).join(' ');
  const area = (pts: { x: number; y: number }[]) => `${line(pts)} L${Math.round(pts[N - 1].x)},${padT + cH} L${Math.round(pts[0].x)},${padT + cH} Z`;
  const base = padT + cH;

  const summary = milestones.map((m, i) => `${m} months: paid ${fmtLakh(paid[i])}, still owed ${fmtLakh(owed[i])}`).join('; ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Paying only the minimum. ${summary}.`} className="block max-w-full overflow-hidden" shapeRendering="geometricPrecision" textRendering="optimizeLegibility">
      <defs>
        <linearGradient id="cca-oGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="cca-pGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {milestones.map((_, i) => (
        <line key={`g${i}`} x1={xAt(i).toFixed(1)} y1={padT} x2={xAt(i).toFixed(1)} y2={base} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
      ))}
      <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="#E2E8F0" strokeWidth="1" />
      {N === owed.length && N > 1 && (
        <>
          <path d={area(oPts)} fill="url(#cca-oGrad)" />
          <path d={area(pPts)} fill="url(#cca-pGrad)" />
          <path d={line(oPts)} fill="none" stroke="#F43F5E" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
          <path d={line(pPts)} fill="none" stroke="#2563EB" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
          {milestones.map((m, i) => {
            const o = oPts[i];
            const p = pPts[i];
            const anchor = i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle';
            const blueAbove = p.y < o.y;
            return (
              <g key={m}>
                <circle cx={Math.round(o.x)} cy={Math.round(o.y)} r="5.5" fill="#F43F5E" stroke="#fff" strokeWidth="2" />
                <text x={Math.round(o.x)} y={Math.round(o.y - 11)} textAnchor={anchor} fontSize="10.5" fill="#F43F5E" fontWeight="700" fontFamily="Inter,sans-serif">
                  {fmtLakh(owed[i])}
                </text>
                <circle cx={Math.round(p.x)} cy={Math.round(p.y)} r="5.5" fill="#2563EB" stroke="#fff" strokeWidth="2" />
                <text x={Math.round(p.x)} y={blueAbove ? Math.round(p.y - 11) : Math.round(p.y + 16)} textAnchor={anchor} fontSize="10.5" fill="#2563EB" fontWeight="700" fontFamily="Inter,sans-serif">
                  {fmtLakh(paid[i])}
                </text>
                <text x={Math.round(o.x)} y={base + 16} textAnchor={anchor} fontSize="10.5" fill="#64748B" fontFamily="Inter,sans-serif">
                  {m}M
                </text>
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}

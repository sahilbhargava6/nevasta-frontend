'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calculator, Lightbulb } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_CC_JOURNEY, fmtCompact, fmtINR, useJourney } from '@/lib/journey';
import { cardMonthlyRate, combineCards, fixedMinPayment, payoffWith, pmtMonthly } from '@/lib/ccPlanMath';

/* Pay-More Simulator — design #cc-pms-page (prototype lines ~6187–6271, JS ~9700–9796) */


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
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/credit-card/plan" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4" aria-hidden /> Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pay-More Simulator</h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">Small change, big freedom</p>
        </div>

        {!range || !res ? (
          <div className="card-fintech p-5 sm:p-6 text-center">
            <div className="text-sm font-semibold text-slate-900 mb-2">Add your card balance first</div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">We need your outstanding balance to run the simulator.</p>
            <Link href="/journey/credit-card" className="btn-accent">
              Add my cards <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            {/* Slider card */}
            <div className="card-fintech p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="w-4 h-4 text-blue-600" aria-hidden />
                <h2 className="text-sm font-semibold text-slate-900">Pay-more simulator</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">Drag to see how a bigger monthly payment changes your payoff.</p>

              <div className="flex justify-between items-center mb-3.5 gap-3">
                <label htmlFor="cpms-slider" className="text-sm font-medium text-slate-600">
                  Monthly payment
                </label>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{fmtINR(pay)}</span>
              </div>

              <input
                id="cpms-slider"
                type="range"
                min={range.min}
                max={range.max}
                value={pay}
                onChange={(e) => setPayment(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">Min {fmtINR(range.min)}</span>
                <span className="text-xs text-slate-500">{fmtINR(range.max)}</span>
              </div>
            </div>

            {/* Stats card */}
            <div className="card-fintech p-5 sm:p-6">
              <StatRow label="Debt-free in" value={`${res.months} month${res.months !== 1 ? 's' : ''}`} />
              <StatRow label="Total interest paid" value={fmtINR(res.totalInterest)} />
              <StatRow label="vs minimum-due path" value={`save ${fmtCompact(saving)}`} valueClass="text-emerald-600" />
              <div className="pt-4">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.max(4, Math.min(100, barPct))}%` }} />
                </div>
                <div className="text-xs text-slate-500 text-center">Shorter bar = faster freedom.</div>
              </div>
            </div>

            {/* Navesta AI */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">N</div>
                <span className="text-xs font-semibold text-blue-400">Navesta AI</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Paying <strong className="text-blue-400">{fmtINR(pay)}/mo</strong> clears everything in <strong className="text-blue-400">{res.months} months</strong> and saves{' '}
                <strong className="text-emerald-400">{fmtCompact(saving)}</strong> vs the minimum.
              </p>
            </div>
          </>
        )}

        <button type="button" onClick={() => router.push('/journey/credit-card/plan')} className="btn-secondary w-full">
          <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden /> Back
        </button>
      </main>
    </div>
  );
}

function StatRow({ label, value, valueClass = 'text-slate-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 gap-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

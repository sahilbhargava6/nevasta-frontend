'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_MULTI_JOURNEY, fmtINR, useJourney } from '@/lib/journey';
import { fetchOffers } from '@/lib/applyOffer';
import { DEBT_TYPE_LABEL, debtEmi, portfolioStats } from '@/lib/consolidationMath';
import { ArrowRight, BarChart3, CreditCard, Landmark, Lightbulb } from 'lucide-react';
import ConsolidationShell from '../_components/ConsolidationShell';

/** Design: #dc-summary-page ("Your Debt Overview"), dcShowSummary. */

const DEFAULT_TIP =
  'Consolidating into a single personal loan can lower your blended interest rate and reduce your monthly EMI — freeing up cash flow every month.';
const FALLBACK_TIP = 'Consolidating into a single personal loan simplifies repayments and may reduce your monthly EMI burden.';

export default function DebtSummaryPage() {
  const router = useRouter();
  const [multi, , , ready] = useJourney('multi', DEFAULT_MULTI_JOURNEY);
  const stats = portfolioStats(multi.debts);
  const { debts, totalOutstanding, totalEmi, blendedRate, highest, totalInterest } = stats;
  const [tip, setTip] = useState(DEFAULT_TIP);

  // Nothing to summarise (landed here directly): back to the portfolio form
  useEffect(() => {
    if (ready && totalOutstanding <= 0) router.replace('/journey/multiple');
  }, [ready, totalOutstanding, router]);

  // Personalise the tip with the cheapest real consolidation rate
  useEffect(() => {
    if (!ready || totalOutstanding <= 0) return;
    let cancelled = false;
    fetchOffers(totalOutstanding, 36)
      .then((offers) => {
        if (cancelled) return;
        const best = offers[0];
        if (best && blendedRate > best.offeredRatePercent) {
          setTip(
            `Your blended rate is ${blendedRate.toFixed(1)}%. A consolidation loan at ${best.offeredRatePercent.toFixed(2)}% p.a. could lower your EMI and save you thousands in interest over the remaining tenure.`,
          );
        } else {
          setTip(FALLBACK_TIP);
        }
      })
      .catch(() => {
        if (!cancelled) setTip(FALLBACK_TIP);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, totalOutstanding, blendedRate]);

  return (
    <ConsolidationShell backHref="/journey/multiple">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" aria-hidden /> DEBT SUMMARY
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your Debt <span className="text-blue-600">Overview</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">Review your debts below, then consolidate into one lower-rate loan.</p>
        </div>

        {ready && totalOutstanding > 0 && (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">YOUR DEBTS</h2>
              {debts.map((d, i) => (
                <div className="card-fintech p-4 flex items-center justify-between gap-3" key={i}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${d.type === 'credit_card' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}
                      aria-hidden
                    >
                      {d.type === 'credit_card' ? <CreditCard className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{DEBT_TYPE_LABEL[d.type]}</div>
                      <div className="text-xs text-slate-500">@ {(d.rate || 0).toFixed(1)}% p.a.</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900 tabular-nums">{fmtINR(d.amount)}</div>
                    <div className="text-xs text-slate-500 tabular-nums">EMI: {fmtINR(debtEmi(d))}/mo</div>
                  </div>
                </div>
              ))}
            </section>

            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Total Outstanding</span>
                <span className="font-semibold tabular-nums">{fmtINR(totalOutstanding)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Monthly EMI Load</span>
                <span className="font-semibold tabular-nums">{fmtINR(totalEmi)}/mo</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Highest Interest Debt</span>
                <span className="font-semibold tabular-nums text-right">{highest ? `${highest.rate.toFixed(1)}% (${DEBT_TYPE_LABEL[highest.type]})` : '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-700">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Total Interest (if unchanged)</span>
                <span className="text-2xl font-bold tabular-nums text-blue-400">{totalInterest > 0 ? fmtINR(totalInterest) : '—'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3">
              <Lightbulb className="w-4 h-4 shrink-0" aria-hidden />
              <div className="leading-relaxed" aria-live="polite">
                {tip}
              </div>
            </div>

            <button type="button" className="btn-accent w-full sm:w-auto" onClick={() => router.push('/journey/multiple/eligibility')}>
              Find My Consolidation Plan <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </button>
          </>
        )}
      </main>
    </ConsolidationShell>
  );
}

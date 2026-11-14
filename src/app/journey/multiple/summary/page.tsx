'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_MULTI_JOURNEY, fmtINR, useJourney } from '@/lib/journey';
import { fetchOffers } from '@/lib/applyOffer';
import { DEBT_TYPE_LABEL, debtEmi, portfolioStats } from '@/lib/consolidationMath';
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
      <div className="acc-page">
        <div className="acc-left">
          <div className="acc-label">📊 DEBT SUMMARY</div>
          <h1 className="acc-h1">
            Your Debt <span>Overview</span>
          </h1>
          <p className="acc-sub">Review your debts below, then consolidate into one lower-rate loan.</p>
          {ready && totalOutstanding > 0 && (
            <div className="dcs-body">
              <div className="dcs-section-lbl">YOUR DEBTS</div>
              <div className="dcs-debt-list">
                {debts.map((d, i) => (
                  <div className="dcs-debt-row" key={i}>
                    <div className="dcs-debt-left">
                      <div className="dcs-debt-icon" style={{ background: d.type === 'credit_card' ? '#FFF5F5' : '#EFF6FF' }} aria-hidden>
                        {d.type === 'credit_card' ? '💳' : '🏦'}
                      </div>
                      <div>
                        <div className="dcs-debt-type">{DEBT_TYPE_LABEL[d.type]}</div>
                        <div className="dcs-debt-rate">@ {(d.rate || 0).toFixed(1)}% p.a.</div>
                      </div>
                    </div>
                    <div className="dcs-debt-right">
                      <div className="dcs-debt-amt">{fmtINR(d.amount)}</div>
                      <div className="dcs-debt-emi">EMI: {fmtINR(debtEmi(d))}/mo</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="md-summary" style={{ marginBottom: 20 }}>
                <div className="md-summary-row">
                  <span>Total Outstanding</span>
                  <span>{fmtINR(totalOutstanding)}</span>
                </div>
                <div className="md-summary-row">
                  <span>Monthly EMI Load</span>
                  <span>{fmtINR(totalEmi)}/mo</span>
                </div>
                <div className="md-summary-row">
                  <span>Highest Interest Debt</span>
                  <span>{highest ? `${highest.rate.toFixed(1)}% (${DEBT_TYPE_LABEL[highest.type]})` : '—'}</span>
                </div>
                <div className="md-summary-row">
                  <span>Total Interest (if unchanged)</span>
                  <span className="md-summary-total">{totalInterest > 0 ? fmtINR(totalInterest) : '—'}</span>
                </div>
              </div>

              <div className="dcs-alert">
                <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden>
                  💡
                </span>
                <div className="dcs-alert-text" aria-live="polite">
                  {tip}
                </div>
              </div>

              <button type="button" className="dcs-proceed-btn" onClick={() => router.push('/journey/multiple/eligibility')}>
                Find My Consolidation Plan →
              </button>
            </div>
          )}
        </div>
      </div>
    </ConsolidationShell>
  );
}

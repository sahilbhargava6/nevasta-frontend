'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_LOAN_JOURNEY, useJourney, type LoanJourney } from '@/lib/journey';
import { ANALYSIS_TYPE_LABEL, analyzeLoan, fmtLa, isUsableLoan } from '@/lib/loanMath';

// Design: #loan-analysis-page (Navesta_Website_22Sep26.html ~6272–6351, JS showLoanAnalysisPage ~11593)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function LoanAnalysisPage() {
  return (
    <JourneyGate intent="debt-loan">
      <LoanAnalysis />
    </JourneyGate>
  );
}

function LoanAnalysis() {
  const router = useRouter();
  const [loan, , , ready] = useJourney<LoanJourney>('loan', DEFAULT_LOAN_JOURNEY);
  const [barWidth, setBarWidth] = useState(50);

  const a = analyzeLoan(loan);
  const intPct = Math.round(a.interestPct);
  const prinPct = 100 - intPct;

  // Bar animates from 50% to the real split, as in the design
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setBarWidth(intPct), 60);
    return () => window.clearTimeout(t);
  }, [ready, intPct]);

  if (!ready) return null;

  const usable = isUsableLoan(loan);
  const now = new Date();
  const free = new Date(now.getFullYear(), now.getMonth() + loan.tenureLeft, 1);

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/journey/loan" />

      <div style={{ padding: '28px 20px 4px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#059669', textTransform: 'uppercase' }}>{ANALYSIS_TYPE_LABEL[loan.loanType] ?? 'PERSONAL LOAN'} · ANALYSIS</span>
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,5vw,28px)', fontWeight: 900, lineHeight: 1.2, color: '#2A1606', marginBottom: 6 }}>
          {usable ? `Your loan of ₹${fmtLa(loan.outstanding)} will cost ₹${(a.totalInterest / 100000).toFixed(1)}L in interest alone` : 'Tell us about your loan first'}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(42,22,6,0.55)', lineHeight: 1.6, margin: 0 }}>
          Here&apos;s what&apos;s really happening inside your repayments
        </p>
      </div>

      {!usable ? (
        <div className="la-body">
          <div className="la-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#7A5E44', marginBottom: 16 }}>We need your outstanding amount, tenure left and interest rate to analyse your loan.</p>
            <Link href="/journey/loan" className="la-cta" style={{ display: 'block', textDecoration: 'none' }}>
              Enter loan details →
            </Link>
          </div>
        </div>
      ) : (
        <div className="la-body">
          {/* Interest vs Principal split */}
          <div className="la-card">
            <div className="la-card-title">How Your Total Repayment Breaks Down</div>
            <div className="la-split">
              <div className="la-split-item red">
                <div className="la-split-num red">₹{fmtLa(a.totalInterest)}</div>
                <div className="la-split-lbl">
                  Goes to bank as
                  <br />
                  interest + charges
                </div>
              </div>
              <div className="la-split-item green">
                <div className="la-split-num green">₹{fmtLa(loan.outstanding)}</div>
                <div className="la-split-lbl">
                  Actually reduces
                  <br />
                  your balance
                </div>
              </div>
            </div>
            <div className="la-bar-wrap" role="img" aria-label={`Interest ${intPct}%, principal ${prinPct}%`}>
              <div className="la-bar-inner" style={{ width: `${barWidth}%` }} />
            </div>
            <div className="la-bar-labels">
              <span>Interest {intPct}%</span>
              <span>Principal {prinPct}%</span>
            </div>
          </div>

          {/* Monthly EMI breakdown */}
          <div className="la-card">
            <div className="la-card-title">This Month&apos;s EMI of ₹{fmtLa(Math.round(a.emi))}</div>
            <div className="la-split">
              <div className="la-split-item red">
                <div className="la-split-num red">₹{fmtLa(Math.round(a.monthInterest))}</div>
                <div className="la-split-lbl">
                  Interest this
                  <br />
                  month
                </div>
              </div>
              <div className="la-split-item green">
                <div className="la-split-num green">₹{fmtLa(Math.round(a.monthPrincipal))}</div>
                <div className="la-split-lbl">
                  Principal paid
                  <br />
                  this month
                </div>
              </div>
            </div>
          </div>

          {/* Big nudge number */}
          <div className="la-nudge">
            <div style={{ fontSize: 13, color: 'rgba(29,12,0,0.55)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Interest you&apos;ll pay over the full loan</div>
            <div className="la-nudge-num">₹{fmtLa(Math.round(a.totalInterest))}</div>
            <div className="la-nudge-lbl">{intPct}% of every rupee you repay goes to the bank as interest. The tools below can help you cut this significantly.</div>
          </div>

          {/* Debt-free date */}
          <div className="la-card" style={{ textAlign: 'center' }}>
            <div className="la-card-title">Your Debt-Free Date</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: '#1A0800', marginBottom: 6 }}>
              {MONTHS[free.getMonth()]} {free.getFullYear()}
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(29,12,0,0.55)' }}>
              {loan.tenureLeft} months from now, at ₹{fmtLa(Math.round(a.emi))}/mo, with no prepayments
            </div>
          </div>

          <button type="button" className="la-cta" onClick={() => router.push('/journey/loan/fixes')}>
            Show Me How to Cut This ➜
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarCheck, Calculator } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_LOAN_JOURNEY, useJourney, type LoanJourney } from '@/lib/journey';
import { ANALYSIS_TYPE_LABEL, analyzeLoan, fmtLa, isUsableLoan } from '@/lib/loanMath';

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
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/loan" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Calculator className="w-4 h-4" aria-hidden />
            {ANALYSIS_TYPE_LABEL[loan.loanType] ?? 'PERSONAL LOAN'} · ANALYSIS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {usable ? `Your loan of ₹${fmtLa(loan.outstanding)} will cost ₹${(a.totalInterest / 100000).toFixed(1)}L in interest alone` : 'Tell us about your loan first'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">Here&apos;s what&apos;s really happening inside your repayments</p>
        </div>

        {!usable ? (
          <div className="card-fintech p-5 sm:p-6 text-center space-y-4">
            <p className="text-sm text-slate-600">We need your outstanding amount, tenure left and interest rate to analyse your loan.</p>
            <Link href="/journey/loan" className="btn-accent w-full sm:w-auto">
              Enter loan details
              <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            {/* Interest vs Principal split */}
            <div className="card-fintech p-5 sm:p-6 space-y-4">
              <div className="text-sm font-semibold text-slate-900">How Your Total Repayment Breaks Down</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <div className="text-lg font-bold text-rose-600 tabular-nums">₹{fmtLa(a.totalInterest)}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">Goes to bank as interest + charges</div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-lg font-bold text-emerald-600 tabular-nums">₹{fmtLa(loan.outstanding)}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">Actually reduces your balance</div>
                </div>
              </div>
              <div
                className="h-3 rounded-full bg-emerald-500 overflow-hidden"
                role="img"
                aria-label={`Interest ${intPct}%, principal ${prinPct}%`}
              >
                <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${barWidth}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Interest {intPct}%</span>
                <span>Principal {prinPct}%</span>
              </div>
            </div>

            {/* Monthly EMI breakdown */}
            <div className="card-fintech p-5 sm:p-6 space-y-4">
              <div className="text-sm font-semibold text-slate-900">This Month&apos;s EMI of ₹{fmtLa(Math.round(a.emi))}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <div className="text-lg font-bold text-rose-600 tabular-nums">₹{fmtLa(Math.round(a.monthInterest))}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">Interest this month</div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-lg font-bold text-emerald-600 tabular-nums">₹{fmtLa(Math.round(a.monthPrincipal))}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">Principal paid this month</div>
                </div>
              </div>
            </div>

            {/* Big nudge number */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Interest you&apos;ll pay over the full loan</div>
              <div className="text-3xl font-bold tabular-nums text-rose-400 mt-1">₹{fmtLa(Math.round(a.totalInterest))}</div>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">
                {intPct}% of every rupee you repay goes to the bank as interest. The tools below can help you cut this significantly.
              </p>
            </div>

            {/* Debt-free date */}
            <div className="card-fintech p-5 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarCheck className="w-4 h-4 text-blue-600" aria-hidden />
                Your Debt-Free Date
              </div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
                {MONTHS[free.getMonth()]} {free.getFullYear()}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {loan.tenureLeft} months from now, at ₹{fmtLa(Math.round(a.emi))}/mo, with no prepayments
              </div>
            </div>

            <button type="button" className="btn-accent w-full sm:w-auto" onClick={() => router.push('/journey/loan/fixes')}>
              Show Me How to Cut This
              <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </button>
          </>
        )}
      </main>
    </div>
  );
}

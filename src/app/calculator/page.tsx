'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import {
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  CreditCard,
} from 'lucide-react';

export default function CalculatorPage() {
  const [authOpen, setAuthOpen] = useState(false);

  // Simulator State
  const [loanAmt, setLoanAmt] = useState(600000);
  const [currentRate, setCurrentRate] = useState(38);
  const [tenureMonths, setTenureMonths] = useState(36);

  // Amortization Math
  const currentMonthlyRate = currentRate / 100 / 12;
  const currentEMI = Math.round(
    (loanAmt * currentMonthlyRate * Math.pow(1 + currentMonthlyRate, tenureMonths)) /
      (Math.pow(1 + currentMonthlyRate, tenureMonths) - 1)
  );
  const totalCurrentPayment = currentEMI * tenureMonths;
  const totalCurrentInterest = totalCurrentPayment - loanAmt;

  const takeoverRate = 10.25;
  const takeoverMonthlyRate = takeoverRate / 100 / 12;
  const takeoverEMI = Math.round(
    (loanAmt * takeoverMonthlyRate * Math.pow(1 + takeoverMonthlyRate, tenureMonths)) /
      (Math.pow(1 + takeoverMonthlyRate, tenureMonths) - 1)
  );
  const totalTakeoverPayment = takeoverEMI * tenureMonths;
  const totalTakeoverInterest = totalTakeoverPayment - loanAmt;

  const monthlySavings = Math.max(0, currentEMI - takeoverEMI);
  const lifetimeInterestSavings = Math.max(0, totalCurrentInterest - totalTakeoverInterest);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-14 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>REAL-TIME AMORTIZATION SIMULATOR</span>
          </span>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950">
            Debt Takeover &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700 block sm:inline mt-1 sm:mt-0">
              Savings Calculator
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Simulate the exact mathematical impact of moving high-interest credit card debt (24%–42% APR) or fragmented personal loans into an institutional 10.25% p.a. bank facility.
          </p>
        </div>
      </section>

      {/* Calculator Body */}
      <section className="py-8 sm:py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-elevated p-5 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Sliders Column */}
              <div className="lg:col-span-7 space-y-8">
                {/* Total Balance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span>Total Outstanding Balance</span>
                    <span className="text-lg font-extrabold text-slate-950 tabular-nums">
                      ₹{loanAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={2500000}
                    step={25000}
                    value={loanAmt}
                    onChange={(e) => setLoanAmt(Number(e.target.value))}
                    className="accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>₹50,000</span>
                    <span>₹12,50,000</span>
                    <span>₹25,00,000</span>
                  </div>
                </div>

                {/* Current Interest Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span>Current Annual Interest Rate (APR)</span>
                    <span className="text-lg font-extrabold text-rose-600 tabular-nums">
                      {currentRate}% p.a.{' '}
                      <span className="text-xs font-normal text-slate-500">
                        {currentRate >= 36 ? '(Credit Cards)' : currentRate >= 20 ? '(NBFC)' : '(Personal Loan)'}
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={44}
                    step={1}
                    value={currentRate}
                    onChange={(e) => setCurrentRate(Number(e.target.value))}
                    className="accent-rose-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>12% (Standard)</span>
                    <span>28% (NBFC Loans)</span>
                    <span>44% (Credit Cards)</span>
                  </div>
                </div>

                {/* Tenure */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span>Repayment Horizon</span>
                    <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                      {tenureMonths} Months ({Math.round(tenureMonths / 12)} Years)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={60}
                    step={6}
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>12 Months</span>
                    <span>36 Months</span>
                    <span>60 Months</span>
                  </div>
                </div>
              </div>

              {/* Live Metric Comparison Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-2xl p-7 text-white space-y-5 shadow-card">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span>Takeover Benchmark Rate</span>
                  <span className="badge-emerald font-bold">{takeoverRate}% p.a.</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Current Monthly EMI:</span>
                    <span className="font-semibold text-slate-300 line-through tabular-nums text-sm">
                      ₹{currentEMI.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-medium">New Refinanced EMI:</span>
                    <span className="font-bold text-white text-base tabular-nums">
                      ₹{takeoverEMI.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Total Interest Saved
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400 tabular-nums mt-0.5">
                      ₹{lifetimeInterestSavings.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-emerald-300 font-medium mt-1">
                      Puts ₹{monthlySavings.toLocaleString('en-IN')}/mo back in your wallet
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAuthOpen(true)}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-3"
                >
                  <span>Apply For Pre-Approved Takeover</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Zero CIBIL hit • 100% Free for borrowers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

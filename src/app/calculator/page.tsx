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
  Printer,
  Download,
  CheckCircle2,
  Lock,
  MessageCircle,
  Landmark,
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

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + tenureMonths);
  const freedomFormatted = freedomDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const openAudit = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navesta:open-audit'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Screen Only: Header */}
      <section className="print:hidden relative overflow-hidden pt-12 pb-14 bg-white border-b border-slate-200">
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

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Download PDF Roadmap</span>
            </button>
            <button
              onClick={openAudit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Instant 30-Sec Audit</span>
            </button>
          </div>
        </div>
      </section>

      {/* Screen Only: Interactive Controls */}
      <section className="print:hidden py-8 sm:py-12 bg-slate-50 border-b border-slate-200">
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
                    className="w-full accent-blue-600 cursor-pointer"
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
                    className="w-full accent-rose-600 cursor-pointer"
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
                    className="w-full accent-blue-600 cursor-pointer"
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

                  <div className="p-3 rounded-xl bg-white/10 text-xs text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Exact Debt Freedom Date:</span>
                    </div>
                    <div className="text-base font-bold text-white">{freedomFormatted}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={openAudit}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Check Eligibility for 10.25%</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / Print Official PDF Roadmap</span>
                  </button>
                </div>

                <p className="text-[10px] text-center text-slate-400">
                  Zero CIBIL hit • 100% Free for borrowers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OFFICIAL PRINT / PDF ROADMAP DOCUMENT
          (Rendered beautifully on Print or "Save to PDF")
      ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto space-y-6">
        {/* Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-black">
                N
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">navesta</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Institutional Debt Advisory &amp; Balance Transfer Platform
            </p>
            <p className="text-[10px] text-slate-400">
              Regulated Digital Lending Service Provider (LSP) • Bengaluru, India
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <span className="font-bold uppercase tracking-wider text-slate-900 block">
              Official Debt Freedom Roadmap
            </span>
            <span>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
              Ref: NAV-{Date.now().toString().slice(-6)}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            1. Executive Takeover Summary
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Total Portfolio Debt:</span>
              <span className="text-base font-extrabold text-slate-900">
                ₹{loanAmt.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Estimated APR:</span>
              <span className="text-base font-extrabold text-rose-600">
                {currentRate}% p.a.
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Monthly Outflow:</span>
              <span className="text-base font-extrabold text-slate-900">
                ₹{currentEMI.toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Structured Takeover Terms */}
        <div className="border border-emerald-300 bg-emerald-50/50 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
            2. Structured Institutional Takeover (10.25% Benchmark)
          </h3>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-emerald-800 block">Refinance Rate:</span>
              <span className="text-lg font-black text-emerald-700">10.25% p.a.</span>
            </div>
            <div>
              <span className="text-emerald-800 block">New Monthly EMI:</span>
              <span className="text-lg font-black text-slate-900">
                ₹{takeoverEMI.toLocaleString('en-IN')}/mo
              </span>
            </div>
            <div>
              <span className="text-emerald-800 block">Monthly Cash Saved:</span>
              <span className="text-lg font-black text-emerald-700">
                +₹{monthlySavings.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-emerald-800 block">Lifetime Interest Saved:</span>
              <span className="text-lg font-black text-emerald-700">
                ₹{lifetimeInterestSavings.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Freedom Milestone */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            3. Exact Calendar Freedom Milestone
          </h3>
          <p className="text-xs text-slate-600">
            Under this structured facility of {tenureMonths} months, your entire unsecured obligation of ₹{loanAmt.toLocaleString('en-IN')} will be completely liquidated by <strong className="text-slate-900 font-bold">{freedomFormatted}</strong>.
          </p>
          <p className="text-xs text-slate-500">
            Contrast: Maintaining minimum due payments of ~5% without a takeover extends repayment across 14+ years and incurs over ₹{(loanAmt * 1.3).toLocaleString('en-IN')} in avoidable compounding finance charges + 18% GST.
          </p>
        </div>

        {/* Partner Banks Disbursal Matrix */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            4. Qualified Institutional Partner Lenders
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500">
                <th className="py-1.5 font-bold">Lender</th>
                <th className="py-1.5 font-bold">Category</th>
                <th className="py-1.5 font-bold">Takeover APR</th>
                <th className="py-1.5 font-bold">Disbursal Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="py-1.5 font-semibold">HDFC Bank</td>
                <td className="py-1.5">Scheduled Commercial Bank</td>
                <td className="py-1.5 text-emerald-700 font-bold">10.25% – 11.50%</td>
                <td className="py-1.5">Direct Card/Loan NEFT Settlement</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold">ICICI Bank</td>
                <td className="py-1.5">Scheduled Commercial Bank</td>
                <td className="py-1.5 text-emerald-700 font-bold">10.50% – 12.00%</td>
                <td className="py-1.5">Direct Account Payoff in 24h</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold">Tata Capital</td>
                <td className="py-1.5">Systemically Important NBFC</td>
                <td className="py-1.5 text-emerald-700 font-bold">11.00% – 13.50%</td>
                <td className="py-1.5">Direct RTGS Card Liquidation</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signoff & Disclaimers */}
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 space-y-1">
          <p>
            <strong>Disclaimer:</strong> This calculation is an algorithmic simulation generated by Navesta Technologies. Final interest rate, processing fees, and sanction limits are determined by the partner institutional lender following standard bureau verification and e-KYC.
          </p>
          <p>
            Navesta operates in compliance with the Reserve Bank of India (RBI) Digital Lending Guidelines (2022). Navesta does not collect deposits and acts solely as an authorized borrower advisory facilitator.
          </p>
          <p className="font-semibold text-slate-500">
            Support: advisory@navesta.in • Helpline: +91 (080) 4568-9200 • Indiranagar, Bengaluru 560038
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import {
  CreditCard,
  Landmark,
  Layers,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  Percent,
  Calendar,
  Building2,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Takeover Simulator State
  const [loanAmt, setLoanAmt] = useState(600000);
  const [currentRate, setCurrentRate] = useState(38); // typical revolving CC APR
  const [tenureMonths, setTenureMonths] = useState(36);

  // Mathematical Amortization for Current Debt
  const currentMonthlyRate = currentRate / 100 / 12;
  const currentEMI = Math.round(
    (loanAmt * currentMonthlyRate * Math.pow(1 + currentMonthlyRate, tenureMonths)) /
      (Math.pow(1 + currentMonthlyRate, tenureMonths) - 1)
  );
  const totalCurrentPayment = currentEMI * tenureMonths;
  const totalCurrentInterest = totalCurrentPayment - loanAmt;

  // Mathematical Amortization for Navesta Partner Takeover (e.g. 10.75% benchmark)
  const takeoverRate = 10.75;
  const takeoverMonthlyRate = takeoverRate / 100 / 12;
  const takeoverEMI = Math.round(
    (loanAmt * takeoverMonthlyRate * Math.pow(1 + takeoverMonthlyRate, tenureMonths)) /
      (Math.pow(1 + takeoverMonthlyRate, tenureMonths) - 1)
  );
  const totalTakeoverPayment = takeoverEMI * tenureMonths;
  const totalTakeoverInterest = totalTakeoverPayment - loanAmt;

  const monthlySavings = Math.max(0, currentEMI - takeoverEMI);
  const lifetimeInterestSavings = Math.max(0, totalCurrentInterest - totalTakeoverInterest);

  const faqs = [
    {
      q: 'How does a Balance Transfer or Loan Takeover work?',
      a: 'A Balance Transfer replaces high-cost obligations (such as credit card debt at 36–42% APR or expensive personal loans) with a lower-cost institutional debt facility (starting from 10.25% p.a.). The partner bank pays off your existing lenders directly and consolidates the balance into a single, manageable monthly EMI.',
    },
    {
      q: 'Will checking my offers affect my CIBIL credit score?',
      a: 'No. Navesta uses a soft credit profile pull during initial assessment and pre-qualification. Soft inquiries do not lower your CIBIL score. A formal hard inquiry only occurs if and when you decide to proceed with an application to a partner bank.',
    },
    {
      q: 'Is Navesta free for borrowers?',
      a: 'Yes, 100% free. Borrowers never pay advisory fees, subscription charges, or hidden platform costs. When an approved takeover is disbursed, our partner financial institutions pay us a standard origination fee.',
    },
    {
      q: 'What is the difference between Avalanche and Snowball payoff strategies?',
      a: 'The Debt Avalanche method prioritizes paying off accounts with the highest annual interest rate first, mathematically minimizing total interest paid. The Debt Snowball method targets the smallest balance first to build early psychological momentum and eliminate accounts quickly. Navesta calculates both so you can choose what works for your cash flow.',
    },
    {
      q: 'Are your lending partners RBI regulated?',
      a: 'Yes. All financing offers on Navesta originate exclusively from Reserve Bank of India (RBI) regulated Scheduled Commercial Banks and Systemically Important NBFCs including HDFC Bank, ICICI Bank, State Bank of India, Axis Bank, Tata Capital, and Bajaj Finserv.',
    },
    {
      q: 'How is borrower personal data handled under the DPDP Act?',
      a: 'Navesta complies with the Digital Personal Data Protection (DPDP) Act. We use 256-bit AES encryption at rest and TLS 1.3 in transit. We never sell customer records to telemarketers or third-party lead generators.',
    },
  ];

  const partners = [
    { name: 'HDFC Bank', type: 'Scheduled Bank', rate: 'From 10.25%' },
    { name: 'ICICI Bank', type: 'Scheduled Bank', rate: 'From 10.50%' },
    { name: 'State Bank of India', type: 'Public Sector Bank', rate: 'From 9.95%' },
    { name: 'Axis Bank', type: 'Scheduled Bank', rate: 'From 10.49%' },
    { name: 'Tata Capital', type: 'Systemically Important NBFC', rate: 'From 11.25%' },
    { name: 'Bajaj Finserv', type: 'NBFC', rate: 'From 11.50%' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200/80 bg-white">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-60" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Headline Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>RBI REGULATED LENDING NETWORK • ZERO IMPACT ON CIBIL</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Institutional Debt Refinancing &amp; Algorithmic Payoff
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Refinance toxic 36–42% revolving credit card debt and fragmented personal loans into an institutional bank takeover starting at <strong className="text-slate-900 font-semibold">10.25% p.a.</strong> Slash monthly EMIs and achieve debt freedom on a verified schedule.
              </p>

              {/* Trust Value Props */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Soft Pull Only (0 Score Hit)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Direct Bank Disbursals</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>256-Bit Bank Grade Security</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="btn-primary text-sm !py-3 !px-6 flex items-center justify-center gap-2"
                >
                  <span>Analyze Your Debt Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#calculator"
                  className="btn-secondary text-sm !py-3 !px-5 flex items-center justify-center gap-2 text-slate-700"
                >
                  <span>Simulate Interest Savings</span>
                </a>
              </div>
            </div>

            {/* Right Simulator Card Column */}
            <div id="calculator" className="lg:col-span-5">
              <div className="card-fintech p-6 sm:p-7 shadow-elevated border-slate-300/80 bg-white relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Real-Time Estimator
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Debt Takeover Calculator
                    </h3>
                  </div>
                  <span className="badge-emerald text-xs">
                    Target Rate: {takeoverRate}% p.a.
                  </span>
                </div>

                <div className="space-y-5 pt-5">
                  {/* Total Debt Amount Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Total Debt Outstanding</span>
                      <span className="font-bold text-slate-900 tabular-nums">
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
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₹50K</span>
                      <span>₹12.5L</span>
                      <span>₹25L</span>
                    </div>
                  </div>

                  {/* Current APR Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Current Blended APR</span>
                      <span className="font-bold text-rose-600 tabular-nums">
                        {currentRate}% p.a. {currentRate >= 36 ? '(Credit Cards)' : '(Personal Loan)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={44}
                      step={1}
                      value={currentRate}
                      onChange={(e) => setCurrentRate(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>12%</span>
                      <span>28%</span>
                      <span>44%</span>
                    </div>
                  </div>

                  {/* Tenure Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Repayment Horizon</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {tenureMonths} Months ({Math.round(tenureMonths / 12)} Yrs)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      step={6}
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>12 Mos</span>
                      <span>36 Mos</span>
                      <span>60 Mos</span>
                    </div>
                  </div>

                  {/* Comparative Metrics Panel */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Current Monthly EMI</span>
                      <span className="font-semibold text-slate-700 line-through tabular-nums">
                        ₹{currentEMI.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-semibold">Refinanced Monthly EMI</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ₹{takeoverEMI.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          Total Interest Saved
                        </div>
                        <div className="text-xs text-slate-500">over {tenureMonths} months</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-emerald-600 tabular-nums">
                          ₹{lifetimeInterestSavings.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700">
                          -₹{monthlySavings.toLocaleString('en-IN')}/mo outflow
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setAuthOpen(true)}
                    className="w-full btn-accent !py-3 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Check Pre-Approved Bank Offers</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-slate-500">
                    Calculations based on standard reducing balance amortization. Rates subject to credit appraisal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PARTNER INSTITUTIONS RIBBON ═══ */}
      <section id="partners" className="py-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Institutional Network
            </span>
            <h2 className="text-sm font-semibold text-slate-700 mt-0.5">
              Refinancing facilities powered by India&apos;s leading RBI-regulated institutions
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="bg-white border border-slate-200/90 rounded-lg p-3 text-center shadow-subtle hover:border-slate-300 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 truncate">{partner.name}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{partner.type}</div>
                <div className="text-[11px] font-semibold text-blue-600 mt-1">{partner.rate}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3 CORE PRODUCT PILLARS ═══ */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Comprehensive Debt Management
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Structured Solutions for High-Burden Debt
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Replace reactive minimum payments with institutional balance transfers and deterministic mathematical payoff plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Balance Transfer */}
            <div className="card-fintech p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="badge-blue text-[11px]">10.25% vs 42% APR</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Credit Card Balance Transfer
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Revolving credit card interest compounds monthly at 3–3.5% (up to 42% annualized). Transfer high-interest balances directly into a lower-rate term loan with a fixed, predictable EMI schedule.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Avg. Interest Reduction</span>
                <span className="font-bold text-emerald-600">Up to 68%</span>
              </div>
            </div>

            {/* Pillar 2: Loan Consolidation */}
            <div className="card-fintech p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="badge-emerald text-[11px]">Single Consolidated EMI</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Multi-Loan Consolidation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Juggling personal loans, consumer durables, and BNPL accounts across different lenders creates fee friction and miss risks. Roll all outstanding obligations into one single monthly payment.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Cash Flow Relief</span>
                <span className="font-bold text-emerald-600">30–45% Lower Outflow</span>
              </div>
            </div>

            {/* Pillar 3: Algorithmic Optimization */}
            <div className="card-fintech p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="badge-slate text-[11px]">Mathematical Optimization</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Avalanche &amp; Snowball Engine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose between the mathematically optimal Avalanche method (targeting highest APR first) and the behavioral Snowball method (targeting smallest balance). Discover your exact debt freedom date.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Calculated Freedom Date</span>
                <span className="font-bold text-slate-900">Clear Calendar Target</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS (3-STEP PROCESS) ═══ */}
      <section id="how" className="py-16 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              The Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Three-Step Institutional Refinancing
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Seamless digital onboarding with direct bank-to-bank settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-card">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Portfolio Ingestion &amp; Diagnostic
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your active credit card statements and loan accounts. We perform a soft bureau pull to aggregate total balance, interest rates, and monthly obligations with zero impact on your CIBIL score.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-card">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Multi-Lender Pre-Approval
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our rule engine matches your financial profile against the underwriting criteria of top scheduled banks, displaying firm takeover terms, monthly EMI savings, and processing fee schedules upfront.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-card">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Direct Bank-to-Bank Payoff
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upon digital agreement, the refinancing lender disburses directly to close your existing high-APR credit lines. You receive closure confirmations and transition to a single, lower monthly EMI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GOVERNANCE, SECURITY & DPDP COMPLIANCE ═══ */}
      <section id="security" className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="badge-slate text-xs font-semibold">
                Enterprise Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Bank-Grade Data Protection &amp; Regulatory Compliance
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Financial data requires the highest tier of security and strict adherence to Indian privacy jurisprudence.
              </p>
              <div className="pt-2 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">DPDP Act (2023) Architecture</h4>
                    <p className="text-xs text-slate-600">Strict explicit consent governance. No unsolicited communications or data commoditization.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">256-Bit TLS &amp; AES-256 Storage</h4>
                    <p className="text-xs text-slate-600">All data in transit and at rest is protected by military-grade encryption protocols.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Direct Regulated Disbursal</h4>
                    <p className="text-xs text-slate-600">Navesta never touches loan capital; funds flow directly from partner banks to loan accounts.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-fintech p-5 space-y-2 bg-slate-50">
                <Lock className="w-6 h-6 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Zero Hard Inquiries</h3>
                <p className="text-xs text-slate-600">
                  Assess balance transfer options and run repayment simulations without triggering hard inquiries on your bureau report.
                </p>
              </div>

              <div className="card-fintech p-5 space-y-2 bg-slate-50">
                <FileCheck2 className="w-6 h-6 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Full Fee Transparency</h3>
                <p className="text-xs text-slate-600">
                  Every offer displays nominal APR, effective APR, processing charges, and foreclosure terms upfront before any commitment.
                </p>
              </div>

              <div className="card-fintech p-5 space-y-2 bg-slate-50">
                <Building2 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">RBI Licensed Partners</h3>
                <p className="text-xs text-slate-600">
                  We partner exclusively with Scheduled Commercial Banks and NBFCs licensed by the Reserve Bank of India.
                </p>
              </div>

              <div className="card-fintech p-5 space-y-2 bg-slate-50">
                <ShieldCheck className="w-6 h-6 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Account Erasure Right</h3>
                <p className="text-xs text-slate-600">
                  Under the DPDP Act, borrowers hold full authority to withdraw consent and request immediate deletion of personal records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ SECTION ═══ */}
      <section id="faq" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Clear Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-subtle"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA BANNER ═══ */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="badge-emerald bg-emerald-950 text-emerald-300 border-emerald-800 text-xs">
            Begin With Zero Risk
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Take Control of Your Debt Portfolio Today
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            See your exact interest savings and pre-approved Balance Transfer offers in under three minutes. No fees, no card required.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-accent text-sm !py-3 !px-8 cursor-pointer shadow-lg inline-flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ INSTITUTIONAL FOOTER ═══ */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>navesta</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Navesta is an institutional debt management and refinancing platform. We empower Indian borrowers with transparent debt analytics and seamless bank takeover solutions.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#calculator" className="hover:text-white transition-colors">Balance Transfer Calculator</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">Credit Card Takeovers</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">EMI Consolidation</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">Avalanche Payoff Method</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Compliance</h4>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#security" className="hover:text-white transition-colors">DPDP Act (2023) Notice</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Information Security Policy</a></li>
                <li><a href="#partners" className="hover:text-white transition-colors">Partner Lending Disclosure</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Grievance Officer</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Lending Partners</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Financial products are originated directly by RBI-registered Scheduled Commercial Banks &amp; NBFCs. Navesta acts as an authorized digital lending platform partner under applicable RBI guidelines.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} Navesta Technologies Pvt. Ltd. All rights reserved.
            </div>
            <div className="flex gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">RBI Digital Lending Guidelines</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

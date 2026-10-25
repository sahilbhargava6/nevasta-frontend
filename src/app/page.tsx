'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import PartnerShowcase from '@/components/PartnerShowcase';
import {
  CreditCard,
  Layers,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  Building2,
  FileCheck2,
  Sparkles,
  TrendingDown,
  Calendar,
  Landmark,
  Zap,
  BarChart3,
  Check,
  X as CloseIcon,
  Star,
  Quote,
} from 'lucide-react';

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openAudit = (type: 'card' | 'loan' | 'both' = 'card') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navesta:open-audit', { detail: { debtType: type } }));
    }
  };

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

  // Mathematical Amortization for Navesta Partner Takeover (10.25% benchmark)
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

  const faqs = [
    {
      q: 'What exactly does Navesta do?',
      a: 'Navesta is an AI-driven debt advisory and bank takeover platform. We help individuals trapped in high-interest debt (such as credit card balances at 24%–42% APR or multiple high-EMI personal loans) analyze their debt portfolio, calculate their exact calendar freedom date, and refinance through our RBI-regulated partner banks at institutional rates starting from 10.25% p.a.',
    },
    {
      q: 'How does a Balance Transfer or Loan Takeover work?',
      a: 'A Balance Transfer replaces toxic, high-cost obligations with an institutional debt facility. Our partner bank disburses funds directly to pay off your existing credit card issuers and personal loan lenders, consolidating your balances into a single, significantly lower monthly EMI.',
    },
    {
      q: 'Will checking my options affect my CIBIL credit score?',
      a: 'No, absolutely not. Navesta uses a soft credit inquiry to diagnostic your debt portfolio. Soft inquiries do not impact your CIBIL score. A formal hard inquiry is only initiated if and when you explicitly choose to apply for a bank takeover facility.',
    },
    {
      q: 'Is Navesta really 100% free for borrowers?',
      a: 'Yes, 100% free. Borrowers never pay advisory fees, subscription charges, or hidden platform fees. Our revenue comes directly from partner financial institutions as a standard origination fee when a takeover loan is disbursed.',
    },
    {
      q: 'What is the difference between Avalanche and Snowball payoff strategies?',
      a: 'The Debt Avalanche method prioritizes paying accounts with the highest annual interest rate first, mathematically minimizing total interest paid. The Debt Snowball method targets the smallest balance first to build early psychological momentum. Nava AI calculates both so you can choose the optimal fit for your cash flow.',
    },
    {
      q: 'Are your lending partners RBI regulated?',
      a: 'Yes. All refinancing offers originate exclusively from Reserve Bank of India (RBI) regulated Scheduled Commercial Banks and Systemically Important NBFCs including HDFC Bank, ICICI Bank, State Bank of India, Axis Bank, Tata Capital, and Bajaj Finserv.',
    },
    {
      q: 'How is borrower personal data protected under the DPDP Act?',
      a: 'Navesta complies with the Digital Personal Data Protection (DPDP) Act. We use 256-bit AES encryption at rest and TLS 1.3 in transit. We never sell customer records to telemarketers or third-party lead brokers.',
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

  const testimonials = [
    {
      name: 'Rahul Sharma',
      city: 'Pune',
      role: 'Software Engineer',
      saved: 'Saved ₹8,400/mo',
      stars: 5,
      story:
        'I had 4 separate personal loans and 2 credit cards. Navesta showed me the avalanche method and arranged a direct balance takeover. I saved ₹8,400 per month in interest and cleared my personal loan 14 months early!',
    },
    {
      name: 'Sneha Iyer',
      city: 'Bengaluru',
      role: 'Product Manager',
      saved: 'Saved ₹1.2 Lakhs',
      stars: 5,
      story:
        'My credit card minimum due was eating ₹22,000 every month without touching the principal. Navesta’s takeover shifted the entire balance to a 10.5% bank facility. The process took 10 minutes and saved me ₹1.2L.',
    },
    {
      name: 'Arjun Patel',
      city: 'Ahmedabad',
      role: 'Business Owner',
      saved: 'CIBIL 680 → 762',
      stars: 5,
      story:
        'The CIBIL Optimizer pinpointed the exact credit utilization ratios hurting my rating. Fixed them in 5 months, saw my score jump by 82 points, and refinanced my commercial loan at an 8.4% benchmark rate.',
    },
    {
      name: 'Meena Krishnan',
      city: 'Hyderabad',
      role: 'Marketing Lead',
      saved: 'EMI Cut by ₹11K/mo',
      stars: 5,
      story:
        'I was juggling ₹42,000/month in EMIs across 6 different lenders. Navesta consolidated them into a single, lower EMI and cut my monthly outflow by ₹11,000. It gave my family breathing room.',
    },
    {
      name: 'Priya Menon',
      city: 'Kochi',
      role: 'Healthcare Professional',
      saved: 'Debt-free Wedding',
      stars: 5,
      story:
        'Planning our wedding while carrying an existing car loan seemed impossible. Navesta helped us set aside ₹15,000 monthly without missing an EMI. We got married completely debt-free!',
    },
    {
      name: 'Dev Anand Pillai',
      city: 'Kochi',
      role: 'Entrepreneur',
      saved: '₹11L Cleared in 19 Mo',
      stars: 5,
      story:
        'Carrying ₹18 Lakhs across cards and loans felt overwhelming. Navesta gave me a structured 26-month roadmap. I am on month 19 and already cleared ₹11 Lakhs. Hope restored.',
    },
  ];

  const pressLogos = [
    { name: 'Economic Times', tag: 'ET' },
    { name: 'Mint', tag: 'MINT' },
    { name: 'Inc42', tag: 'INC42' },
    { name: 'YourStory', tag: 'YS' },
    { name: 'Business Standard', tag: 'BS' },
    { name: 'CNBC-TV18', tag: 'CNBC' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — THE EMOTIONAL & PRACTICAL HOOK
          (Blending previous site's clear 3-path selector with modern fintech styling)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-14 lg:pb-24 bg-white border-b border-slate-200/90">
        {/* Subtle high-trust background pattern */}
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-subtle max-w-full truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="truncate">AI DEBT ADVISORY &amp; INSTITUTIONAL BANK TAKEOVERS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.16]">
              Struggling With Debt?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 block sm:inline mt-1 sm:mt-0">
                Here&apos;s Your Way Out.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Being debt-free isn&apos;t a dream — it&apos;s an exact date on the calendar. Navesta connects your loans, detects high-interest traps, and structures institutional bank takeovers from <strong className="text-slate-900 font-semibold">10.25% p.a.</strong> to slash your monthly EMIs.
            </p>
          </div>

          {/* ═══ 3 DIRECT INTERACTIVE PATHWAY CARDS (From Original Design) ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-8 sm:mt-10 max-w-6xl mx-auto">
            {/* Pathway 1: Credit Card Debt */}
            <div className="bg-gradient-to-b from-white via-orange-50/30 to-amber-50/40 border-2 border-amber-200/80 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-card-hover hover:border-amber-300 transition-all duration-200 relative group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                    24–42% APR Trap
                  </span>
                </div>

                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Path 01 • Credit Card Debt
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    Can&apos;t Clear Your Card Balance?
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Minimum payments keep the bank happy — but you could pay <strong>2–3× what you owe</strong> in compounding finance charges. We show you the exact steps to break free with a 10.25% takeover.
                </p>
              </div>

              <div className="pt-5 sm:pt-6 mt-4 border-t border-amber-100/80">
                <button
                  onClick={() => openAudit('card')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm transition-all min-h-[44px]"
                >
                  <span>Show Me the Way Out</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pathway 2: Loan & EMI Debt */}
            <div className="bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/40 border-2 border-blue-200/80 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all duration-200 relative group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700 shadow-sm">
                    <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                    Salary Drain
                  </span>
                </div>

                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-800">
                    Path 02 • High Loan EMIs
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    EMIs Draining Your Salary?
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Personal loan and vehicle EMIs leaving nothing in your bank account by the 15th? We show you how to lower your monthly outflow and calculate the <strong>exact month you&apos;ll be debt-free</strong>.
                </p>
              </div>

              <div className="pt-5 sm:pt-6 mt-4 border-t border-blue-100/80">
                <button
                  onClick={() => openAudit('loan')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 shadow-sm transition-all min-h-[44px]"
                >
                  <span>Show Me My Freedom Date</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pathway 3: Debt Consolidation */}
            <div className="bg-gradient-to-b from-white via-emerald-50/30 to-teal-50/40 border-2 border-emerald-200/80 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-card-hover hover:border-emerald-300 transition-all duration-200 relative group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                    All Debts
                  </span>
                </div>

                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Path 03 • Debt Consolidation
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    Too Many EMIs? Roll Into One.
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Credit cards, personal loans, BNPL — juggling multiple lenders is chaotic and costly. One consolidated institutional facility cuts your rate to a <strong>single, lower monthly EMI</strong>.
                </p>
              </div>

              <div className="pt-5 sm:pt-6 mt-4 border-t border-emerald-100/80">
                <button
                  onClick={() => openAudit('both')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all min-h-[44px]"
                >
                  <span>Find My Consolidation Rate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Hero Micro-Stats Ribbon */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  ₹480 Cr+
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Debt Analyzed
                </div>
              </div>
              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  2.4 Lakh+
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Indians Guided
                </div>
              </div>
              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
                  ₹12,400
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Avg Saved / Month
                </div>
              </div>
              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums">
                  4.8 ★
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Platform Rating
                </div>
              </div>
            </div>

            {/* Trust Pill Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-700" />
                <span>256-Bit Bank Grade SSL</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>ISO 27001 Certified Infrastructure</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero CIBIL Score Impact</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>100% Free For Borrowers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRESS / AS SEEN IN STRIP (From Original Design)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-6 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              As Seen In
            </span>
            {pressLogos.map((press) => (
              <div
                key={press.name}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/80 border border-slate-200/80 shadow-subtle text-xs font-bold text-slate-700"
              >
                <span>{press.name}</span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                  [{press.tag}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INTERACTIVE BEFORE VS AFTER COMPARISON
      ═══════════════════════════════════════════════════════════════ */}
      <BeforeAfterSlider onOpenAudit={openAudit} />

      {/* ═══════════════════════════════════════════════════════════════
          INTERACTIVE TAKEOVER & SAVINGS CALCULATOR
      ═══════════════════════════════════════════════════════════════ */}
      <section id="calculator" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Interactive Financial Simulation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Calculate Your Real-Time Takeover Savings
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Adjust your outstanding balance and current interest rate to see the instant reduction in monthly EMI and lifetime interest.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-elevated p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* Total Debt Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                    <span>Total Outstanding Debt</span>
                    <span className="font-extrabold text-slate-950 text-base tabular-nums">
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
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>₹50K</span>
                    <span>₹12.5 Lakhs</span>
                    <span>₹25 Lakhs</span>
                  </div>
                </div>

                {/* Current APR Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                    <span>Current Blended Rate (APR)</span>
                    <span className="font-extrabold text-rose-600 text-base tabular-nums">
                      {currentRate}% p.a.{' '}
                      <span className="text-xs font-normal text-slate-500">
                        {currentRate >= 36 ? '(Credit Cards)' : currentRate >= 20 ? '(Expensive NBFC)' : '(Personal Loan)'}
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
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>12% (Standard)</span>
                    <span>28% (NBFC)</span>
                    <span>44% (Credit Cards)</span>
                  </div>
                </div>

                {/* Tenure Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                    <span>Desired Payoff Horizon</span>
                    <span className="font-extrabold text-slate-900 text-base tabular-nums">
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
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>12 Mos</span>
                    <span>36 Mos (Optimal)</span>
                    <span>60 Mos</span>
                  </div>
                </div>
              </div>

              {/* Result Summary Column */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-xl p-6 text-white space-y-4 shadow-card">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span>Takeover Benchmark Rate</span>
                  <span className="badge-emerald font-bold">{takeoverRate}% p.a.</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Current Monthly EMI:</span>
                    <span className="font-semibold text-slate-300 line-through tabular-nums">
                      ₹{currentEMI.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-medium">New Refinanced EMI:</span>
                    <span className="font-bold text-white text-base tabular-nums">
                      ₹{takeoverEMI.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Total Interest Saved
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums mt-0.5">
                      ₹{lifetimeInterestSavings.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-emerald-300 font-medium mt-1">
                      Puts ₹{monthlySavings.toLocaleString('en-IN')}/mo back in your wallet
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAuthOpen(true)}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                >
                  <span>Claim Pre-Approved Rate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INSTITUTIONAL PARTNERS SHOWCASE & RBI COMPLIANCE
      ═══════════════════════════════════════════════════════════════ */}
      <PartnerShowcase />

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS (4 SIMPLE STEPS FROM PREVIOUS DESIGN)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="how" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Debt-Free in 4 Transparent Steps
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              From statement ingestion to direct bank payoff, here is how Navesta delivers clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Add Your Loans &amp; Cards
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect statements or perform a soft bureau pull. We automatically aggregate your credit cards, personal loans, and EMI accounts with zero CIBIL hit.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                See Your Whole Picture
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get an instant diagnostic dashboard revealing total debt, exact monthly interest leakage, and your current projected freedom date.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Avalanche &amp; Bank Takeover
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select an institutional takeover offer starting from 10.25% p.a. The partner bank pays off your existing high-cost lenders directly.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Celebrate Calendar Freedom
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay one lower monthly EMI. Watch your balance extinguish month by month until you reach zero debt and unlock life event savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          NAVA AI: 24/7 FINANCIAL CO-PILOT
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/80">
              Powered By Nava AI
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3">
              Your Personal 24/7 Debt CFO
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Nava analyzes your complete financial profile to plan, optimize, and eliminate debt faster than standard banking channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 hover:border-slate-600 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Debt Intelligence</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Nava evaluates every loan and card balance, testing mathematical Avalanche and Snowball payoff scenarios. It monitors the market 24/7 and alerts you whenever bank takeover rates drop.
              </p>
              <div className="text-xs font-semibold text-emerald-400 pt-2 border-t border-slate-700/60">
                Avg. ₹1.4 Lakhs interest saved
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 hover:border-slate-600 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Life Event Planning</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Planning a wedding, higher education, or home renovation? Nava builds a custom monthly cash flow roadmap that accommodates major life milestones without slipping into predatory debt cycles.
              </p>
              <div className="text-xs font-semibold text-amber-400 pt-2 border-t border-slate-700/60">
                Roadmaps for 12+ life milestones
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 hover:border-slate-600 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">CIBIL Score Optimizer</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Nava detects the exact credit factors pulling down your score — high card utilization, inquiry clustering, or repayment delays — and provides a week-by-week restoration schedule.
              </p>
              <div className="text-xs font-semibold text-emerald-400 pt-2 border-t border-slate-700/60">
                Avg. +82 points increase in 6 months
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          REAL TESTIMONIALS (From Previous Design)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Verified Social Proof
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Stories That Started With One Decision
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Real Indians who broke free from toxic minimum payments and high EMIs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testi) => (
              <div
                key={testi.name}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-subtle hover:shadow-card transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    {Array.from({ length: testi.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{testi.story}&rdquo;
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{testi.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {testi.role} • {testi.city}
                    </div>
                  </div>
                  <span className="badge-emerald text-[11px] font-bold">{testi.saved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ SECTION (Clear Transparency Answers)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clear &amp; Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Everything you need to know about our institutional takeovers, rates, and process.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50/50"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL HIGH-CONVERSION CTA SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Take Control of Your Debt?
          </h2>
          <p className="text-base sm:text-lg text-amber-100 max-w-2xl mx-auto leading-relaxed">
            Join 2.4 Lakh+ Indians who have replaced high-interest credit card debt and chaotic EMIs with an institutional takeover plan. 100% Free · Soft pull only.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm sm:text-base font-extrabold text-amber-950 bg-white hover:bg-amber-50 shadow-elevated transition-all cursor-pointer"
            >
              <span>Get Started Free — In 3 Minutes</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-amber-100 pt-4">
            <span>✓ 2.4L+ Users Helped</span>
            <span>✓ ₹90Cr+ Interest Saved</span>
            <span>✓ 4.8★ Rating</span>
            <span>✓ Zero CIBIL Score Impact</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INSTITUTIONAL FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  N
                </div>
                <span className="text-base font-bold text-white tracking-tight">navesta</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                India&apos;s leading AI-powered debt advisory and institutional balance takeover platform. Helping consumers break the minimum payment trap.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
                Solutions
              </div>
              <ul className="space-y-2">
                <li>
                  <a href="#calculator" className="hover:text-white transition-colors">
                    Credit Card Takeover (24–42% APR)
                  </a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-white transition-colors">
                    Personal Loan Consolidation
                  </a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-white transition-colors">
                    EMI Amortization Simulator
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-white transition-colors">
                    CIBIL Score Optimization
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
                Institutional Network
              </div>
              <ul className="space-y-2">
                <li>HDFC Bank Limited</li>
                <li>ICICI Bank Limited</li>
                <li>State Bank of India</li>
                <li>Axis Bank Limited</li>
                <li>Tata Capital Financial Services</li>
                <li>Bajaj Finserv Limited</li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
                Security &amp; Legal
              </div>
              <ul className="space-y-2 text-[11px]">
                <li>256-Bit TLS 1.3 Bank-Grade Security</li>
                <li>Digital Personal Data Protection (DPDP) Act Compliant</li>
                <li>Zero CIBIL Score Impact (Soft Pulls)</li>
                <li>Registered Office: Bengaluru, Karnataka, India</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Navesta Technologies Private Limited. All rights reserved.
            </div>
            <div>
              Navesta is an advisory technology provider and does not directly disburse loans. Financing is provided exclusively by RBI-regulated partner lenders.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

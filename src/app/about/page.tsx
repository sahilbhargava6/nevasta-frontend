'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  HeartHandshake,
  TrendingUp,
} from 'lucide-react';

export default function AboutPage() {
  const [authOpen, setAuthOpen] = useState(false);

  const values = [
    {
      title: 'Borrower-First Transparency',
      desc: 'We never charge borrowers advisory fees, subscription charges, or hidden platform fees. Our advice is 100% fiduciary and unbiased.',
      icon: HeartHandshake,
    },
    {
      title: 'Mathematical Rigor',
      desc: 'No vague financial tips or generic budgeting apps. Nava AI builds verified reduction schedules using deterministic amortization math.',
      icon: TrendingUp,
    },
    {
      title: 'Institutional Grade Privacy',
      desc: 'We treat your financial records like medical data. 256-bit AES encryption at rest, TLS 1.3 in transit, and strictly zero data sales to third parties.',
      icon: Lock,
    },
    {
      title: 'Only RBI-Regulated Lenders',
      desc: 'We exclusively partner with Scheduled Commercial Banks and Tier-1 Systemically Important NBFCs under direct RBI supervision.',
      icon: Building2,
    },
  ];

  const milestones = [
    { num: '₹480 Cr+', label: 'Debt Analyzed to Date' },
    { num: '2.4 Lakh+', label: 'Borrowers Guided' },
    { num: '₹90 Cr+', label: 'Cumulative Interest Saved' },
    { num: '10.25%', label: 'Lowest Takeover Benchmark' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>WHO WE ARE • OUR STORY &amp; MISSION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
            We Exist to End the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700">
              Minimum Payment Trap
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            In India today, over 80 million credit cards revolve balances at devastating interest rates of 36% to 42% APR. Millions of salaried professionals watch their hard-earned paychecks get wiped out by the 15th of every month. Navesta was founded in Bengaluru to give everyday Indians an institutional, mathematical way out.
          </p>
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {milestones.map((m) => (
              <div key={m.label} className="p-4">
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 tabular-nums">
                  {m.num}
                </div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1.5">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Origin Story */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The Problem</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Why Traditional Banks Won&apos;t Help You Get Out of Debt
            </h2>
          </div>

          <div className="space-y-5 text-sm sm:text-base text-slate-700 leading-relaxed">
            <p>
              Banks earn the majority of their retail consumer profits from revolvers — customers who pay only the &quot;Minimum Amount Due&quot; each billing cycle. When a customer owes ₹5,00,000 on cards, paying the minimum due keeps the bank happy, but mathematically stretches the payoff to 12+ years and over ₹7,50,000 in pure interest.
            </p>
            <p>
              We asked a simple question: <strong className="text-slate-950 font-bold">What if technology could flip this model?</strong> What if an AI could analyze a borrower&apos;s messy statements, find institutional debt facilities starting at 10.25% p.a., and force high-cost lenders to get paid off directly?
            </p>
            <p>
              That is what Navesta does. We are not a bank. We are your algorithmic debt advocate. We structure institutional takeovers with top scheduled banks (HDFC, ICICI, SBI, Axis, Tata Capital, Bajaj Finserv) to extinguish predatory interest and set an exact, unshakeable freedom date on your calendar.
            </p>
          </div>
        </div>
      </section>

      {/* Our 4 Core Principles */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">How We Operate</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Our Core Principles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{val.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Discover Your Freedom Date?</h2>
          <p className="text-sm sm:text-base text-amber-100">
            Join 2.4 Lakh+ Indians who have simplified their debt journey with Navesta.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-amber-950 bg-white hover:bg-amber-50 shadow-elevated transition-all"
          >
            <span>Start Free Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

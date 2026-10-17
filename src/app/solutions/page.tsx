'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';
import {
  CreditCard,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';

export default function SolutionsPage() {
  const [authOpen, setAuthOpen] = useState(false);

  const solutions = [
    {
      id: 'credit-card-takeover',
      href: '/solutions/credit-card-takeover',
      title: 'Credit Card Balance Takeover',
      badge: '24–42% APR Reduction',
      badgeColor: 'badge-amber',
      icon: CreditCard,
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      description:
        'Revolving credit card interest compounds monthly at 3% to 3.5%. We execute direct institutional balance transfers into a lower-rate term loan starting from 10.25% p.a., converting endless minimum payments into a fixed, predictable EMI.',
      metrics: [
        { label: 'Avg Interest Drop', val: 'Up to 68%' },
        { label: 'Freedom Horizon', val: '12 to 48 Months' },
        { label: 'Disbursal Speed', val: 'Direct to Card Issuer' },
      ],
      ctaText: 'Explore Credit Card Takeovers',
    },
    {
      id: 'loan-consolidation',
      href: '/solutions/loan-consolidation',
      title: 'Multi-Loan & EMI Consolidation',
      badge: 'Single Monthly Payment',
      badgeColor: 'badge-blue',
      icon: Layers,
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      description:
        'Juggling personal loans, vehicle financing, and consumer durables across different banks creates accidental late fee risks. We consolidate all fragmented obligations into one institutional loan with 30–45% lower monthly cash outflow.',
      metrics: [
        { label: 'Cash Flow Relief', val: '30–45% Lower EMI' },
        { label: 'Lenders Consolidated', val: 'Up to 8 Accounts' },
        { label: 'Tenure Options', val: 'Up to 60 Months' },
      ],
      ctaText: 'Explore Loan Consolidation',
    },
    {
      id: 'debt-free-planner',
      href: '/calculator',
      title: 'Nava AI Debt Freedom Date Planner',
      badge: 'Mathematical Avalanche & Snowball',
      badgeColor: 'badge-emerald',
      icon: Sparkles,
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      description:
        'Know your exact debt freedom month down to the calendar day. Our algorithmic optimization engine tests both Avalanche and Snowball payoff scenarios, finding thousands of rupees in avoidable interest leakage.',
      metrics: [
        { label: 'Payoff Acceleration', val: '12–18 Months Sooner' },
        { label: 'Interest Saved', val: 'Avg ₹1.4 Lakhs' },
        { label: 'Plan Setup', val: 'Under 3 Minutes' },
      ],
      ctaText: 'Launch Freedom Simulator',
    },
    {
      id: 'cibil-repair',
      href: '/about',
      title: 'CIBIL Score Restoration Engine',
      badge: 'Credit Health Roadmap',
      badgeColor: 'badge-slate',
      icon: ShieldCheck,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      description:
        'High credit utilization and past late marks damage your CIBIL score, locking you out of affordable financing. Nava AI generates a week-by-week credit rehabilitation roadmap so you qualify for Tier-1 bank rates.',
      metrics: [
        { label: 'Avg Score Increase', val: '+82 Points in 6 Mos' },
        { label: 'Diagnostic Cost', val: '100% Free' },
        { label: 'CIBIL Score Hit', val: '0 (Soft Pull Only)' },
      ],
      ctaText: 'View Diagnostic Details',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 shadow-subtle">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>INSTITUTIONAL DEBT SOLUTIONS • COMPLETE DIRECTORY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
            Engineered Solutions for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
              High-Burden Debt
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Whether you are struggling with compounding credit card interest or multiple loan EMIs draining your salary, discover the targeted institutional solution that fits your situation.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((sol) => {
              const Icon = sol.icon;
              return (
                <div
                  key={sol.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold ${sol.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${sol.badgeColor}`}>
                        {sol.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">{sol.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{sol.description}</p>

                    {/* Metrics Panel */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      {sol.metrics.map((m) => (
                        <div key={m.label} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-xs font-bold text-slate-900">{m.val}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={sol.href}
                      className="w-full btn-primary !py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                    >
                      <span>{sol.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Institutional Network Callout */}
      <section className="py-16 bg-white border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% REGULATED DISBURSALS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Every Refinancing Facility Originates With Top Scheduled Banks
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            HDFC Bank, ICICI Bank, State Bank of India, Axis Bank, Tata Capital, and Bajaj Finserv.
            Direct bank-to-bank settlement means existing lenders are officially closed with zero stress.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="btn-accent !py-3 !px-8 text-sm font-bold inline-flex items-center gap-2 shadow-sm"
          >
            <span>Check Pre-Approved Rates</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

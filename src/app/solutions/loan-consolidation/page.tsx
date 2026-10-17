'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';
import {
  Layers,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Building2,
  Lock,
  Landmark,
} from 'lucide-react';

export default function LoanConsolidationPage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>DEBT CONSOLIDATION • MULTI-LOAN REFINANCING</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
            Juggling Multiple EMIs?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
              Roll Them Into One Lower Payment
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Personal loans, consumer electronics EMIs, vehicle loans, and BNPL accounts. Multiple payment due dates make it nearly impossible to save and leave your salary depleted by mid-month. Navesta merges all your loans into one single institutional debt facility, reducing monthly cash outflow by 30% to 45%.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-primary text-sm !py-3 !px-6 flex items-center justify-center gap-2"
            >
              <span>Consolidate Your Loans Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/calculator"
              className="btn-secondary text-sm !py-3 !px-5 flex items-center justify-center gap-2"
            >
              <span>Simulate Consolidation EMI</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              The Consolidation Advantage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Why Consolidating With Navesta Is Superior
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">30–45% Lower Monthly EMI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                By replacing high-rate unorganized NBFC loans (18%–26%) with an institutional bank facility starting from 10.25%, your monthly obligation drops immediately.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">One Single Due Date</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No more tracking 5 different auto-debits on the 3rd, 7th, 12th, 18th, and 24th of the month. You make exactly one predictable monthly payment after salary day.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Protects Your CIBIL Score</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Having 5+ active open loan accounts flags a &quot;credit hungry&quot; risk profile to credit bureaus. Consolidating closes old lines and establishes a clean, high-score profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Requirements */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Basic Pre-Qualification Criteria
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Check if your profile matches the underwriting guidelines of our scheduled bank partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700">
                <strong className="text-slate-900 block font-semibold">Salaried or Self-Employed:</strong> Minimum net monthly take-home income of ₹25,000.
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700">
                <strong className="text-slate-900 block font-semibold">Credit History:</strong> CIBIL score of 650 or above (or clean repayment history on existing loans).
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700">
                <strong className="text-slate-900 block font-semibold">Total Outstanding Balance:</strong> Combined unsecured debt between ₹50,000 and ₹25,00,000.
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700">
                <strong className="text-slate-900 block font-semibold">Zero Fee For Borrowers:</strong> Free advisory and eligibility matching with zero upfront charges.
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-accent !py-3 !px-8 text-sm font-bold inline-flex items-center gap-2 shadow-sm"
            >
              <span>Check Pre-Approved Consolidation Rates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

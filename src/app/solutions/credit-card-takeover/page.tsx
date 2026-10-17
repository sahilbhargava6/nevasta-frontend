'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  X as CloseIcon,
  AlertTriangle,
  Building2,
  Lock,
} from 'lucide-react';

export default function CreditCardTakeoverPage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>CREDIT CARD DEBT RELIEF • BALANCE TRANSFER TAKEOVERS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
            Replace 42% Card APR With a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700">
              10.25% Bank Takeover
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Credit cards are the most expensive form of consumer debt in India. If you carry a rolling balance, paying only the minimum due will cost you 2–3× your balance in interest alone. Navesta refinances your card debt directly with scheduled banks, slashing your rate and cutting years off your repayment.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-primary text-sm !py-3 !px-6 flex items-center justify-center gap-2"
            >
              <span>Analyze Your Card Balances Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/calculator"
              className="btn-secondary text-sm !py-3 !px-5 flex items-center justify-center gap-2"
            >
              <span>Simulate Interest Savings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Anatomy of Card Debt in India */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              The Compounding Trap
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              The 4 Hidden Costs of Credit Card Debt in India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-2.5">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                  01
                </span>
                <span>3.0% to 3.5% Monthly Interest (Up to 42% APR)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Unlike personal loans with reducing interest, credit card interest compounds daily and monthly. If you pay late or revolve, you lose your interest-free grace period on every new transaction.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-2.5">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                  02
                </span>
                <span>18% GST on All Finance Charges</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The Indian tax code levies 18% GST on every rupee of interest, late fees, and processing charges charged by your card issuer, adding hundreds of rupees of tax on top of toxic debt.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-2.5">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                  03
                </span>
                <span>Credit Utilization Penalty on CIBIL</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Using over 30% of your credit card limit signals distress to credit bureaus. It drops your CIBIL score, causing future home loan or car loan applications to be rejected or priced higher.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-2.5">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                  04
                </span>
                <span>The Illusion of &quot;Minimum Amount Due&quot;</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The minimum due is set at approximately 5% of your total balance. 80–90% of this payment goes directly into paying the bank&apos;s interest and GST, leaving your actual principal untouched.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Navesta Executes the Takeover */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              The Takeover Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              How the Balance Transfer Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Portfolio Aggregation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your latest PDF credit card statements or authorize a soft bureau check. Navesta aggregates your balances, interest rates, and minimum dues into a single diagnostic.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Institutional Underwriting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Partner banks (such as HDFC, ICICI, SBI) match your profile against institutional balance transfer criteria, offering fixed interest rates starting from 10.25% p.a.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Direct Payoff &amp; Closure</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upon agreement, the partner bank settles your card balances directly with your card issuers. You receive no-due certificates and switch to a single low monthly EMI.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-accent !py-3 !px-8 text-sm font-bold inline-flex items-center gap-2 shadow-sm"
            >
              <span>Check If You Qualify For a Card Takeover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

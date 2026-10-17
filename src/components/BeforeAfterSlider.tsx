'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Percent,
  Clock,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function BeforeAfterSlider({
  onOpenAudit,
}: {
  onOpenAudit?: () => void;
}) {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [activeTab, setActiveTab] = useState<'split' | 'before' | 'after'>('split');

  return (
    <section className="py-16 bg-white border-y border-slate-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200 mb-3">
            <Zap className="w-3.5 h-3.5 text-blue-700" />
            <span>Interactive Comparison</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See What Happens When You Switch to a Takeover
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Compare the punishing reality of paying credit card minimum dues against a structured 10.25% bank buyout.
          </p>

          {/* Quick Filter Pill for Mobile / Tablets */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl mt-6 border border-slate-200">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'split'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side Split
            </button>
            <button
              onClick={() => setActiveTab('before')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'before'
                  ? 'bg-rose-100 text-rose-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Without Navesta
            </button>
            <button
              onClick={() => setActiveTab('after')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'after'
                  ? 'bg-emerald-100 text-emerald-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              With Navesta (10.25%)
            </button>
          </div>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card Left: The Painful Status Quo */}
          {(activeTab === 'split' || activeTab === 'before') && (
            <div className="bg-gradient-to-b from-rose-50/70 via-red-50/30 to-white rounded-3xl p-6 sm:p-8 border-2 border-rose-200/90 shadow-card flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Punishing Cycle
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      Without Navesta
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      The Minimum Due Hamster Wheel
                    </h3>
                  </div>
                </div>

                {/* Shock Metrics */}
                <div className="grid grid-cols-2 gap-3 bg-white/90 p-4 rounded-2xl border border-rose-200/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Effective APR
                    </span>
                    <div className="text-2xl font-black text-rose-600">36%–49.5%</div>
                    <span className="text-[10px] text-slate-500">Includes 18% GST</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Time to Freedom
                    </span>
                    <div className="text-2xl font-black text-rose-600">12–18 Years</div>
                    <span className="text-[10px] text-slate-500">Paying only minimum due</span>
                  </div>
                </div>

                {/* Negative Checkpoints */}
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      <strong>18% GST Leak:</strong> Every single rupee of interest incurs an extra 18% tax that goes straight to the government.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      <strong>CIBIL Damage:</strong> 80%+ card limit utilization severely drags your credit score, rejecting future home loan approvals.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      <strong>Multiple Due Dates:</strong> Juggling 3 to 5 payment cycles means one missed date triggers ₹1,200 late fees + finance charges.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-rose-200/80 text-[11px] text-rose-800 font-semibold text-center">
                Outcome: You end up paying 2.8× to 3.4× of what you originally spent.
              </div>
            </div>
          )}

          {/* Card Right: The Navesta 10.25% Solution */}
          {(activeTab === 'split' || activeTab === 'after') && (
            <div className="bg-gradient-to-b from-emerald-50/70 via-blue-50/30 to-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Institutional Way Out
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      With Navesta
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      10.25% Direct Bank Takeover
                    </h3>
                  </div>
                </div>

                {/* Hero Metrics */}
                <div className="grid grid-cols-2 gap-3 bg-white/95 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Takeover Rate
                    </span>
                    <div className="text-2xl font-black text-emerald-600">10.25% p.a.</div>
                    <span className="text-[10px] text-emerald-800 font-medium">Fixed personal loan</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Time to Freedom
                    </span>
                    <div className="text-2xl font-black text-blue-700">24–36 Months</div>
                    <span className="text-[10px] text-slate-500">Exact calendar date</span>
                  </div>
                </div>

                {/* Positive Checkpoints */}
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>Direct Bank Payoff:</strong> Institutional lender writes single checks directly to your card companies, closing balances in 48 hours.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>CIBIL Score Surge:</strong> Revolving credit card utilization plummets from 85%+ to 0%, unlocking a rapid 40–80 point bureau boost.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>One Single Auto-Debit:</strong> One fixed date, one lower EMI, zero late fees, and zero collection harassment.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-200">
                <button
                  onClick={onOpenAudit}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md min-h-[44px]"
                >
                  <span>See How Much You Can Save Today</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

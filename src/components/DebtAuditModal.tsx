'use client';

import { useState } from 'react';
import {
  X,
  CreditCard,
  Landmark,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  TrendingDown,
  ShieldCheck,
  Phone,
  MessageCircle,
  FileText,
} from 'lucide-react';

interface DebtAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DebtAuditModal({ isOpen, onClose }: DebtAuditModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [debtType, setDebtType] = useState<'card' | 'loan' | 'both'>('card');
  const [balance, setBalance] = useState<number>(300000);
  const [currentPayment, setCurrentPayment] = useState<number>(22000);
  const [phone, setPhone] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  // Algorithmic calculation for takeover
  const takeoverRate = 10.25; // 10.25% p.a.
  const tenureMonths = 36; // 3-year structured takeout
  const monthlyRate = takeoverRate / 12 / 100;
  const newEmi = Math.round(
    (balance * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );

  const monthlySavings = Math.max(0, currentPayment - newEmi);
  const totalInterestTakeover = Math.round(newEmi * tenureMonths - balance);

  // Estimating current cost without takeover (assuming 38% card APR or 20% personal loan)
  const currentEstApr = debtType === 'card' ? 0.38 : debtType === 'both' ? 0.30 : 0.18;
  const estCurrentInterest = Math.round(balance * currentEstApr * 3.5); // 3.5-year minimum due drag
  const totalInterestSaved = Math.max(45000, estCurrentInterest - totalInterestTakeover);

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + tenureMonths);
  const freedomFormatted = freedomDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleWhatsAppShare = () => {
    const msg = `Hi Navesta, I just ran my 30-Second Debt Audit:\n• Total Debt: ₹${balance.toLocaleString('en-IN')}\n• Current Monthly Outflow: ₹${currentPayment.toLocaleString('en-IN')}\n• Target 10.25% EMI: ₹${newEmi.toLocaleString('en-IN')}\n• Estimated Monthly Savings: ₹${monthlySavings.toLocaleString('en-IN')}\n\nPlease check my eligibility for a bank takeover.`;
    window.open(`https://wa.me/918045689200?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Instant Freedom Audit
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Step {step} of 3
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                30-Second Debt Freedom Analysis
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  What is your primary debt burden?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Select your primary challenge so Nava AI can apply the exact institutional lending guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDebtType('card')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    debtType === 'card'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <CreditCard
                    className={`w-6 h-6 mb-3 ${
                      debtType === 'card' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Credit Cards</h4>
                    <p className="text-[11px] text-slate-500 mt-1">24%–42% APR minimum due trap</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDebtType('loan')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    debtType === 'loan'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Landmark
                    className={`w-6 h-6 mb-3 ${
                      debtType === 'loan' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Personal Loans</h4>
                    <p className="text-[11px] text-slate-500 mt-1">14%–24% high monthly EMIs</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDebtType('both')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    debtType === 'both'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Layers
                    className={`w-6 h-6 mb-3 ${
                      debtType === 'both' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Both / Multiple</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Multiple EMIs draining salary</p>
                  </div>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900 font-semibold">Zero CIBIL Impact:</strong> Running an audit does not trigger a hard inquiry on your credit report.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  What are your estimated numbers?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Rough estimates are completely fine. We will calculate your exact institutional takeover.
                </p>
              </div>

              {/* Balance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Total Outstanding Balance
                  </label>
                  <span className="text-base font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    ₹{balance.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="3000000"
                  step="25000"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>₹50,000</span>
                  <span>₹15 Lakhs</span>
                  <span>₹30 Lakhs</span>
                </div>
              </div>

              {/* Monthly Payment Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Current Monthly Outflow (EMIs + Min Dues)
                  </label>
                  <span className="text-base font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    ₹{currentPayment.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="2500"
                  value={currentPayment}
                  onChange={(e) => setCurrentPayment(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>₹5,000/mo</span>
                  <span>₹75,000/mo</span>
                  <span>₹1,50,000/mo</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Takeover Structuring Complete
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Your Navesta Freedom Roadmap
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Based on institutional refinance guidelines at 10.25% p.a. over 36 months
                </p>
              </div>

              {/* Comparison Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 border-2 border-emerald-200/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Monthly Cash Saved
                  </span>
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                    +₹{monthlySavings.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">
                    restored to your salary
                  </span>
                </div>

                <div className="bg-blue-50/80 border-2 border-blue-200/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    New 10.25% EMI
                  </span>
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-700 mt-1 tabular-nums">
                    ₹{newEmi.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-blue-800 font-medium mt-0.5 block">
                    down from ₹{currentPayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Freedom Calendar Date Card */}
              <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Guaranteed Freedom Date
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-white">
                    {freedomFormatted}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Vs. 2038+ on revolving minimum card payments
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">
                    Interest Avoided
                  </span>
                  <span className="text-base sm:text-lg font-bold text-amber-400">
                    ₹{totalInterestSaved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Direct Next Action Options */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Receive Full Roadmap & Eligibility on WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/calculator';
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Explore Full Amortization Schedule</span>
                </button>
              </div>

              {submitted && (
                <div className="text-center text-xs text-emerald-700 font-semibold mt-2">
                  ✓ Inquiry initiated! A Navesta senior advisor will connect shortly.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

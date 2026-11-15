'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_MULTI_JOURNEY, useJourney, type DebtEntry } from '@/lib/journey';
import { activeDebts } from '@/lib/consolidationMath';
import { AlertTriangle, ArrowRight, ChevronDown, Landmark, Plus, X } from 'lucide-react';
import ConsolidationShell from './_components/ConsolidationShell';

/** Design: #multi-debt-page ("Your Debt Portfolio"), mdAddDebt / mdAnalyse. */

const EMPTY_DEBT: DebtEntry = { type: 'personal_loan', amount: 0, rate: 0, emi: 0, months: 0 };

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Number input that keeps what is being typed ("0.", "12.") while storing a
 * number in the journey, and follows outside changes (e.g. a row removed above).
 */
function NumInput({ value, onValue, ...rest }: { value: number; onValue: (n: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [text, setText] = useState(value ? String(value) : '');
  useEffect(() => {
    if (num(text) !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      {...rest}
      type="number"
      min={0}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onValue(num(e.target.value));
      }}
    />
  );
}

export default function MultipleDebtsPage() {
  const router = useRouter();
  const [multi, setMulti, , ready] = useJourney('multi', DEFAULT_MULTI_JOURNEY);
  const [error, setError] = useState('');

  const debts = multi.debts;

  const setDebt = (i: number, patch: Partial<DebtEntry>) => {
    setError('');
    setMulti((prev) => ({ ...prev, debts: prev.debts.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));
  };
  const addDebt = () => setMulti((prev) => ({ ...prev, debts: [...prev.debts, { ...EMPTY_DEBT }] }));
  const removeDebt = (i: number) => setMulti((prev) => ({ ...prev, debts: prev.debts.filter((_, j) => j !== i) }));

  const analyse = () => {
    if (debts.length === 0) {
      setError('Please add at least one debt.');
      return;
    }
    const filled = activeDebts(debts);
    if (filled.length === 0) {
      setError('Please fill in at least one outstanding amount.');
      return;
    }
    // As in mdAnalyse: only debts with an amount go forward, tenure starts at 36 months
    setMulti({ debts: filled, tenure: 36 });
    router.push('/journey/multiple/summary');
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

  return (
    <ConsolidationShell backHref="/debt-management">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Landmark className="w-4 h-4" aria-hidden /> DEBT CONSOLIDATION
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your Debt <span className="text-blue-600">Portfolio</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">Add all your loans &amp; credit cards below</p>
        </div>

        {ready &&
          debts.map((d, i) => {
            const id = `md-${i}`;
            return (
              <div className="card-fintech p-5 sm:p-6" key={i}>
                <div className="flex items-center justify-between mb-4">
                  <span className="badge-blue">Debt #{i + 1}</span>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    onClick={() => removeDebt(i)}
                    aria-label={`Remove debt #${i + 1}`}
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor={`${id}-type`} className={labelCls}>
                      Debt Type
                    </label>
                    <div className="relative">
                      <select
                        id={`${id}-type`}
                        className={`${inputCls} appearance-none pr-9`}
                        value={d.type}
                        onChange={(e) => setDebt(i, { type: e.target.value as DebtEntry['type'] })}
                      >
                        <option value="personal_loan">Personal Loan</option>
                        <option value="credit_card">Credit Card</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`${id}-amt`} className={labelCls}>
                      Outstanding (₹)
                    </label>
                    <NumInput id={`${id}-amt`} className={inputCls} inputMode="numeric" placeholder="e.g. 350000" value={d.amount} onValue={(n) => setDebt(i, { amount: n })} />
                  </div>
                  <div>
                    <label htmlFor={`${id}-rate`} className={labelCls}>
                      Interest Rate (%)
                    </label>
                    <NumInput id={`${id}-rate`} className={inputCls} step="0.1" inputMode="decimal" placeholder="e.g. 12.5" value={d.rate} onValue={(n) => setDebt(i, { rate: n })} />
                  </div>
                  <div>
                    <label htmlFor={`${id}-emi`} className={labelCls}>
                      Monthly EMI (₹)
                    </label>
                    <NumInput id={`${id}-emi`} className={inputCls} inputMode="numeric" placeholder="e.g. 8500" value={d.emi} onValue={(n) => setDebt(i, { emi: n })} />
                  </div>
                  <div>
                    <label htmlFor={`${id}-months`} className={labelCls}>
                      Months Left
                    </label>
                    <NumInput id={`${id}-months`} className={inputCls} inputMode="numeric" placeholder="e.g. 36" value={d.months} onValue={(n) => setDebt(i, { months: Math.round(n) })} />
                  </div>
                </div>
              </div>
            );
          })}

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-3 text-sm font-semibold text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-colors"
          onClick={addDebt}
        >
          <Plus className="w-4 h-4" aria-hidden /> Add Another Debt
        </button>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium p-3">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <button type="button" className="btn-accent w-full sm:w-auto" onClick={analyse} disabled={!ready}>
          Analyse My Debt Portfolio <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
        </button>
      </main>
    </ConsolidationShell>
  );
}

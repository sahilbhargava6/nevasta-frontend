'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_MULTI_JOURNEY, useJourney, type DebtEntry } from '@/lib/journey';
import { activeDebts } from '@/lib/consolidationMath';
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

  return (
    <ConsolidationShell backHref="/debt-management">
      <div className="acc-page">
        <div className="acc-left">
          <div className="acc-label">🏦 DEBT CONSOLIDATION</div>
          <h1 className="acc-h1">
            Your Debt <span>Portfolio</span>
          </h1>
          <p className="acc-sub">Add all your loans &amp; credit cards below</p>
          <div className="md-body">
            {ready && (
              <div>
                {debts.map((d, i) => {
                  const id = `md-${i}`;
                  return (
                    <div className="md-debt-row" key={i}>
                      <div className="md-debt-row-head">
                        <div className="md-debt-badge">Debt #{i + 1}</div>
                        <button type="button" className="md-remove-btn" onClick={() => removeDebt(i)} aria-label={`Remove debt #${i + 1}`}>
                          ×
                        </button>
                      </div>
                      <div className="md-debt-fields">
                        <div className="md-field" style={{ gridColumn: '1/-1' }}>
                          <label htmlFor={`${id}-type`}>Debt Type</label>
                          <select id={`${id}-type`} value={d.type} onChange={(e) => setDebt(i, { type: e.target.value as DebtEntry['type'] })}>
                            <option value="personal_loan">Personal Loan</option>
                            <option value="credit_card">Credit Card</option>
                          </select>
                        </div>
                        <div className="md-field">
                          <label htmlFor={`${id}-amt`}>Outstanding (₹)</label>
                          <NumInput id={`${id}-amt`} inputMode="numeric" placeholder="e.g. 350000" value={d.amount} onValue={(n) => setDebt(i, { amount: n })} />
                        </div>
                        <div className="md-field">
                          <label htmlFor={`${id}-rate`}>Interest Rate (%)</label>
                          <NumInput id={`${id}-rate`} step="0.1" inputMode="decimal" placeholder="e.g. 12.5" value={d.rate} onValue={(n) => setDebt(i, { rate: n })} />
                        </div>
                        <div className="md-field">
                          <label htmlFor={`${id}-emi`}>Monthly EMI (₹)</label>
                          <NumInput id={`${id}-emi`} inputMode="numeric" placeholder="e.g. 8500" value={d.emi} onValue={(n) => setDebt(i, { emi: n })} />
                        </div>
                        <div className="md-field">
                          <label htmlFor={`${id}-months`}>Months Left</label>
                          <NumInput id={`${id}-months`} inputMode="numeric" placeholder="e.g. 36" value={d.months} onValue={(n) => setDebt(i, { months: Math.round(n) })} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button type="button" className="md-add-btn" onClick={addDebt}>
              + Add Another Debt
            </button>
            {error && (
              <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button type="button" className="md-cta" onClick={analyse} disabled={!ready}>
              Analyse My Debt Portfolio ➜
            </button>
          </div>
        </div>
      </div>
    </ConsolidationShell>
  );
}

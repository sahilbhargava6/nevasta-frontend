'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import StatementAutofill from '@/components/design/StatementAutofill';
import { DEFAULT_LOAN_JOURNEY, useJourney, type LoanJourney } from '@/lib/journey';
import { LOAN_TYPE_OPTIONS, validateLoan, type LoanField, type LoanType } from '@/lib/loanMath';

// Design: #loan-page (Navesta_Website_22Sep26.html ~4930–5092, JS ~8640–8740)

const BORDER = 'rgba(196,168,130,0.45)';
const TEAL = '#0D9488';
const RED = '#DC2626';

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 1px 4px rgba(28,8,0,0.05),0 6px 20px rgba(28,8,0,0.09)',
  marginBottom: 14,
  overflow: 'hidden',
  borderLeft: '4px solid #0D9488',
};

const FIELDS: {
  key: LoanField;
  n: number;
  icon: string;
  title: string;
  help: string;
  placeholder: string;
  unit: 'rupee' | 'months' | 'rate';
}[] = [
  { key: 'originalAmount', n: 1, icon: '🏠', title: 'Original loan amount', help: 'Total sanctioned on day one — "Loan Amount" on your sanction letter or agreement', placeholder: 'e.g. 1000000', unit: 'rupee' },
  { key: 'originalTenure', n: 2, icon: '📅', title: 'Original tenure', help: 'Full length when the loan started — "Loan Tenure" on your agreement', placeholder: 'e.g. 60', unit: 'months' },
  { key: 'outstanding', n: 3, icon: '💰', title: 'Current outstanding', help: 'What you still owe today — "Principal Outstanding" on your latest statement', placeholder: 'e.g. 750000', unit: 'rupee' },
  { key: 'tenureLeft', n: 4, icon: '⏳', title: 'Tenure left', help: 'Remaining EMIs — "Remaining Tenure" or "EMIs Remaining" in your bank app', placeholder: 'e.g. 36', unit: 'months' },
  { key: 'rate', n: 5, icon: '📊', title: 'Interest rate', help: 'Yearly rate — "ROI" or "Rate of Interest" on your statement', placeholder: 'e.g. 14', unit: 'rate' },
];

type Values = Record<LoanField, string>;

const toValues = (l: LoanJourney): Values => ({
  originalAmount: String(l.originalAmount || ''),
  originalTenure: String(l.originalTenure || ''),
  outstanding: String(l.outstanding || ''),
  tenureLeft: String(l.tenureLeft || ''),
  rate: String(l.rate || ''),
});

export default function LoanDetailsPage() {
  return (
    <JourneyGate intent="debt-loan">
      <LoanDetails />
    </JourneyGate>
  );
}

function LoanDetails() {
  const router = useRouter();
  const [loan, setLoan, , ready] = useJourney<LoanJourney>('loan', DEFAULT_LOAN_JOURNEY);
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [values, setValues] = useState<Values>(toValues(DEFAULT_LOAN_JOURNEY));
  const [errors, setErrors] = useState<Partial<Record<LoanField, string>>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const inputs = useRef<Partial<Record<LoanField, HTMLInputElement | null>>>({});
  const loaded = useRef(false);

  // Pre-fill once from the journey (design defaults 100000 / 36 / 80000 / 24 / 14)
  useEffect(() => {
    if (ready && !loaded.current) {
      loaded.current = true;
      setLoanType(loan.loanType);
      setValues(toValues(loan));
    }
  }, [ready, loan]);

  const setField = (k: LoanField, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = () => {
    const errs = validateLoan(values);
    setErrors(errs);
    const first = FIELDS.find((f) => errs[f.key]);
    if (first) {
      inputs.current[first.key]?.focus();
      return;
    }
    setLoan({
      loanType,
      originalAmount: Number(values.originalAmount),
      originalTenure: Number(values.originalTenure),
      outstanding: Number(values.outstanding),
      tenureLeft: Number(values.tenureLeft),
      rate: Number(values.rate),
    });
    router.push('/journey/loan/analysis');
  };

  const borderFor = (k: string) => (errors[k as LoanField] ? RED : focus === k ? TEAL : BORDER);

  if (!ready) return null;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: '#F5EFE8', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/debt-management" />

      {/* Progress indicator */}
      <div style={{ padding: '8px 5% 0', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#0D9488' }} />
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#2563EB' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#0D9488', letterSpacing: 0.5 }}>STEP 1 OF 2 — LOAN DETAILS</span>
          <span style={{ fontSize: 10, color: 'rgba(42,22,6,0.4)' }}>Next: Your Results</span>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ padding: '20px 20px 40px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 12 }} aria-hidden>
            🏠
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#0D9488', textTransform: 'uppercase' }}>Your Loan</span>
        </div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,6vw,34px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', marginBottom: 22 }}>
          Tell us about your <span style={{ color: '#0D9488', fontStyle: 'italic' }}>loan.</span>
        </h1>

        {/* Loan type */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 4px rgba(28,8,0,0.05),0 6px 20px rgba(28,8,0,0.09)', marginBottom: 18 }}>
          <label htmlFor="loan-type-select" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(42,22,6,0.6)', marginBottom: 12 }}>
            What kind of loan is it?
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="loan-type-select"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as LoanType)}
              onFocus={() => setFocus('type')}
              onBlur={() => setFocus(null)}
              style={{ width: '100%', padding: '13px 40px 13px 14px', border: `1.5px solid ${borderFor('type')}`, borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', background: '#FAFBFF', color: '#2A1606', outline: 'none', WebkitAppearance: 'none', appearance: 'none', cursor: 'pointer' }}
            >
              {LOAN_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8A7058', fontSize: 13 }} aria-hidden>
              ▾
            </div>
          </div>
        </div>

        {/* Optional: fill the figures in from the latest loan statement (statement parser) */}
        <StatementAutofill
          title="Have your latest loan statement?"
          description="Upload it and we'll fill in the outstanding amount, interest rate and tenure left. It's saved encrypted in your vault, and you can edit every figure."
          onFields={(f) => {
            const found: Partial<Values> = {};
            if (f.outstanding?.value) found.outstanding = String(Math.round(Number(f.outstanding.value)));
            if (f.monthsLeft?.value) found.tenureLeft = String(Math.round(Number(f.monthsLeft.value)));
            if (f.ratePercent?.value) found.rate = String(f.ratePercent.value);
            setValues((v) => ({ ...v, ...found }));
            setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(found).map((k) => [k, undefined])) }));
            return Object.keys(found).length;
          }}
        />

        {FIELDS.map((f) => {
          const id = `loan-${f.key}`;
          const err = errors[f.key];
          const unitBox: React.CSSProperties = {
            padding: '13px 14px',
            background: '#EEF9F8',
            border: `1.5px solid ${borderFor(f.key)}`,
            borderLeft: 'none',
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            fontSize: f.unit === 'rate' ? 13 : 14,
            fontWeight: 600,
            color: '#0D9488',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          };
          const common = {
            id,
            ref: (el: HTMLInputElement | null) => {
              inputs.current[f.key] = el;
            },
            type: 'number',
            inputMode: (f.unit === 'rate' ? 'decimal' : 'numeric') as 'decimal' | 'numeric',
            placeholder: f.placeholder,
            value: values[f.key],
            min: 0,
            step: f.unit === 'rate' ? 0.1 : 1,
            'aria-invalid': !!err,
            'aria-describedby': `${id}-help${err ? ` ${id}-err` : ''}`,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(f.key, e.target.value),
            onFocus: () => setFocus(f.key),
            onBlur: () => setFocus(null),
          };
          return (
            <div key={f.key} style={card}>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 2 }} aria-hidden>
                    {f.n}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span aria-hidden>{f.icon}</span>
                      <label htmlFor={id} style={{ fontSize: 15, fontWeight: 700, color: '#2A1606' }}>
                        {f.title}
                      </label>
                    </div>
                    <div id={`${id}-help`} style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', lineHeight: 1.5, marginBottom: 13 }}>
                      {f.help}
                    </div>
                    {f.unit === 'rupee' ? (
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 700, color: '#0D9488' }} aria-hidden>
                          ₹
                        </span>
                        <input
                          {...common}
                          style={{ width: '100%', padding: '13px 14px 13px 32px', border: `1.5px solid ${borderFor(f.key)}`, borderRadius: 12, fontSize: 15, fontFamily: 'var(--sans)', background: '#FAFBFF', color: '#2A1606', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: f.unit === 'rate' ? 10 : 0 }}>
                        <input
                          {...common}
                          style={{ flex: 1, padding: '13px 14px', border: `1.5px solid ${borderFor(f.key)}`, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderRight: 'none', fontSize: 15, fontFamily: 'var(--sans)', background: '#FAFBFF', color: '#2A1606', outline: 'none', minWidth: 0 }}
                        />
                        <div style={unitBox}>{f.unit === 'rate' ? '% per year' : 'months'}</div>
                      </div>
                    )}
                    {err && (
                      <div id={`${id}-err`} role="alert" style={{ fontSize: 12, color: RED, fontWeight: 600, marginTop: 6 }}>
                        {err}
                      </div>
                    )}
                    {f.unit === 'rate' && (
                      <button
                        type="button"
                        onClick={() => {
                          setField('rate', '14');
                          inputs.current.rate?.focus();
                        }}
                        style={{ fontSize: 12, color: '#2563EB', cursor: 'pointer', lineHeight: 1.4, background: 'none', border: 'none', padding: 0, marginTop: err ? 6 : 0, fontFamily: 'var(--sans)', textAlign: 'left' }}
                      >
                        Not sure? Use the typical 14% for a Personal loan →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="submit"
          style={{ width: '100%', background: 'linear-gradient(135deg,#2563EB 0%,#1E40AF 100%)', border: 'none', borderRadius: 16, padding: '17px 24px', fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: 0.2, boxShadow: '0 6px 20px rgba(37,99,235,0.35)', marginTop: 4 }}
        >
          Show me how to pay less →
        </button>
      </form>
    </div>
  );
}

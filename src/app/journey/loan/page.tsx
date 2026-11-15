'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Landmark } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import StatementAutofill from '@/components/design/StatementAutofill';
import { DEFAULT_LOAN_JOURNEY, useJourney, type LoanJourney } from '@/lib/journey';
import { LOAN_TYPE_OPTIONS, validateLoan, type LoanField, type LoanType } from '@/lib/loanMath';

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


  if (!ready) return null;

  const inputBase =
    'w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2';
  const inputCls = (err?: string) =>
    `${inputBase} ${err ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-600/20 focus:border-blue-600'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/debt-management" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5" aria-hidden>
            <div className="flex-1 h-1 rounded bg-blue-600" />
            <div className="flex-1 h-1 rounded bg-slate-200" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="badge-blue">STEP 1 OF 2 — LOAN DETAILS</span>
            <span className="text-xs text-slate-500">Next: Your Results</span>
          </div>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <Landmark className="w-4 h-4" aria-hidden />
              Your Loan
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Tell us about your <span className="text-blue-600">loan.</span>
            </h1>
          </div>

          {/* Loan type */}
          <div className="card-fintech p-5 sm:p-6">
            <label htmlFor="loan-type-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              What kind of loan is it?
            </label>
            <div className="relative">
              <select
                id="loan-type-select"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
                className={`${inputCls()} appearance-none pr-10 cursor-pointer font-medium`}
              >
                {LOAN_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
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
            };
            return (
              <div key={f.key} className="card-fintech p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center shrink-0" aria-hidden>
                    {f.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label htmlFor={id} className="block text-sm font-semibold text-slate-900">
                      {f.title}
                    </label>
                    <div id={`${id}-help`} className="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">
                      {f.help}
                    </div>
                    {f.unit === 'rupee' ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium" aria-hidden>
                          ₹
                        </span>
                        <input {...common} className={`${inputCls(err)} pl-7`} />
                      </div>
                    ) : (
                      <div className="flex items-stretch">
                        <input {...common} className={`${inputCls(err)} min-w-0 flex-1 rounded-r-none`} />
                        <div
                          className={`px-3 flex items-center rounded-r-lg border border-l-0 bg-slate-100 text-xs font-medium text-slate-600 whitespace-nowrap ${err ? 'border-rose-400' : 'border-slate-300'}`}
                        >
                          {f.unit === 'rate' ? '% per year' : 'months'}
                        </div>
                      </div>
                    )}
                    {err && (
                      <div id={`${id}-err`} role="alert" className="text-xs font-medium text-rose-600 mt-1">
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
                        className="mt-2 text-left text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Not sure? Use the typical 14% for a Personal loan →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button type="submit" className="btn-accent w-full sm:w-auto">
            Show me how to pay less
            <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
          </button>
        </form>
      </main>
    </div>
  );
}

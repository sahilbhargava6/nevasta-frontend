'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useJourney, type CardEntry } from '@/lib/journey';
import { fieldText, readStatement, uncertainKeys, uploadStatement, type CardFields } from '@/lib/statementParse';
import { EMPTY_CC_JOURNEY, parseAmount } from '@/lib/ccMath';
import { AlertTriangle, ArrowRight, BarChart3, Calendar, CreditCard, FileText, Loader2, Lock, Pencil, Plus, Upload, X } from 'lucide-react';

const INPUT = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';
const ERR_INPUT = 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500';
const LABEL = 'block text-xs font-semibold text-slate-700 mb-1.5';

// Design: #cc-page (Navesta_Website_22Sep26.html ~4865–4929),
// renderCCCards / setCCMethod / addCCCard (~6892–6981), upload review cards (~7250–7360),
// submitCCDetails validation (~7430).

const MAX_BYTES = 10 * 1024 * 1024;

// uploading → reading (virus scan + statement parser) → saved; `password` when the PDF is locked
type UploadStatus = 'idle' | 'uploading' | 'reading' | 'password' | 'saved' | 'error';

type FigureKey = 'outstanding' | 'minDue' | 'limit' | 'rate' | 'payDue';

type Draft = {
  bank: string;
  outstanding: string;
  rate: string;
  minDue: string;
  limit: string;
  payDue: string;
  fileName: string;
  status: UploadStatus;
  error: string;
  statementId: string;
  /** done = figures read from the statement; failed = customer types them */
  read: 'none' | 'done' | 'failed';
  readNote: string;
  /** figures the parser was unsure about: shown for the customer to check */
  unsure: FigureKey[];
  password: string;
  passwordMsg: string;
};

const emptyDraft = (): Draft => ({
  bank: '', outstanding: '', rate: '', minDue: '', limit: '', payDue: '', fileName: '', status: 'idle', error: '',
  statementId: '', read: 'none', readNote: '', unsure: [], password: '', passwordMsg: '',
});

// Parser field → this form's field
const PARSED_TO_FIGURE: Record<string, FigureKey> = { outstanding: 'outstanding', minDue: 'minDue', creditLimit: 'limit', aprPercent: 'rate', dueDate: 'payDue' };

const fromCard = (c: CardEntry): Draft => ({
  bank: c.bank,
  outstanding: c.outstanding ? String(c.outstanding) : '',
  rate: c.rate ? String(c.rate) : '',
  minDue: c.minDue ? String(c.minDue) : '',
  limit: c.limit ? String(c.limit) : '',
  payDue: /^\d{4}-\d{2}-\d{2}$/.test(c.payDue) ? c.payDue : '',
  fileName: '',
  status: 'idle',
  error: '',
  statementId: '',
  read: 'none',
  readNote: '',
  unsure: [],
  password: '',
  passwordMsg: '',
});

const hasFigures = (d: Draft) => !!(d.outstanding || d.rate || d.minDue || d.limit);
const isBlank = (d: Draft) => !d.bank.trim() && !hasFigures(d) && !d.payDue && d.status === 'idle';

export default function CreditCardPage() {
  return (
    <JourneyGate intent="debt-cc">
      <AddYourCard />
    </JourneyGate>
  );
}

function AddYourCard() {
  const router = useRouter();
  const [journey, update, , ready] = useJourney('cc', EMPTY_CC_JOURNEY);
  const [method, setMethod] = useState<'upload' | 'manual'>('upload');
  const [cards, setCards] = useState<Draft[]>([emptyDraft()]);
  const [income, setIncome] = useState('');
  const [incomeErr, setIncomeErr] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [formError, setFormError] = useState('');
  const loaded = useRef(false);
  const incomeRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Restore what the customer entered earlier in this tab (never demo figures)
  useEffect(() => {
    if (!ready || loaded.current) return;
    loaded.current = true;
    setMethod(journey.method === 'manual' ? 'manual' : 'upload');
    if (journey.cards.length) setCards(journey.cards.map(fromCard));
    if (journey.income > 0) setIncome(String(journey.income));
  }, [ready, journey]);

  const setCard = (i: number, patch: Partial<Draft>) => setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const setCCMethod = (m: 'upload' | 'manual') => {
    setMethod(m);
    update({ method: m });
  };

  const addCCCard = () => setCards((prev) => [...prev, emptyDraft()]);
  const removeCard = (i: number) => setCards((prev) => prev.filter((_, idx) => idx !== i));

  const fileSelected = async (i: number, file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.csv')) {
      setCard(i, { fileName: file.name, status: 'error', error: 'Only PDF or CSV statements can be uploaded. Enter the figures below instead.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      setCard(i, { fileName: file.name, status: 'error', error: 'This file is larger than 10 MB. Enter the figures below instead.' });
      return;
    }
    setCard(i, { fileName: file.name, status: 'uploading', error: '', statementId: '', read: 'none', readNote: '', unsure: [], password: '', passwordMsg: '' });
    let statementId: string;
    try {
      statementId = await uploadStatement(file);
    } catch (err) {
      setCard(i, { status: 'error', error: (err as Error)?.message || 'Upload failed.' });
      return;
    } finally {
      const el = fileRefs.current[i];
      if (el) el.value = '';
    }
    setCard(i, { statementId, status: 'reading' });
    await readFigures(statementId);
  };

  // Cards can be added/removed while a statement is being read, so results are matched by statement id
  const patchByStatement = (statementId: string, patch: (c: Draft) => Partial<Draft>) =>
    setCards((prev) => prev.map((c) => (c.statementId === statementId ? { ...c, ...patch(c) } : c)));

  const readFigures = async (statementId: string, password?: string) => {
    const out = await readStatement<CardFields>(statementId, 'card', password);
    if (out.kind === 'password') {
      patchByStatement(statementId, () => ({ status: 'password', password: '', passwordMsg: out.wrong ? out.message : '' }));
      return;
    }
    if (out.kind === 'failed') {
      patchByStatement(statementId, () => ({ status: 'saved', read: 'failed', readNote: out.message, password: '' }));
      return;
    }
    const f = out.fields;
    const unsure = uncertainKeys(f, out.ocr).map((k) => PARSED_TO_FIGURE[k]).filter(Boolean);
    const due = fieldText(f.dueDate);
    patchByStatement(statementId, (c) => ({
      status: 'saved',
      read: 'done',
      readNote: '',
      password: '',
      passwordMsg: '',
      outstanding: fieldText(f.outstanding) || c.outstanding,
      minDue: fieldText(f.minDue) || c.minDue,
      limit: fieldText(f.creditLimit) || c.limit,
      rate: fieldText(f.aprPercent) || c.rate,
      payDue: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : c.payDue,
      unsure,
    }));
  };

  const unlock = (i: number) => {
    const c = cards[i];
    if (!c.password.trim()) {
      setCard(i, { passwordMsg: 'Enter the PDF password.' });
      return;
    }
    setCard(i, { status: 'reading', passwordMsg: '' });
    void readFigures(c.statementId, c.password);
  };

  const submitCCDetails = () => {
    setAttempted(true);
    setFormError('');
    const inc = parseAmount(income);
    if (!inc) {
      setIncomeErr(true);
      incomeRef.current?.focus();
      return;
    }
    setIncomeErr(false);

    if (cards.some((c) => c.status === 'uploading' || c.status === 'reading')) {
      setFormError('Please wait while we save and read your statement.');
      return;
    }
    if (cards.some((c) => c.status === 'password')) {
      setFormError('Enter your statement’s PDF password, or choose to type the figures yourself.');
      return;
    }

    const filled = cards.map((c, i) => ({ c, i })).filter(({ c }) => !isBlank(c));
    if (filled.length === 0) {
      setFormError(method === 'upload' ? 'Upload your Card 1 statement, or switch to "Enter manually".' : 'Please enter your Card 1 details.');
      return;
    }

    const out: CardEntry[] = [];
    for (const { c, i } of filled) {
      const n = i + 1;
      if (method === 'upload' && c.status === 'idle' && !hasFigures(c)) {
        setFormError(`Upload your Card ${n} statement, or switch to "Enter manually".`);
        return;
      }
      const missing: string[] = [];
      const outstanding = parseAmount(c.outstanding);
      const rate = parseAmount(c.rate);
      const minDue = parseAmount(c.minDue);
      if (!outstanding) missing.push('outstanding');
      if (!rate) missing.push('interest rate');
      if (!minDue) missing.push('minimum due');
      if (missing.length) {
        setFormError(`Card ${n}: please enter the ${missing.join(', ')}.`);
        return;
      }
      if (rate > 60) {
        setFormError(`Card ${n}: the interest rate should be the yearly rate (e.g. 42), not more than 60%.`);
        return;
      }
      out.push({ bank: c.bank.trim(), outstanding, rate, minDue, limit: parseAmount(c.limit), payDue: c.payDue });
    }

    update({ method, cards: out, income: inc });
    router.push('/journey/credit-card/analysis');
  };

  if (!ready) return <div className="min-h-screen bg-slate-50" />;

  const methodCls = (active: boolean) =>
    `relative w-full rounded-xl border-2 p-4 text-center transition-all cursor-pointer ${active ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white hover:border-slate-300'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/debt-management" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            <CreditCard className="w-4 h-4" aria-hidden /> Your Card Details
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Add your <span className="text-blue-600">card.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">Add all your cards — Navesta plans across them together.</p>
        </div>

        {/* Method toggle */}
        <div role="radiogroup" aria-label="How would you like to add your cards?" className="grid grid-cols-2 gap-3 pt-2">
          <button type="button" role="radio" aria-checked={method === 'upload'} onClick={() => setCCMethod('upload')} className={methodCls(method === 'upload')}>
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 badge-blue whitespace-nowrap">★ Recommended</span>
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" aria-hidden />
            <div className="text-sm font-semibold text-slate-900">Upload statements</div>
            <div className="text-[11px] text-slate-500 mt-0.5">CSV / PDF · saved securely</div>
          </button>
          <button type="button" role="radio" aria-checked={method === 'manual'} onClick={() => setCCMethod('manual')} className={methodCls(method === 'manual')}>
            <Pencil className="w-6 h-6 mx-auto mb-2 text-blue-600" aria-hidden />
            <div className="text-sm font-semibold text-slate-900">Enter manually</div>
            <div className="text-[11px] text-slate-500 mt-0.5">card by card</div>
          </button>
        </div>

        {/* Card entries */}
        {cards.map((c, i) => {
          const n = i + 1;
          const showFields = method === 'manual' || c.status === 'saved' || c.status === 'error' || hasFigures(c);
          return (
            <div key={i} className="card-fintech p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3.5">
                <div className="text-sm font-semibold text-slate-900">Card {n} statement</div>
                {i > 0 && (
                  <button type="button" onClick={() => removeCard(i)} aria-label={`Remove card ${n}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" aria-hidden /> Remove
                  </button>
                )}
              </div>

              <div className="mb-3.5">
                <label htmlFor={`cc-${i}-bank`} className={LABEL}>
                  Card / bank name
                </label>
                <input
                  id={`cc-${i}-bank`}
                  type="text"
                  value={c.bank}
                  onChange={(e) => setCard(i, { bank: e.target.value })}
                  placeholder="e.g. HDFC Regalia, SBI SimplyCLICK"
                  autoComplete="off"
                  className={INPUT}
                />
              </div>

              {method === 'upload' && (
                <input
                  ref={(el) => {
                    fileRefs.current[i] = el;
                  }}
                  type="file"
                  accept=".pdf,.csv,application/pdf,text/csv"
                  className="hidden"
                  aria-label={`Card ${n} statement file`}
                  onChange={(e) => fileSelected(i, e.target.files?.[0])}
                />
              )}

              {method === 'upload' && c.status === 'idle' && !hasFigures(c) && (
                <button type="button" onClick={() => fileRefs.current[i]?.click()} className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-blue-600 p-6 text-center transition-all">
                  <Upload className="w-7 h-7 mx-auto mb-2 text-slate-400" aria-hidden />
                  <div className="text-sm font-semibold text-slate-900">Upload PDF statement</div>
                  <div className="text-xs text-slate-500 mt-1">PDF or CSV · max 10 MB · stored encrypted in your vault</div>
                </button>
              )}

              {method === 'upload' && (c.status === 'uploading' || c.status === 'reading') && (
                <div role="status" className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-blue-800">{c.status === 'uploading' ? 'Saving your statement securely…' : 'Reading your statement…'}</div>
                    <div className="text-xs text-blue-700 break-words">
                      {c.status === 'uploading' ? c.fileName : 'Checking it for viruses, then picking out the figures. Scanned statements can take a minute.'}
                    </div>
                  </div>
                </div>
              )}

              {method === 'upload' && c.status === 'password' && (
                <PasswordCard
                  i={i}
                  c={c}
                  setCard={setCard}
                  onUnlock={() => unlock(i)}
                  onSkip={() => setCard(i, { status: 'saved', read: 'failed', readNote: '', password: '', passwordMsg: '' })}
                />
              )}

              {method === 'upload' && c.status === 'saved' && (
                <ReviewCard i={i} c={c} setCard={setCard} attempted={attempted} onReplace={() => fileRefs.current[i]?.click()} />
              )}

              {method === 'upload' && c.status === 'error' && (
                <ErrorCard i={i} c={c} setCard={setCard} attempted={attempted} onRetry={() => fileRefs.current[i]?.click()} />
              )}

              {showFields && (method === 'manual' || c.status === 'idle') && <ManualFields i={i} c={c} setCard={setCard} attempted={attempted} />}
            </div>
          );
        })}

        {/* Add another card */}
        <button type="button" onClick={addCCCard} className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-blue-50 p-3.5 text-sm font-semibold text-blue-600 transition-all inline-flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" aria-hidden /> Add Card {cards.length + 1} statement
        </button>

        {/* Monthly income */}
        <div className="card-fintech p-5 sm:p-6">
          <label htmlFor="cc-income" className={LABEL}>
            Your monthly income (₹)
          </label>
          <div className="relative">
            <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
              ₹
            </span>
            <input
              id="cc-income"
              ref={incomeRef}
              type="number"
              inputMode="numeric"
              min={0}
              required
              aria-invalid={incomeErr}
              aria-describedby="cc-income-help"
              value={income}
              onChange={(e) => {
                setIncome(e.target.value);
                if (incomeErr && parseAmount(e.target.value)) setIncomeErr(false);
              }}
              placeholder="e.g. 85000"
              className={`${INPUT} pl-7 ${incomeErr ? ERR_INPUT : ''}`}
            />
          </div>
          <div id="cc-income-help" className={`text-xs mt-1 ${incomeErr ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
            {incomeErr ? 'Please enter your monthly income.' : 'Used to calculate how much you can put toward clearing debt each month.'}
          </div>
        </div>

        {formError && (
          <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <button type="button" onClick={submitCCDetails} className="btn-accent w-full">
            Build My Escape Plan <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" aria-hidden /> 256-bit encrypted · Never shared · RBI compliant
          </div>
        </div>
      </main>
    </div>
  );
}

type FieldProps = { i: number; c: Draft; setCard: (i: number, patch: Partial<Draft>) => void; attempted: boolean };

/** Manual entry grid (design: renderCCCards, manual branch). */
function ManualFields({ i, c, setCard, attempted }: FieldProps) {
  const field = (key: 'outstanding' | 'rate' | 'minDue' | 'limit', label: string, placeholder: string, required: boolean) => {
    const missing = required && attempted && !parseAmount(c[key]);
    return (
      <div>
        <label htmlFor={`cc-${i}-${key}`} className={LABEL}>
          {label}
        </label>
        <input
          id={`cc-${i}-${key}`}
          type="text"
          inputMode="decimal"
          value={c[key]}
          onChange={(e) => setCard(i, { [key]: e.target.value })}
          placeholder={placeholder}
          aria-invalid={missing}
          className={`${INPUT} ${missing ? ERR_INPUT : ''}`}
        />
      </div>
    );
  };
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('outstanding', 'Outstanding (₹)', 'e.g. 45000', true)}
        {field('rate', 'Interest rate (%)', 'e.g. 36', true)}
        {field('minDue', 'Min. due (₹)', 'e.g. 2000', true)}
        {field('limit', 'Credit limit (₹)', 'e.g. 1,00,000', false)}
      </div>
      <div className="mt-3">
        <label htmlFor={`cc-${i}-payDue`} className={LABEL}>
          Payment due date
        </label>
        <input id={`cc-${i}-payDue`} type="date" value={c.payDue} onChange={(e) => setCard(i, { payDue: e.target.value })} className={INPUT} />
      </div>
    </>
  );
}

/** Figure fields inside the upload review / error cards (design: renderExtractedCard / renderErrorCard). */
function StatementFields({ i, c, setCard, attempted, redWhenEmpty }: FieldProps & { redWhenEmpty: boolean }) {
  const field = (key: 'outstanding' | 'minDue' | 'limit' | 'rate', label: string, placeholder: string, required: boolean) => {
    const empty = !parseAmount(c[key]);
    const red = required && empty && (redWhenEmpty || attempted);
    // read from the statement but with low confidence: amber until the customer edits it
    const check = !empty && c.unsure.includes(key);
    return (
      <div>
        <label htmlFor={`cc-${i}-${key}`} className={`block text-xs font-semibold mb-1.5 ${check ? 'text-amber-700' : 'text-slate-700'}`}>
          {label}
          {check && ' · please check'}
        </label>
        <input
          id={`cc-${i}-${key}`}
          type="text"
          inputMode="decimal"
          value={c[key]}
          onChange={(e) => setCard(i, { [key]: e.target.value, unsure: c.unsure.filter((u) => u !== key) })}
          placeholder={placeholder}
          aria-invalid={required && empty && attempted}
          className={`${INPUT} tabular-nums ${red ? ERR_INPUT : check ? 'border-amber-400 bg-amber-50 focus:ring-amber-500/20 focus:border-amber-500' : ''}`}
        />
      </div>
    );
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
      {field('outstanding', 'Outstanding (₹)', 'e.g. 45,000', true)}
      {field('minDue', 'Min due (₹)', 'e.g. 2,500', true)}
      {field('limit', 'Credit limit (₹)', 'e.g. 2,00,000', false)}
      {field('rate', 'Rate (% p.a.)', 'e.g. 42', true)}
    </div>
  );
}

function DueDateLine({ i, c, setCard }: Omit<FieldProps, 'attempted'>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label htmlFor={`cc-${i}-payDue`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Calendar className="w-4 h-4 text-slate-400" aria-hidden /> Payment due:
      </label>
      <input id={`cc-${i}-payDue`} type="date" value={c.payDue} onChange={(e) => setCard(i, { payDue: e.target.value })} className={`${INPUT} !w-auto min-w-[140px]`} />
    </div>
  );
}

function PasswordCard({ i, c, setCard, onUnlock, onSkip }: Omit<FieldProps, 'attempted'> & { onUnlock: () => void; onSkip: () => void }) {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 mb-1">
        <Lock className="w-4 h-4" aria-hidden /> This PDF is password protected
      </div>
      <div className="text-xs text-amber-800 leading-relaxed mb-3">
        Card statements are usually locked with a password your bank told you in its email (often part of your name and date of birth). We use it once to read the
        file and never save it.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUnlock();
        }}
        className="flex gap-2 flex-wrap"
      >
        <input
          type="password"
          autoComplete="off"
          aria-label={`Card ${i + 1} statement password`}
          placeholder="Statement password"
          value={c.password}
          onChange={(e) => setCard(i, { password: e.target.value, passwordMsg: '' })}
          className={`${INPUT} flex-[1_1_180px] min-w-0 !w-auto`}
        />
        <button type="submit" className="btn-accent">
          Unlock &amp; read <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
        </button>
      </form>
      {c.passwordMsg && (
        <div role="alert" className="text-xs font-medium text-rose-600 mt-2">
          {c.passwordMsg}
        </div>
      )}
      <button type="button" onClick={onSkip} className="mt-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 underline">
        Skip — I’ll type the figures myself
      </button>
    </div>
  );
}

function ReviewCard({ i, c, setCard, attempted, onReplace }: FieldProps & { onReplace: () => void }) {
  const missing = [!parseAmount(c.outstanding) && 'Outstanding', !parseAmount(c.minDue) && 'Min due', !parseAmount(c.rate) && 'Rate'].filter(Boolean) as string[];
  // Design copy: a full read asks for a quick check; a partial read flags what still needs typing
  const banner =
    c.read !== 'done'
      ? { text: 'STATEMENT SAVED SECURELY — ENTER THE FIGURES FROM IT', warn: true }
      : missing.length || c.unsure.length
        ? { text: 'PARTIAL READ — RED FIELDS NEED MANUAL ENTRY', warn: true }
        : { text: '✓ READ FROM YOUR STATEMENT — PLEASE CHECK THE FIGURES', warn: false };
  return (
    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-emerald-200">
        <FileText className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-emerald-800 break-words">{c.fileName}</div>
          <div className="text-[11px] text-emerald-700">Encrypted &amp; saved to your statement vault</div>
        </div>
        <button type="button" onClick={onReplace} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 shrink-0">
          Replace
        </button>
      </div>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-wide ${c.readNote ? 'mb-1' : 'mb-3'} ${banner.warn ? 'text-amber-700' : 'text-emerald-700'}`}>
        {banner.warn && <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />}
        {banner.text}
      </div>
      {c.readNote && <div className="text-xs text-slate-600 mb-3">{c.readNote}</div>}
      <StatementFields i={i} c={c} setCard={setCard} attempted={attempted} redWhenEmpty />
      <div className="text-xs text-slate-500 mb-2">
        {missing.length ? (
          <>
            Still needed: <strong>{missing.join(', ')}</strong>. All figures are on page 1 of your statement.
          </>
        ) : (
          'Not matching? Edit any figure — your changes are used as-is.'
        )}
      </div>
      <DueDateLine i={i} c={c} setCard={setCard} />
    </div>
  );
}

function ErrorCard({ i, c, setCard, attempted, onRetry }: FieldProps & { onRetry: () => void }) {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
      <div className="flex items-center gap-2 mb-3" role="alert">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-amber-800">Could not save statement</div>
          <div className="text-[11px] text-amber-700 break-words">{c.error}</div>
        </div>
        <button type="button" onClick={onRetry} className="text-xs font-semibold text-amber-800 hover:text-amber-900 shrink-0">
          Try again
        </button>
      </div>
      <div className="text-[11px] font-semibold text-amber-800 tracking-wide mb-3">PLEASE ENTER FIGURES FROM YOUR STATEMENT</div>
      <StatementFields i={i} c={c} setCard={setCard} attempted={attempted} redWhenEmpty={false} />
      <div className="text-xs text-slate-500 mb-2">All figures are on page 1 of your statement.</div>
      <DueDateLine i={i} c={c} setCard={setCard} />
    </div>
  );
}

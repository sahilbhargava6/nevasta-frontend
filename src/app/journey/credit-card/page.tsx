'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useJourney, type CardEntry } from '@/lib/journey';
import { fieldText, readStatement, uncertainKeys, uploadStatement, type CardFields } from '@/lib/statementParse';
import { EMPTY_CC_JOURNEY, parseAmount } from '@/lib/ccMath';

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

  if (!ready) return <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)' }} />;

  const methodBox = (active: boolean): React.CSSProperties => ({
    background: '#fff',
    border: active ? '2px solid #0D9488' : '2px solid rgba(196,168,130,0.4)',
    borderRadius: 14,
    padding: 16,
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all .2s',
    fontFamily: 'inherit',
    width: '100%',
  });

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden', width: '100%' }}>
      <JourneyHeader backHref="/debt-management" />

      <div style={{ padding: '32px 24px 120px', maxWidth: 560, margin: '0 auto' }}>
        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 10 }} aria-hidden>
            💳
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#0D9488', textTransform: 'uppercase' }}>Your Card Details</span>
        </div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,6vw,36px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', marginBottom: 10 }}>
          Add your <span style={{ color: '#0D9488', fontStyle: 'italic' }}>card.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(42,22,6,0.58)', lineHeight: 1.6, marginBottom: 28 }}>Add all your cards — Navesta plans across them together.</p>

        {/* Method toggle */}
        <div role="radiogroup" aria-label="How would you like to add your cards?" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          <button type="button" role="radio" aria-checked={method === 'upload'} onClick={() => setCCMethod('upload')} style={methodBox(method === 'upload')}>
            <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#0D9488', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 10, whiteSpace: 'nowrap', letterSpacing: '.5px' }}>★ Recommended</div>
            <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden>
              📊
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2A1606', marginBottom: 3 }}>Upload statements</div>
            <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.5)' }}>CSV / PDF · saved securely</div>
          </button>
          <button type="button" role="radio" aria-checked={method === 'manual'} onClick={() => setCCMethod('manual')} style={methodBox(method === 'manual')}>
            <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden>
              ✏️
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2A1606', marginBottom: 3 }}>Enter manually</div>
            <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.5)' }}>card by card</div>
          </button>
        </div>

        {/* Card entries */}
        {cards.map((c, i) => {
          const n = i + 1;
          const showFields = method === 'manual' || c.status === 'saved' || c.status === 'error' || hasFigures(c);
          return (
            <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(196,168,130,0.3)', borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2A1606' }}>Card {n} statement</div>
                {i > 0 && (
                  <button type="button" onClick={() => removeCard(i)} aria-label={`Remove card ${n}`} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: 'rgba(42,22,6,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✕ Remove
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor={`cc-${i}-bank`} style={{ fontSize: 12, fontWeight: 600, color: '#8A7058', display: 'block', marginBottom: 6 }}>
                  Card / bank name
                </label>
                <input
                  id={`cc-${i}-bank`}
                  type="text"
                  value={c.bank}
                  onChange={(e) => setCard(i, { bank: e.target.value })}
                  placeholder="e.g. HDFC Regalia, SBI SimplyCLICK"
                  autoComplete="off"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(196,168,130,0.4)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', background: '#FFFBF5', color: '#2A1606', outline: 'none' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C96010')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(196,168,130,0.4)')}
                />
              </div>

              {method === 'upload' && (
                <input
                  ref={(el) => {
                    fileRefs.current[i] = el;
                  }}
                  type="file"
                  accept=".pdf,.csv,application/pdf,text/csv"
                  style={{ display: 'none' }}
                  aria-label={`Card ${n} statement file`}
                  onChange={(e) => fileSelected(i, e.target.files?.[0])}
                />
              )}

              {method === 'upload' && c.status === 'idle' && !hasFigures(c) && (
                <button
                  type="button"
                  onClick={() => fileRefs.current[i]?.click()}
                  style={{ width: '100%', fontFamily: 'inherit', border: '2px dashed rgba(201,96,16,0.35)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#FFFBF5', transition: 'all .2s' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(201,96,16,0.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#FFFBF5')}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden>
                    📎
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2A1606', marginBottom: 4 }}>Upload PDF statement</div>
                  <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)' }}>PDF or CSV · max 10 MB · stored encrypted in your vault</div>
                </button>
              )}

              {method === 'upload' && (c.status === 'uploading' || c.status === 'reading') && (
                <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: '#F0F9FF', border: '1.5px solid rgba(14,165,233,0.3)', borderRadius: 12 }}>
                  <div aria-hidden style={{ width: 20, height: 20, border: '2.5px solid #0EA5E9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'lfbtSpin .7s linear infinite', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>{c.status === 'uploading' ? 'Saving your statement securely…' : 'Reading your statement…'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(3,105,161,0.65)', overflowWrap: 'anywhere' }}>
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
        <button
          type="button"
          onClick={addCCCard}
          style={{ width: '100%', background: 'transparent', border: '1.5px dashed rgba(201,96,16,0.4)', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, color: '#C96010', cursor: 'pointer', fontFamily: 'var(--sans)', marginBottom: 24, transition: 'all .2s' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(201,96,16,0.05)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          + Add Card {cards.length + 1} statement
        </button>

        {/* Monthly income */}
        <div style={{ marginBottom: 28 }}>
          <label htmlFor="cc-income" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2A1606', marginBottom: 8 }}>
            Your monthly income (₹)
          </label>
          <div style={{ position: 'relative' }}>
            <span aria-hidden style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 600, color: '#8A7058' }}>
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
              style={{ width: '100%', padding: '13px 14px 13px 32px', border: `1.5px solid ${incomeErr ? '#DC2626' : 'rgba(196,168,130,0.5)'}`, borderRadius: 12, fontSize: 15, fontFamily: 'var(--sans)', background: '#fff', color: '#2A1606', outline: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = incomeErr ? '#DC2626' : '#C96010')}
              onBlur={(e) => (e.currentTarget.style.borderColor = incomeErr ? '#DC2626' : 'rgba(196,168,130,0.5)')}
            />
          </div>
          <div id="cc-income-help" style={{ fontSize: 11, color: incomeErr ? '#DC2626' : 'rgba(42,22,6,0.45)', marginTop: 6 }}>
            {incomeErr ? 'Please enter your monthly income.' : 'Used to calculate how much you can put toward clearing debt each month.'}
          </div>
        </div>

        {formError && (
          <div role="alert" style={{ fontSize: 13, color: '#DC2626', fontWeight: 500, marginBottom: 12, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8 }}>
            ⚠ {formError}
          </div>
        )}

        <button
          type="button"
          onClick={submitCCDetails}
          style={{ width: '100%', background: 'linear-gradient(135deg,#F09020,#C96010)', border: 'none', borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 6px 20px rgba(201,96,16,0.3)', transition: 'all .2s' }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = '')}
        >
          Build My Escape Plan →
        </button>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(42,22,6,0.4)' }}>🔒 256-bit encrypted · Never shared · RBI compliant</div>
      </div>
    </div>
  );
}

type FieldProps = { i: number; c: Draft; setCard: (i: number, patch: Partial<Draft>) => void; attempted: boolean };

/** Manual entry grid (design: renderCCCards, manual branch). */
function ManualFields({ i, c, setCard, attempted }: FieldProps) {
  const inp = (missing: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 12px',
    border: `1.5px solid ${missing ? 'rgba(220,38,38,0.6)' : 'rgba(196,168,130,0.4)'}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'var(--sans)',
    background: '#FFFBF5',
    color: '#2A1606',
    outline: 'none',
  });
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#8A7058', display: 'block', marginBottom: 5 };
  const field = (key: 'outstanding' | 'rate' | 'minDue' | 'limit', label: string, placeholder: string, required: boolean) => {
    const missing = required && attempted && !parseAmount(c[key]);
    return (
      <div>
        <label htmlFor={`cc-${i}-${key}`} style={lbl}>
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
          style={inp(missing)}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#C96010')}
          onBlur={(e) => (e.currentTarget.style.borderColor = missing ? 'rgba(220,38,38,0.6)' : 'rgba(196,168,130,0.4)')}
        />
      </div>
    );
  };
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {field('outstanding', 'Outstanding (₹)', 'e.g. 45000', true)}
        {field('rate', 'Interest rate (%)', 'e.g. 36', true)}
        {field('minDue', 'Min. due (₹)', 'e.g. 2000', true)}
        {field('limit', 'Credit limit (₹)', 'e.g. 1,00,000', false)}
      </div>
      <div style={{ marginTop: 10 }}>
        <label htmlFor={`cc-${i}-payDue`} style={lbl}>
          Payment due date
        </label>
        <input id={`cc-${i}-payDue`} type="date" value={c.payDue} onChange={(e) => setCard(i, { payDue: e.target.value })} style={inp(false)} />
      </div>
    </>
  );
}

/** Figure fields inside the upload review / error cards (design: renderExtractedCard / renderErrorCard). */
function StatementFields({ i, c, setCard, attempted, redWhenEmpty }: FieldProps & { redWhenEmpty: boolean }) {
  const base: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(196,168,130,0.4)', borderRadius: 10, fontSize: 13, fontFamily: 'var(--sans)', background: '#fff', color: '#2A1606', outline: 'none', fontVariantNumeric: 'tabular-nums' };
  const field = (key: 'outstanding' | 'minDue' | 'limit' | 'rate', label: string, placeholder: string, required: boolean) => {
    const empty = !parseAmount(c[key]);
    const red = required && empty && (redWhenEmpty || attempted);
    // read from the statement but with low confidence: amber until the customer edits it
    const check = !empty && c.unsure.includes(key);
    return (
      <div>
        <label htmlFor={`cc-${i}-${key}`} style={{ fontSize: 11, fontWeight: 600, color: check ? '#B45309' : '#8A7058', display: 'block', marginBottom: 4 }}>
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
          style={{ ...base, borderColor: red ? 'rgba(220,38,38,0.35)' : check ? 'rgba(217,119,6,0.6)' : 'rgba(196,168,130,0.4)', background: check ? '#FFFBEB' : '#fff' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#C96010')}
          onBlur={(e) => (e.currentTarget.style.borderColor = red ? 'rgba(220,38,38,0.35)' : check ? 'rgba(217,119,6,0.6)' : 'rgba(196,168,130,0.4)')}
        />
      </div>
    );
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
      {field('outstanding', 'Outstanding (₹)', 'e.g. 45,000', true)}
      {field('minDue', 'Min due (₹)', 'e.g. 2,500', true)}
      {field('limit', 'Credit limit (₹)', 'e.g. 2,00,000', false)}
      {field('rate', 'Rate (% p.a.)', 'e.g. 42', true)}
    </div>
  );
}

function DueDateLine({ i, c, setCard }: Omit<FieldProps, 'attempted'>) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: '#2A1606', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <label htmlFor={`cc-${i}-payDue`}>📅 Payment due:</label>
      <input
        id={`cc-${i}-payDue`}
        type="date"
        value={c.payDue}
        onChange={(e) => setCard(i, { payDue: e.target.value })}
        style={{ border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: '#2A1606', fontFamily: 'var(--sans)', minWidth: 140, background: 'transparent', borderBottom: '1px dashed rgba(42,22,6,0.3)' }}
      />
    </div>
  );
}

function PasswordCard({ i, c, setCard, onUnlock, onSkip }: Omit<FieldProps, 'attempted'> & { onUnlock: () => void; onSkip: () => void }) {
  return (
    <div style={{ background: '#FFFBF5', border: '1.5px solid rgba(201,96,16,0.3)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#2A1606', marginBottom: 4 }}>🔒 This PDF is password protected</div>
      <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.6)', lineHeight: 1.5, marginBottom: 12 }}>
        Card statements are usually locked with a password your bank told you in its email (often part of your name and date of birth). We use it once to read the
        file and never save it.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUnlock();
        }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <input
          type="password"
          autoComplete="off"
          aria-label={`Card ${i + 1} statement password`}
          placeholder="Statement password"
          value={c.password}
          onChange={(e) => setCard(i, { password: e.target.value, passwordMsg: '' })}
          style={{ flex: '1 1 180px', minWidth: 0, padding: '10px 12px', border: '1.5px solid rgba(196,168,130,0.4)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', background: '#fff', color: '#2A1606', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#C96010', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Unlock &amp; read →
        </button>
      </form>
      {c.passwordMsg && (
        <div role="alert" style={{ fontSize: 12, color: '#DC2626', marginTop: 8 }}>
          {c.passwordMsg}
        </div>
      )}
      <button type="button" onClick={onSkip} style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, fontSize: 12, fontWeight: 600, color: '#8A7058', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>
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
      ? { text: '⚠️ STATEMENT SAVED SECURELY — ENTER THE FIGURES FROM IT', color: '#B45309' }
      : missing.length || c.unsure.length
        ? { text: '⚠️ PARTIAL READ — RED FIELDS NEED MANUAL ENTRY', color: '#B45309' }
        : { text: '✓ READ FROM YOUR STATEMENT — PLEASE CHECK THE FIGURES', color: '#059669' };
  return (
    <div style={{ background: '#F0FDF4', border: '1.5px solid rgba(5,150,105,0.3)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(5,150,105,0.15)' }}>
        <span style={{ fontSize: 20 }} aria-hidden>
          📄
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', overflowWrap: 'anywhere' }}>{c.fileName}</div>
          <div style={{ fontSize: 10, color: 'rgba(5,150,105,0.65)' }}>Encrypted &amp; saved to your statement vault</div>
        </div>
        <button type="button" onClick={onReplace} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#059669', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Replace
        </button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: banner.color, letterSpacing: 1, marginBottom: c.readNote ? 4 : 12 }}>{banner.text}</div>
      {c.readNote && <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.55)', marginBottom: 12 }}>{c.readNote}</div>}
      <StatementFields i={i} c={c} setCard={setCard} attempted={attempted} redWhenEmpty />
      <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.45)', marginBottom: 6 }}>
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
    <div style={{ background: '#FFF7ED', border: '1.5px solid rgba(220,38,38,0.25)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }} role="alert">
        <span style={{ fontSize: 20 }} aria-hidden>
          ⚠️
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>Could not save statement</div>
          <div style={{ fontSize: 10, color: 'rgba(180,83,9,0.7)', overflowWrap: 'anywhere' }}>{c.error}</div>
        </div>
        <button type="button" onClick={onRetry} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#B45309', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Try again
        </button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#B45309', letterSpacing: 1, marginBottom: 12 }}>PLEASE ENTER FIGURES FROM YOUR STATEMENT</div>
      <StatementFields i={i} c={c} setCard={setCard} attempted={attempted} redWhenEmpty={false} />
      <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.45)', marginBottom: 6 }}>All figures are on page 1 of your statement.</div>
      <DueDateLine i={i} c={c} setCard={setCard} />
    </div>
  );
}

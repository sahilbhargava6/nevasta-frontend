'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { api } from '@/lib/api';
import { applyForLoan, fetchOffers, journeyRunId, type Offer } from '@/lib/applyOffer';
import {
  DEFAULT_LOAN_JOURNEY,
  DEFAULT_PROFILE,
  estimateCreditScore,
  fmtINR,
  pmt,
  useJourney,
  type EligibilityProfile,
  type LoanJourney,
} from '@/lib/journey';
import { btSaving, fmtRate, fmtShortK, fmtTenure, isUsableLoan } from '@/lib/loanMath';
import { isValidPincode, pincodeHint, usePincodeLookup } from '@/lib/pincodes';

// Design: #lf-bt-eligibility-page (Navesta_Website_22Sep26.html ~5297–5602, JS ~8946–9432)

const INK = '#1A2E3F';
const BORDER = 'rgba(196,168,130,0.4)';
const RED = '#DC2626';
const BLUE = '#2563EB';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(26,46,63,0.5)', textTransform: 'uppercase', marginBottom: 8 };
const errStyle: React.CSSProperties = { fontSize: 12, color: RED, fontWeight: 600, marginTop: 6 };
const primaryBtn: React.CSSProperties = { width: '100%', background: 'linear-gradient(135deg,#2563EB,#1E40AF)', border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 6px 20px rgba(37,99,235,0.3)' };

const EDUCATION = [
  { value: 'graduate', label: 'Graduate (B.A. / B.Sc. / B.Com / B.E.)' },
  { value: 'postgrad', label: 'Post Graduate (M.A. / M.Sc. / MBA)' },
  { value: 'doctorate', label: 'Doctorate / PhD' },
  { value: 'diploma', label: 'Diploma / Vocational' },
  { value: 'other', label: 'Other' },
];

const CHECK_TITLES = ['Verifying outstanding balance', 'Matching BT-eligible lenders', 'Calculating interest savings'];

type CheckRow = { state: 'waiting' | 'checking' | 'done'; label: string };
type Form = { rent: string; address: string; pincode: string; city: string; state: string; education: string; sector: EligibilityProfile['sector']; income: string };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clampTenure = (months: number) => Math.min(72, Math.max(12, Math.round((months || 36) / 6) * 6));

export default function LoanBalanceTransferPage() {
  return (
    <JourneyGate intent="debt-loan">
      <LoanBalanceTransfer />
    </JourneyGate>
  );
}

function LoanBalanceTransfer() {
  const router = useRouter();
  const [loan, , , loanReady] = useJourney<LoanJourney>('loan', DEFAULT_LOAN_JOURNEY);
  const [profile, setProfile, , profileReady] = useJourney<EligibilityProfile>('profile', DEFAULT_PROFILE);
  const ready = loanReady && profileReady;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [housing, setHousing] = useState<EligibilityProfile['housing']>(null);
  const [form, setForm] = useState<Form>({ rent: '', address: '', pincode: '', city: '', state: '', education: '', sector: null, income: '' });
  const [errors, setErrors] = useState<Partial<Record<'rent' | 'pincode' | 'sector' | 'income', string>>>({});
  // Verified with MapmyIndia (India Post backup); city/state are filled from it and
  // become editable only when the pincode can't be confirmed
  const pinCheck = usePincodeLookup(form.pincode, (info) => setForm((f) => ({ ...f, city: info.city, state: info.state })));
  const pinUnknown = pinCheck.status === 'not_found' || pinCheck.status === 'unavailable';
  const pinHint = pincodeHint(pinCheck.status, pinCheck.info);
  const [focus, setFocus] = useState<string | null>(null);

  const [phase, setPhase] = useState<'checking' | 'results' | 'error'>('checking');
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [scoreOnFile, setScoreOnFile] = useState<number | null>(null);

  const [tenure, setTenure] = useState(36);
  const [tab, setTab] = useState<'bank' | 'nbfc'>('bank');
  const [banks, setBanks] = useState<Offer[]>([]);
  const [nbfcs, setNbfcs] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const fetchedTenure = useRef<number | null>(null);

  const [applying, setApplying] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  const runToken = useRef(0);
  const advanceTimer = useRef<number | null>(null);
  const loaded = useRef(false);
  const incomeRef = useRef<HTMLInputElement | null>(null);
  const rentRef = useRef<HTMLInputElement | null>(null);

  // Pre-fill from this session's saved answers (never test data)
  useEffect(() => {
    if (!ready || loaded.current) return;
    loaded.current = true;
    setHousing(profile.housing);
    setForm({
      rent: profile.rent ? String(profile.rent) : '',
      address: profile.address,
      pincode: profile.pincode,
      city: profile.city,
      state: profile.state,
      education: profile.education,
      sector: profile.sector,
      income: profile.income ? String(profile.income) : '',
    });
    setTenure(clampTenure(loan.tenureLeft));
  }, [ready, profile, loan.tenureLeft]);

  // Bureau score on file, if any
  useEffect(() => {
    let alive = true;
    api
      .get('/users/me')
      .then((res: any) => alive && setScoreOnFile(typeof res?.data?.creditScore === 'number' ? res.data.creditScore : null))
      .catch(() => alive && setScoreOnFile(null));
    return () => {
      alive = false;
    };
  }, []);

  // Stop timers / pending runs when leaving the page
  useEffect(
    () => () => {
      runToken.current++;
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const goStep = (n: 1 | 2 | 3) => {
    if (n !== 3) runToken.current++;
    setStep(n);
    window.scrollTo(0, 0);
  };

  const setField = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof typeof e] ? { ...e, [k]: undefined } : e));
  };

  // ── Step 1 ──
  const selectHousing = (val: 'own' | 'rent') => {
    setHousing(val);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    if (val === 'own') {
      setProfile({ housing: 'own', rent: null });
      advanceTimer.current = window.setTimeout(() => goStep(2), 280);
    } else {
      window.setTimeout(() => rentRef.current?.focus(), 320);
    }
  };

  const continueFromRent = () => {
    const rent = parseFloat(form.rent);
    if (!form.rent.trim() || !(rent > 0)) {
      setErrors((e) => ({ ...e, rent: 'Enter your monthly rent' }));
      rentRef.current?.focus();
      return;
    }
    setProfile({ housing: 'rent', rent });
    goStep(2);
  };

  // ── Step 2 ──
  const onPincode = (raw: string) => {
    setField('pincode', raw.replace(/\D/g, '').slice(0, 6));
  };

  const selectSector = (val: 'salaried' | 'self') => {
    setField('sector', val);
    window.setTimeout(() => incomeRef.current?.focus(), 320);
  };

  const loadOffers = useCallback(
    async (months: number) => {
      const [b, n] = await Promise.all([fetchOffers(loan.outstanding, months, 'bank'), fetchOffers(loan.outstanding, months, 'nbfc')]);
      fetchedTenure.current = months;
      setBanks(b);
      setNbfcs(n);
      return [b, n] as const;
    },
    [loan.outstanding],
  );

  const runCheck = async () => {
    const token = ++runToken.current;
    const alive = () => runToken.current === token;
    const startTenure = clampTenure(loan.tenureLeft);
    setTenure(startTenure);
    setPhase('checking');
    setCheckError(null);
    setApplied(null);
    setApplyError(null);
    setTab('bank');
    setChecks([
      { state: 'checking', label: 'Checking…' },
      { state: 'waiting', label: 'Waiting…' },
      { state: 'waiting', label: 'Waiting…' },
    ]);
    const mark = (i: number, row: CheckRow) => setChecks((rows) => rows.map((r, j) => (j === i ? row : r)));

    const offersP = loadOffers(startTenure);
    offersP.catch(() => undefined); // handled below

    await sleep(300);
    if (!alive()) return;
    mark(0, { state: 'checking', label: 'Checking…' });
    await sleep(800);
    if (!alive()) return;
    mark(0, { state: 'done', label: `${fmtINR(loan.outstanding)} confirmed` });

    await sleep(200);
    if (!alive()) return;
    mark(1, { state: 'checking', label: 'Checking…' });
    let b: Offer[];
    let n: Offer[];
    try {
      [[b, n]] = await Promise.all([offersP, sleep(800)]);
    } catch (err: any) {
      if (!alive()) return;
      setCheckError(err?.message || 'Could not reach lenders. Please try again.');
      setPhase('error');
      return;
    }
    if (!alive()) return;
    const count = b.length + n.length;
    mark(1, { state: 'done', label: count ? `${count} lender${count === 1 ? '' : 's'} matched` : 'No lenders matched yet' });

    await sleep(200);
    if (!alive()) return;
    mark(2, { state: 'checking', label: 'Checking…' });
    await sleep(800);
    if (!alive()) return;
    const bestRate = Math.min(...[b[0], n[0]].filter(Boolean).map((o) => o!.offeredRatePercent));
    const saving = Number.isFinite(bestRate) ? btSaving(loan.outstanding, loan.rate, bestRate, loan.tenureLeft) : 0;
    mark(2, { state: 'done', label: `Save up to ${fmtShortK(saving)}` });

    await sleep(600);
    if (!alive()) return;
    setPhase('results');
  };

  const submitAddress = () => {
    const errs: typeof errors = {};
    if (!form.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!isValidPincode(form.pincode)) errs.pincode = 'Enter a valid 6-digit pincode';
    else if (pinCheck.status === 'not_found') errs.pincode = "We couldn't find this pincode. Please check it.";
    else if (pinCheck.status === 'checking') errs.pincode = 'Still checking your pincode. Please try again in a moment.';
    if (!form.sector) errs.sector = 'Choose your working sector';
    else if (!(parseFloat(form.income) > 0)) errs.income = 'Enter your monthly income';
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs.income) incomeRef.current?.focus();
      return;
    }
    setProfile({
      address: form.address.trim(),
      pincode: form.pincode,
      city: form.city.trim(),
      state: form.state.trim(),
      education: form.education,
      sector: form.sector,
      income: parseFloat(form.income),
    });
    goStep(3);
    void runCheck();
  };

  // ── Results: refresh offers when the tenure slider moves ──
  useEffect(() => {
    if (step !== 3 || phase !== 'results' || fetchedTenure.current === tenure) return;
    let alive = true;
    const t = window.setTimeout(() => {
      setOffersLoading(true);
      setOffersError(null);
      Promise.all([fetchOffers(loan.outstanding, tenure, 'bank'), fetchOffers(loan.outstanding, tenure, 'nbfc')])
        .then(([b, n]) => {
          if (!alive) return;
          fetchedTenure.current = tenure;
          setBanks(b);
          setNbfcs(n);
        })
        .catch((err: Error) => alive && setOffersError(err.message || 'Could not refresh offers'))
        .finally(() => alive && setOffersLoading(false));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [step, phase, tenure, loan.outstanding]);

  const apply = async (offer: Offer) => {
    setApplying(offer.lenderId);
    setApplyError(null);
    try {
      await applyForLoan(loan, offer.lenderId, tenure, journeyRunId());
      setApplied(offer.name);
    } catch (err: any) {
      setApplyError(err?.message || 'Could not submit your application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const onBack = () => {
    if (step === 3) goStep(2);
    else if (step === 2) goStep(1);
    else router.push('/journey/loan/fixes');
  };

  if (!ready) return null;

  const usable = isUsableLoan(loan);
  const inputBorder = (k: string, err?: string) => `1.5px solid ${err ? RED : focus === k ? BLUE : BORDER}`;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader onBack={onBack} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px', boxSizing: 'border-box' }}>
        {!usable ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: 'rgba(26,46,63,0.6)', marginBottom: 16 }}>Tell us about your loan first so we can match balance-transfer lenders.</p>
            <Link href="/journey/loan" style={{ color: BLUE, fontWeight: 700 }}>
              Enter loan details →
            </Link>
          </div>
        ) : (
          <>
            {step < 3 && (
              <div style={{ textAlign: 'center', marginBottom: 28 }} aria-label={`Step ${step} of 2`}>
                <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 20, height: 8, borderRadius: 4, background: BLUE, transition: 'all .3s' }} />
                  <div style={{ width: step >= 2 ? 20 : 8, height: 8, borderRadius: step >= 2 ? 4 : '50%', background: step >= 2 ? BLUE : 'rgba(26,46,63,0.18)', transition: 'all .3s' }} />
                </div>
              </div>
            )}

            {/* ── Step 1: Property ── */}
            {step === 1 && (
              <div className="lfbt-step-anim">
                <Tag />
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: INK, marginBottom: 8, lineHeight: 1.25 }}>Do you own or rent your home?</h1>
                <div style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', marginBottom: 24, lineHeight: 1.6 }}>Property ownership affects your eligibility and the rates lenders will offer you.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <ChoiceCard selected={housing === 'own'} onClick={() => selectHousing('own')} icon="🏠" title="Own" sub="Property in my name or family-owned" />
                  <ChoiceCard selected={housing === 'rent'} onClick={() => selectHousing('rent')} icon="🏢" title="Rent" sub="Currently in rented accommodation" />
                </div>

                {housing === 'rent' && (
                  <div style={{ marginTop: 20, animation: 'lfbtFadeIn .3s ease-out both' }}>
                    <div style={{ marginBottom: 18 }}>
                      <label htmlFor="lfbt-rent-amount" style={labelStyle}>
                        Monthly Rent Amount
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: 'rgba(26,46,63,0.4)', pointerEvents: 'none' }} aria-hidden>
                          ₹
                        </span>
                        <input
                          id="lfbt-rent-amount"
                          ref={rentRef}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder="e.g. 25000"
                          value={form.rent}
                          aria-invalid={!!errors.rent}
                          onChange={(e) => setField('rent', e.target.value)}
                          onFocus={() => setFocus('rent')}
                          onBlur={() => setFocus(null)}
                          onKeyDown={(e) => e.key === 'Enter' && continueFromRent()}
                          style={{ width: '100%', padding: '14px 14px 14px 32px', border: inputBorder('rent', errors.rent), borderRadius: 12, fontSize: 20, fontWeight: 700, color: INK, fontFamily: 'var(--sans)', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      {errors.rent && (
                        <div role="alert" style={errStyle}>
                          {errors.rent}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={continueFromRent} style={primaryBtn}>
                      Continue →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {step === 2 && (
              <form
                className="lfbt-step-anim"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAddress();
                }}
              >
                <Tag />
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: INK, marginBottom: 8, lineHeight: 1.25 }}>Where do you live?</h1>
                <div style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', marginBottom: 24, lineHeight: 1.6 }}>We use this to surface lenders active in your area.</div>

                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="lfbt-address" style={labelStyle}>
                    Full Address
                  </label>
                  <textarea
                    id="lfbt-address"
                    rows={2}
                    placeholder="Flat / House No., Street, Area…"
                    value={form.address}
                    autoComplete="street-address"
                    onChange={(e) => setField('address', e.target.value)}
                    onFocus={() => setFocus('address')}
                    onBlur={() => setFocus(null)}
                    style={{ width: '100%', padding: 14, border: inputBorder('address'), borderRadius: 12, fontSize: 15, fontWeight: 500, color: INK, fontFamily: 'var(--sans)', background: '#fff', outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <label htmlFor="lfbt-pincode" style={labelStyle}>
                      Pincode
                    </label>
                    <input
                      id="lfbt-pincode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      placeholder="e.g. 400001"
                      value={form.pincode}
                      aria-invalid={!!errors.pincode}
                      onChange={(e) => onPincode(e.target.value)}
                      onFocus={() => setFocus('pincode')}
                      onBlur={() => setFocus(null)}
                      style={{ width: '100%', padding: 14, border: inputBorder('pincode', errors.pincode), borderRadius: 12, fontSize: 20, fontWeight: 700, color: INK, fontFamily: 'var(--sans)', background: '#fff', outline: 'none', boxSizing: 'border-box', minWidth: 0 }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label htmlFor="lfbt-city" style={labelStyle}>
                      City
                    </label>
                    <input
                      id="lfbt-city"
                      type="text"
                      placeholder={pinUnknown ? 'Enter city' : 'Auto-filled'}
                      value={form.city}
                      readOnly={!pinUnknown}
                      onChange={(e) => setField('city', e.target.value)}
                      style={{ width: '100%', padding: 14, border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 16, fontWeight: 600, color: INK, fontFamily: 'var(--sans)', background: pinUnknown ? '#fff' : '#FAFAF8', outline: 'none', boxSizing: 'border-box', minWidth: 0 }}
                    />
                  </div>
                </div>
                {errors.pincode ? (
                  <div role="alert" style={{ ...errStyle, marginTop: -6, marginBottom: 12 }}>
                    {errors.pincode}
                  </div>
                ) : (
                  pinHint && (
                    <div role="status" style={{ fontSize: 12, marginTop: -6, marginBottom: 12, color: pinHint.color }}>
                      {pinHint.text}
                    </div>
                  )
                )}
                <div style={{ marginBottom: 22 }}>
                  <label htmlFor="lfbt-state" style={labelStyle}>
                    State
                  </label>
                  <input
                    id="lfbt-state"
                    type="text"
                    placeholder={pinUnknown ? 'Enter state' : 'Auto-filled'}
                    value={form.state}
                    readOnly={!pinUnknown}
                    onChange={(e) => setField('state', e.target.value)}
                    style={{ width: '100%', padding: 14, border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 16, fontWeight: 600, color: INK, fontFamily: 'var(--sans)', background: pinUnknown ? '#fff' : '#FAFAF8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="lfbt-edu" style={labelStyle}>
                    Highest Education Level
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="lfbt-edu"
                      value={form.education}
                      onChange={(e) => setField('education', e.target.value)}
                      onFocus={() => setFocus('edu')}
                      onBlur={() => setFocus(null)}
                      style={{ width: '100%', padding: '14px 40px 14px 14px', border: inputBorder('edu'), borderRadius: 12, fontSize: 15, fontWeight: 600, color: INK, fontFamily: 'var(--sans)', background: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="">Select your education level</option>
                      {EDUCATION.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B8BA4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <fieldset style={{ marginBottom: 24, border: 'none', padding: 0, minWidth: 0 }}>
                  <legend style={{ ...labelStyle, marginBottom: 10, padding: 0 }}>Working Sector</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <ChoiceCard small error={!!errors.sector} selected={form.sector === 'salaried'} onClick={() => selectSector('salaried')} icon="💼" title="Salaried" sub="Fixed monthly income" />
                    <ChoiceCard small error={!!errors.sector} selected={form.sector === 'self'} onClick={() => selectSector('self')} icon="🏪" title="Self Employed" sub="Business / Freelance" />
                  </div>
                  {errors.sector && (
                    <div role="alert" style={errStyle}>
                      {errors.sector}
                    </div>
                  )}
                </fieldset>

                {form.sector && (
                  <div style={{ marginBottom: 24, animation: 'lfbtFadeIn .3s ease-out both' }}>
                    <label htmlFor="lfbt-income" style={{ ...labelStyle, marginBottom: 6 }}>
                      {form.sector === 'salaried' ? 'Monthly Take-Home Salary' : 'Average Monthly Income'}
                    </label>
                    <div id="lfbt-income-hint" style={{ fontSize: 12, color: 'rgba(26,46,63,0.45)', marginBottom: 10 }}>
                      {form.sector === 'salaried' ? 'Your net in-hand salary after all deductions' : 'Average net income per month from your business / freelance'}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(26,46,63,0.5)', pointerEvents: 'none' }} aria-hidden>
                        ₹
                      </span>
                      <input
                        id="lfbt-income"
                        ref={incomeRef}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="e.g. 75000"
                        aria-describedby="lfbt-income-hint"
                        aria-invalid={!!errors.income}
                        value={form.income}
                        onChange={(e) => setField('income', e.target.value)}
                        onFocus={() => setFocus('income')}
                        onBlur={() => setFocus(null)}
                        style={{ width: '100%', padding: '14px 14px 14px 32px', border: inputBorder('income', errors.income), borderRadius: 14, fontSize: 16, fontFamily: 'var(--sans)', color: INK, background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                    {errors.income && (
                      <div role="alert" style={errStyle}>
                        {errors.income}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" style={{ ...primaryBtn, borderRadius: 16, padding: 17, fontSize: 16, letterSpacing: 0.2, boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
                  Find My Best BT Rate →
                </button>
              </form>
            )}

            {/* ── Step 3: Check + Results ── */}
            {step === 3 && phase !== 'results' && (
              <div className="lfbt-step-anim">
                <div style={{ textAlign: 'center', padding: '52px 20px 48px' }}>
                  <div style={{ fontSize: 58, marginBottom: 22, display: 'inline-block', animation: 'lfbtPulse 1.4s ease-in-out infinite' }} aria-hidden>
                    🔍
                  </div>
                  <h1 style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 900, color: INK, marginBottom: 10, lineHeight: 1.25 }}>Finding your best BT rate…</h1>
                  <div style={{ fontSize: 13.5, color: 'rgba(26,46,63,0.45)', marginBottom: 28 }}>Matching your profile with lender criteria</div>
                  {phase === 'checking' && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9 }} aria-hidden>
                      {[0, 0.2, 0.4].map((d) => (
                        <div key={d} style={{ width: 9, height: 9, borderRadius: '50%', background: BLUE, animation: `lfbtBounce 1.2s ease-in-out ${d}s infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }} aria-live="polite">
                  {checks.map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 2 ? '1px solid rgba(196,168,130,0.15)' : undefined, opacity: row.state === 'waiting' ? 0.35 : 1 }}>
                      {row.state === 'done' ? (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }} aria-hidden>
                          ✓
                        </div>
                      ) : (
                        <div className="lfbt-spinner" aria-hidden />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{CHECK_TITLES[i]}</div>
                        <div style={{ fontSize: 12, color: row.state === 'done' ? '#059669' : 'rgba(26,46,63,0.45)', marginTop: 2 }}>{row.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {phase === 'error' && (
                  <div role="alert" style={{ marginTop: 16, background: '#FFF5F5', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: RED, fontWeight: 600, marginBottom: 12 }}>{checkError}</div>
                    <button type="button" onClick={() => void runCheck()} style={primaryBtn}>
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && phase === 'results' && (
              <Results
                loan={loan}
                profile={profile}
                scoreOnFile={scoreOnFile}
                tenure={tenure}
                setTenure={setTenure}
                tab={tab}
                setTab={setTab}
                banks={banks}
                nbfcs={nbfcs}
                offersLoading={offersLoading}
                offersError={offersError}
                applying={applying}
                applyError={applyError}
                applied={applied}
                onApply={apply}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Tag() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
      <span style={{ fontSize: 10 }} aria-hidden>
        🔄
      </span>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: BLUE, textTransform: 'uppercase' }}>Balance Transfer</span>
    </div>
  );
}

function ChoiceCard({ selected, onClick, icon, title, sub, small, error }: { selected: boolean; onClick: () => void; icon: string; title: string; sub: string; small?: boolean; error?: boolean }) {
  return (
    <button
      type="button"
      className={`lfbt-prop-card${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
      style={{ fontFamily: 'var(--sans)', width: '100%', minWidth: 0, ...(error && !selected ? { borderColor: RED } : {}) }}
    >
      <div style={{ fontSize: small ? 30 : 36, marginBottom: small ? 10 : 12 }} aria-hidden>
        {icon}
      </div>
      <div style={{ fontSize: small ? 14 : 16, fontWeight: 800, color: INK, marginBottom: small ? 3 : 4 }}>{title}</div>
      <div style={{ fontSize: small ? 11 : 12, color: 'rgba(26,46,63,0.5)', lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}

// ── Results ──

const SCORE_ZONES = [
  { min: 300, max: 580, color: '#DDA87A', label: 'POOR' },
  { min: 580, max: 670, color: '#F08A30', label: 'FAIR' },
  { min: 670, max: 740, color: '#D4B200', label: 'GOOD' },
  { min: 740, max: 900, color: '#3BAD6B', label: 'EXCELLENT' },
];

function scoreInfo(score: number) {
  if (score >= 740) return { label: 'Excellent', color: '#16a34a', desc: 'Excellent score! You qualify for the best BT rates from all banks and NBFCs.' };
  if (score >= 670) return { label: 'Good', color: '#2563EB', desc: 'Your score clears the 700 threshold that unlocks NBFC lending. Great news — you have real options below.' };
  if (score >= 580) return { label: 'Fair', color: '#F08A30', desc: 'Fair score. You qualify for NBFC options. Some banks may require a co-applicant.' };
  return { label: 'Poor', color: '#DC2626', desc: 'Your score is below 580. A few NBFCs can still help — see your options below.' };
}

/** Semicircle 300–900 gauge (lfbtScoreGaugeSVG). */
function ScoreGauge({ score }: { score: number }) {
  const cx = 100;
  const cy = 100;
  const r = 73;
  const sw = 20;
  const toAngle = (s: number) => 180 - ((Math.min(900, Math.max(300, s)) - 300) / 600) * 180;
  const pt = (deg: number, rad: number) => {
    const rd = (deg * Math.PI) / 180;
    return [+(cx + rad * Math.cos(rd)).toFixed(2), +(cy - rad * Math.sin(rd)).toFixed(2)] as const;
  };
  const arc = (a1: number, a2: number) => {
    const p1 = pt(a1, r);
    const p2 = pt(a2, r);
    return `M ${p1[0]},${p1[1]} A ${r},${r} 0 0,1 ${p2[0]},${p2[1]}`;
  };
  const np = pt(toAngle(score), 55);
  return (
    <svg viewBox="0 0 200 118" width="188" height="111" style={{ display: 'block', margin: '0 auto' }} aria-hidden>
      {SCORE_ZONES.map((z) => (
        <path key={z.label} d={arc(toAngle(z.min), toAngle(z.max))} fill="none" stroke={z.color} strokeWidth={sw} strokeLinecap="butt" />
      ))}
      {SCORE_ZONES.map((z) => {
        const mid = toAngle((z.min + z.max) / 2);
        const [x, y] = pt(mid, r);
        return (
          <text key={`t${z.label}`} x={x} y={y} fill="rgba(255,255,255,0.95)" fontSize="6" fontWeight="800" fontFamily="system-ui,sans-serif" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(90 - mid).toFixed(1)},${x},${y})`}>
            {z.label}
          </text>
        );
      })}
      <line x1={cx} y1={cy} x2={np[0]} y2={np[1]} stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="8" fill={INK} />
      <circle cx={cx} cy={cy} r="4" fill="#fff" />
      <text x="26" y={cy + 14} fill="rgba(26,46,63,0.4)" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
        300
      </text>
      <text x="174" y={cy + 14} fill="rgba(26,46,63,0.4)" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
        900
      </text>
    </svg>
  );
}

function disbursalText(o: Offer) {
  if (o.disbursalDaysMax <= 1) return '24 hrs';
  if (o.disbursalDaysMin === o.disbursalDaysMax || !o.disbursalDaysMin) return `${o.disbursalDaysMax} days`;
  return `${o.disbursalDaysMin}-${o.disbursalDaysMax} days`;
}

function brandColors(o: Offer) {
  const c = o.brandColor && /^#[0-9a-f]{6}$/i.test(o.brandColor) ? o.brandColor : '#1D4ED8';
  return { color: c, bg: `${c}1A` };
}

type ResultsProps = {
  loan: LoanJourney;
  profile: EligibilityProfile;
  scoreOnFile: number | null;
  tenure: number;
  setTenure: (n: number) => void;
  tab: 'bank' | 'nbfc';
  setTab: (t: 'bank' | 'nbfc') => void;
  banks: Offer[];
  nbfcs: Offer[];
  offersLoading: boolean;
  offersError: string | null;
  applying: string | null;
  applyError: string | null;
  applied: string | null;
  onApply: (o: Offer) => void;
};

function Results(p: ResultsProps) {
  const { loan, tenure } = p;
  const { score, estimated } = estimateCreditScore(p.profile, p.scoreOnFile);
  const info = scoreInfo(score);
  const bestOverall = [p.banks[0], p.nbfcs[0]].filter(Boolean).sort((a, b) => a.offeredRatePercent - b.offeredRatePercent)[0] as Offer | undefined;
  const bestRate = bestOverall?.offeredRatePercent;
  const emiAtBest = bestRate != null ? pmt(loan.outstanding, bestRate, tenure) : 0;
  const saving = bestRate != null ? btSaving(loan.outstanding, loan.rate, bestRate, tenure) : 0;
  const pct = ((tenure - 12) / (72 - 12)) * 100;
  const offer = (p.tab === 'bank' ? p.banks : p.nbfcs)[0];

  const tabBtn = (t: 'bank' | 'nbfc', label: string) => (
    <button
      type="button"
      aria-pressed={p.tab === t}
      onClick={() => p.setTab(t)}
      style={{ flex: 1, padding: 10, borderRadius: 12, border: `1.5px solid ${p.tab === t ? BLUE : 'rgba(196,168,130,0.35)'}`, background: p.tab === t ? BLUE : '#fff', color: p.tab === t ? '#fff' : INK, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}
    >
      {label}
    </button>
  );

  return (
    <div className="lfbt-step-anim">
      <div style={{ marginBottom: 14, padding: '0 2px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: INK, lineHeight: 1.2 }}>Your Balance Transfer Plan</h1>
        <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.45)', marginTop: 4 }}>Here&apos;s what we&apos;re arranging for you</div>
      </div>

      {/* Credit score gauge */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(26,46,63,0.4)', textTransform: 'uppercase', marginBottom: 18 }}>{estimated ? 'Your Estimated Credit Score' : 'Your CRIF Credit Score'}</div>
        <div style={{ marginBottom: 6 }}>
          <ScoreGauge score={score} />
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: INK, lineHeight: 1, marginBottom: 4 }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(26,46,63,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>{estimated ? 'ESTIMATED SCORE' : 'CRIF SCORE'}</div>
        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 10, color: info.color }}>{info.label}</div>
        <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.5)', lineHeight: 1.55, maxWidth: 280, margin: '0 auto 18px' }}>{info.desc}</div>
        {estimated ? (
          <div style={{ fontSize: 11.5, color: 'rgba(26,46,63,0.45)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>Estimated from your answers — your bureau score may differ. Lenders check it when you apply.</div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid rgba(196,168,130,0.35)', borderRadius: 24, padding: '8px 18px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(26,46,63,0.4)', textTransform: 'uppercase' }}>POWERED BY</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: INK, letterSpacing: 0.5 }}>CRIF</span>
          </div>
        )}
      </div>

      {/* Your Loan Summary */}
      <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 18px rgba(0,0,0,0.08)' }}>
        <div style={{ background: 'linear-gradient(135deg,#059669 0%,#047857 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
            🎉
          </span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>Balance Transfer</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginTop: 2 }}>Your Loan Summary</div>
          </div>
        </div>
        <div style={{ padding: '18px 16px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.09),rgba(37,99,235,0.04))', border: '1.5px solid rgba(37,99,235,0.2)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: 'rgba(37,99,235,0.7)', textTransform: 'uppercase', marginBottom: 7 }}>LOAN AMOUNT</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: INK, lineHeight: 1 }}>{fmtINR(loan.outstanding)}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,rgba(5,150,105,0.09),rgba(5,150,105,0.04))', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: 'rgba(5,150,105,0.7)', textTransform: 'uppercase', marginBottom: 7 }}>TENURE</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: INK, lineHeight: 1 }}>{fmtTenure(tenure)}</div>
            </div>
          </div>
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <label htmlFor="lfbt-tenure-slider" style={{ fontSize: 14, fontWeight: 700, color: 'rgba(26,46,63,0.5)' }}>
                Tenure
              </label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ background: '#FFF3E8', border: '1.5px solid rgba(208,96,8,0.18)', borderRadius: 10, padding: '5px 14px', minWidth: 54, textAlign: 'center' }}>
                  <span style={{ fontSize: 21, fontWeight: 900, color: INK, lineHeight: 1 }}>{tenure}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(26,46,63,0.5)' }}>months</span>
              </div>
            </div>
            <div className="lfbt-slider-wrap">
              <div className="lfbt-track-bg">
                <div className="lfbt-track-fill" style={{ width: `${pct.toFixed(1)}%` }} />
              </div>
              <div className="lfbt-custom-thumb" style={{ left: `calc(11px + (100% - 22px) * ${(pct / 100).toFixed(4)})` }} />
              <input type="range" id="lfbt-tenure-slider" min={12} max={72} step={6} value={tenure} onChange={(e) => p.setTenure(parseInt(e.target.value, 10))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,46,63,0.35)' }}>12 mo</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{bestRate != null ? `${fmtINR(emiAtBest)} /mo at best rate` : '— /mo at best rate'}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,46,63,0.35)' }}>72 mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matched Offers */}
      <div style={{ marginBottom: 14, padding: '0 2px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: 'rgba(26,46,63,0.38)', textTransform: 'uppercase', marginBottom: 2 }}>Matched Offers</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: INK }}>Your Best BT Options</h2>
          <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)' }}>on {fmtINR(loan.outstanding)}</div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <div style={{ background: '#FFF5F5', border: '1.5px solid rgba(220,38,38,0.15)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(220,38,38,0.7)', textTransform: 'uppercase', marginBottom: 6 }}>YOUR RATE NOW</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: RED }}>{loan.rate.toFixed(2)}%</div>
          </div>
          <div style={{ fontSize: 18, color: 'rgba(26,46,63,0.3)', fontWeight: 300 }} aria-hidden>
            →
          </div>
          <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(5,150,105,0.8)', textTransform: 'uppercase', marginBottom: 6 }}>BEST AVAILABLE</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{bestRate != null ? `${fmtRate(bestRate)}%` : '—'}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: 'rgba(26,46,63,0.55)' }}>
          Potential interest saving: <strong style={{ color: '#059669' }}>{fmtINR(saving)}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabBtn('bank', '🏦 Banks')}
        {tabBtn('nbfc', '🏢 NBFCs')}
      </div>

      {p.offersError && (
        <div role="alert" style={{ ...errStyle, marginTop: 0, marginBottom: 12 }}>
          {p.offersError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: p.offersLoading ? 0.6 : 1, transition: 'opacity .2s' }}>
        {p.applied ? (
          <div role="status" style={{ background: '#ECFDF5', border: '2px solid #059669', borderRadius: 18, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#065F46', marginBottom: 8 }}>✅ Application submitted to {p.applied}</div>
            <div style={{ fontSize: 13, color: 'rgba(6,95,70,0.75)', lineHeight: 1.55, marginBottom: 16 }}>
              Your balance transfer request for {fmtINR(loan.outstanding)} over {tenure} months is with the lender. We&apos;ll keep you posted — you can track it any time.
            </div>
            <Link href="/balance-transfer" style={{ display: 'block', padding: 15, background: '#1A3D2B', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 900, textDecoration: 'none' }}>
              Track My Application →
            </Link>
          </div>
        ) : offer ? (
          <OfferCard offer={offer} tenure={tenure} applying={p.applying === offer.lenderId} disabled={!!p.applying || p.offersLoading} error={p.applyError} onApply={() => p.onApply(offer)} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 18, padding: 18, fontSize: 13, color: 'rgba(26,46,63,0.55)', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {p.offersLoading ? 'Loading offers…' : `No ${p.tab === 'bank' ? 'bank' : 'NBFC'} offers match this loan right now. Try the other tab or a different tenure.`}
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 14, padding: '14px 16px', marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: BLUE, textTransform: 'uppercase', marginBottom: 6 }}>💡 Before You Switch</div>
        <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.65)', lineHeight: 1.6 }}>
          Check your current lender&apos;s foreclosure charge (usually 2–4% of outstanding) and the new lender&apos;s processing fee (0.5–2%). Net savings = interest saved − both charges.
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer, tenure, applying, disabled, error, onApply }: { offer: Offer; tenure: number; applying: boolean; disabled: boolean; error: string | null; onApply: () => void }) {
  const { color, bg } = brandColors(offer);
  const emi = Math.round(offer.estimatedEmiRupees);
  const chipLbl: React.CSSProperties = { fontSize: 8.5, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 };
  return (
    <div style={{ position: 'relative', background: '#fff', border: '2px solid #1A3D2B', borderRadius: 18, padding: '16px 16px 14px', boxShadow: '0 4px 20px rgba(5,150,105,0.15)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, background: '#1A3D2B', color: '#fff', fontSize: 9.5, fontWeight: 900, letterSpacing: 1.2, padding: '6px 13px', borderRadius: '0 16px 0 12px', textTransform: 'uppercase' }}>BEST MATCH ✓</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, paddingTop: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color, flexShrink: 0 }} aria-hidden>
          {offer.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: INK, marginBottom: 3 }}>{offer.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.5)' }}>
            {offer.type === 'bank' ? 'Bank' : 'NBFC'} · {tenure} months tenure
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', lineHeight: 1 }}>{fmtRate(offer.offeredRatePercent)}%</div>
          <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.45)', textAlign: 'right', marginTop: 1 }}>p.a.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'rgba(5,150,105,0.1)', borderRadius: 12, padding: '12px 6px', textAlign: 'center', minWidth: 0 }}>
          <div style={{ ...chipLbl, color: '#059669' }}>MONTHLY EMI</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#059669' }}>₹{emi.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ background: 'rgba(26,46,63,0.05)', borderRadius: 12, padding: '12px 6px', textAlign: 'center', minWidth: 0 }}>
          <div style={{ ...chipLbl, color: 'rgba(26,46,63,0.42)' }}>PROCESSING</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: INK }}>{fmtINR(offer.processingFeeRupees)}</div>
        </div>
        <div style={{ background: 'rgba(26,46,63,0.05)', borderRadius: 12, padding: '12px 6px', textAlign: 'center', minWidth: 0 }}>
          <div style={{ ...chipLbl, color: 'rgba(26,46,63,0.42)' }}>DISBURSAL</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>{disbursalText(offer)}</div>
        </div>
      </div>
      {offer.meetsMinimumScore === false && (
        <div style={{ background: '#FFFBEB', borderRadius: 11, padding: '10px 12px', fontSize: 11.5, color: '#92400E', lineHeight: 1.55, marginBottom: 12 }}>
          {offer.name} usually looks for a credit score of {offer.minCreditScore}+. You can still apply — the lender makes the final decision.
        </div>
      )}
      <div style={{ background: 'rgba(37,99,235,0.05)', borderRadius: 11, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.5 }} aria-hidden>
          🔒
        </span>
        <div style={{ fontSize: 11.5, color: 'rgba(26,46,63,0.5)', lineHeight: 1.55 }}>Your data is shared securely with {offer.name} only after you apply. No impact on your credit score.</div>
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={disabled}
        style={{ width: '100%', padding: 15, background: '#1A3D2B', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, fontFamily: 'var(--sans)', cursor: disabled ? 'default' : 'pointer', letterSpacing: 0.3, opacity: disabled && !applying ? 0.7 : 1 }}
      >
        {applying ? 'Submitting…' : 'Apply Now →'}
      </button>
      {error && (
        <div role="alert" style={{ ...errStyle, textAlign: 'center', marginTop: 10 }}>
          {error}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(26,46,63,0.38)', marginTop: 8 }}>
        Applying with {offer.name} · Lowest rate match · ₹{emi.toLocaleString('en-IN')}/mo
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, Building2, CheckCircle2, ChevronDown, Home, Info, Landmark, Loader2, Lock, RefreshCw, Search, ShieldCheck, Store, AlertTriangle } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { api } from '@/lib/api';
import { applyForLoan, fetchOffers, journeyRunId, type Offer } from '@/lib/applyOffer';
import { detailKey, trackStep } from '@/lib/track';
import {
  DEFAULT_LOAN_JOURNEY,
  DEFAULT_PROFILE,
  estimateCreditScore,
  fmtINR,
  pmt,
  scoreSourceLabel,
  useJourney,
  type EligibilityProfile,
  type LoanJourney,
} from '@/lib/journey';
import { btSaving, fmtRate, fmtShortK, fmtTenure, isUsableLoan } from '@/lib/loanMath';
import { isValidPincode, pincodeHint, usePincodeLookup } from '@/lib/pincodes';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';
const errCls = 'text-xs font-medium text-rose-600 mt-1';
const inputBase =
  'w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2';
const inputCls = (err?: string) =>
  `${inputBase} ${err ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-600/20 focus:border-blue-600'}`;

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
  const pinHintCls =
    pinCheck.status === 'verified' ? 'text-emerald-600' : pinCheck.status === 'not_found' ? 'text-rose-600' : pinCheck.status === 'unavailable' ? 'text-amber-700' : 'text-slate-500';

  const [phase, setPhase] = useState<'checking' | 'results' | 'error'>('checking');
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [scoreOnFile, setScoreOnFile] = useState<number | null>(null);
  const [scoreSource, setScoreSource] = useState<string | null>(null);

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
      .then((res: any) => {
        if (!alive) return;
        setScoreOnFile(typeof res?.data?.creditScore === 'number' ? res.data.creditScore : null);
        setScoreSource(res?.data?.creditScores?.[0]?.source ?? null);
      })
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
    trackStep('loan', 'offers_shown');
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
      trackStep('loan', 'applied', detailKey(offer.name));
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

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader onBack={onBack} />

      <main className={`${step === 3 && phase === 'results' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 py-8 space-y-6`}>
        {!usable ? (
          <div className="card-fintech p-5 sm:p-6 text-center space-y-4">
            <p className="text-sm text-slate-600">Tell us about your loan first so we can match balance-transfer lenders.</p>
            <Link href="/journey/loan" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Enter loan details →
            </Link>
          </div>
        ) : (
          <>
            {step < 3 && (
              <div className="flex items-center justify-center gap-2" aria-label={`Step ${step} of 2`}>
                <div className="h-2 w-5 rounded bg-blue-600 transition-all" />
                <div className={`h-2 rounded transition-all ${step >= 2 ? 'w-5 bg-blue-600' : 'w-2 bg-slate-300'}`} />
              </div>
            )}

            {/* ── Step 1: Property ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Tag />
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Do you own or rent your home?</h1>
                  <p className="text-sm text-slate-600 leading-relaxed">Property ownership affects your eligibility and the rates lenders will offer you.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ChoiceCard selected={housing === 'own'} onClick={() => selectHousing('own')} icon={<Home className="w-6 h-6" />} title="Own" sub="Property in my name or family-owned" />
                  <ChoiceCard selected={housing === 'rent'} onClick={() => selectHousing('rent')} icon={<Building2 className="w-6 h-6" />} title="Rent" sub="Currently in rented accommodation" />
                </div>

                {housing === 'rent' && (
                  <div className="card-fintech p-5 sm:p-6 space-y-4">
                    <div>
                      <label htmlFor="lfbt-rent-amount" className={labelCls}>
                        Monthly Rent Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium" aria-hidden>
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
                          onKeyDown={(e) => e.key === 'Enter' && continueFromRent()}
                          className={`${inputCls(errors.rent)} pl-7`}
                        />
                      </div>
                      {errors.rent && (
                        <div role="alert" className={errCls}>
                          {errors.rent}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={continueFromRent} className="btn-accent w-full sm:w-auto">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {step === 2 && (
              <form
                className="space-y-6"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAddress();
                }}
              >
                <div className="space-y-3">
                  <Tag />
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Where do you live?</h1>
                  <p className="text-sm text-slate-600 leading-relaxed">We use this to surface lenders active in your area.</p>
                </div>

                <div className="card-fintech p-5 sm:p-6 space-y-4">
                  <div>
                    <label htmlFor="lfbt-address" className={labelCls}>
                      Full Address
                    </label>
                    <textarea
                      id="lfbt-address"
                      rows={2}
                      placeholder="Flat / House No., Street, Area…"
                      value={form.address}
                      autoComplete="street-address"
                      onChange={(e) => setField('address', e.target.value)}
                      className={`${inputCls()} resize-none`}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label htmlFor="lfbt-pincode" className={labelCls}>
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
                        className={inputCls(errors.pincode)}
                      />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="lfbt-city" className={labelCls}>
                        City
                      </label>
                      <input
                        id="lfbt-city"
                        type="text"
                        placeholder={pinUnknown ? 'Enter city' : 'Auto-filled'}
                        value={form.city}
                        readOnly={!pinUnknown}
                        onChange={(e) => setField('city', e.target.value)}
                        className={`${inputCls()} ${pinUnknown ? '' : 'bg-slate-100 text-slate-600'}`}
                      />
                    </div>
                  </div>
                  {errors.pincode ? (
                    <div role="alert" className={errCls}>
                      {errors.pincode}
                    </div>
                  ) : (
                    pinHint && (
                      <div role="status" className={`text-xs ${pinHintCls}`}>
                        {pinHint.text}
                      </div>
                    )
                  )}
                  <div>
                    <label htmlFor="lfbt-state" className={labelCls}>
                      State
                    </label>
                    <input
                      id="lfbt-state"
                      type="text"
                      placeholder={pinUnknown ? 'Enter state' : 'Auto-filled'}
                      value={form.state}
                      readOnly={!pinUnknown}
                      onChange={(e) => setField('state', e.target.value)}
                      className={`${inputCls()} ${pinUnknown ? '' : 'bg-slate-100 text-slate-600'}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="lfbt-edu" className={labelCls}>
                      Highest Education Level
                    </label>
                    <div className="relative">
                      <select
                        id="lfbt-edu"
                        value={form.education}
                        onChange={(e) => setField('education', e.target.value)}
                        className={`${inputCls()} appearance-none pr-10 cursor-pointer`}
                      >
                        <option value="">Select your education level</option>
                        {EDUCATION.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                    </div>
                  </div>
                </div>

                <div className="card-fintech p-5 sm:p-6 space-y-4">
                  <fieldset className="border-0 p-0 m-0 min-w-0">
                    <legend className={`${labelCls} p-0`}>Working Sector</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ChoiceCard small error={!!errors.sector} selected={form.sector === 'salaried'} onClick={() => selectSector('salaried')} icon={<Briefcase className="w-5 h-5" />} title="Salaried" sub="Fixed monthly income" />
                      <ChoiceCard small error={!!errors.sector} selected={form.sector === 'self'} onClick={() => selectSector('self')} icon={<Store className="w-5 h-5" />} title="Self Employed" sub="Business / Freelance" />
                    </div>
                    {errors.sector && (
                      <div role="alert" className={errCls}>
                        {errors.sector}
                      </div>
                    )}
                  </fieldset>

                  {form.sector && (
                    <div>
                      <label htmlFor="lfbt-income" className={labelCls}>
                        {form.sector === 'salaried' ? 'Monthly Take-Home Salary' : 'Average Monthly Income'}
                      </label>
                      <div id="lfbt-income-hint" className="text-xs text-slate-500 mb-2">
                        {form.sector === 'salaried' ? 'Your net in-hand salary after all deductions' : 'Average net income per month from your business / freelance'}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium" aria-hidden>
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
                          className={`${inputCls(errors.income)} pl-7`}
                        />
                      </div>
                      {errors.income && (
                        <div role="alert" className={errCls}>
                          {errors.income}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-accent w-full sm:w-auto">
                  Find My Best BT Rate
                  <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
                </button>
              </form>
            )}

            {/* ── Step 3: Check + Results ── */}
            {step === 3 && phase !== 'results' && (
              <div className="space-y-6">
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto" aria-hidden>
                    <Search className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Finding your best BT rate…</h1>
                  <p className="text-sm text-slate-600">Matching your profile with lender criteria</p>
                </div>
                <div className="card-fintech p-5 sm:p-6 divide-y divide-slate-100" aria-live="polite">
                  {checks.map((row, i) => (
                    <div key={i} className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${row.state === 'waiting' ? 'opacity-40' : ''}`}>
                      {row.state === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" aria-hidden />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{CHECK_TITLES[i]}</div>
                        <div className={`text-xs mt-0.5 ${row.state === 'done' ? 'text-emerald-600' : 'text-slate-500'}`}>{row.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {phase === 'error' && (
                  <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 p-4 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                      {checkError}
                    </div>
                    <button type="button" onClick={() => void runCheck()} className="btn-accent w-full sm:w-auto">
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
                scoreSource={scoreSource}
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
      </main>
    </div>
  );
}

function Tag() {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
      <RefreshCw className="w-4 h-4" aria-hidden />
      Balance Transfer
    </div>
  );
}

function ChoiceCard({ selected, onClick, icon, title, sub, small, error }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string; small?: boolean; error?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full min-w-0 rounded-xl border-2 text-left transition-all cursor-pointer ${small ? 'p-3' : 'p-4'} ${
        selected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : error ? 'border-rose-400 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className={`${selected ? 'text-blue-600' : 'text-slate-500'} mb-2`} aria-hidden>
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{sub}</div>
    </button>
  );
}

// ── Results ──

const SCORE_ZONES = [
  { min: 300, max: 580, color: '#F43F5E', label: 'POOR' },
  { min: 580, max: 670, color: '#F59E0B', label: 'FAIR' },
  { min: 670, max: 740, color: '#3B82F6', label: 'GOOD' },
  { min: 740, max: 900, color: '#10B981', label: 'EXCELLENT' },
];

function scoreInfo(score: number) {
  if (score >= 740) return { label: 'Excellent', cls: 'text-emerald-600', desc: 'Excellent score! You qualify for the best BT rates from all banks and NBFCs.' };
  if (score >= 670) return { label: 'Good', cls: 'text-blue-600', desc: 'Your score clears the 700 threshold that unlocks NBFC lending. Great news — you have real options below.' };
  if (score >= 580) return { label: 'Fair', cls: 'text-amber-600', desc: 'Fair score. You qualify for NBFC options. Some banks may require a co-applicant.' };
  return { label: 'Poor', cls: 'text-rose-600', desc: 'Your score is below 580. A few NBFCs can still help — see your options below.' };
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
    <svg viewBox="0 0 200 118" width="188" height="111" className="block mx-auto" aria-hidden>
      {SCORE_ZONES.map((z) => (
        <path key={z.label} d={arc(toAngle(z.min), toAngle(z.max))} fill="none" stroke={z.color} strokeWidth={sw} strokeLinecap="butt" />
      ))}
      {SCORE_ZONES.map((z) => {
        const mid = toAngle((z.min + z.max) / 2);
        const [x, y] = pt(mid, r);
        return (
          <text key={`t${z.label}`} x={x} y={y} fill="#FFFFFF" fontSize="6" fontWeight="800" fontFamily="system-ui,sans-serif" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(90 - mid).toFixed(1)},${x},${y})`}>
            {z.label}
          </text>
        );
      })}
      <line x1={cx} y1={cy} x2={np[0]} y2={np[1]} stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="8" fill="#0F172A" />
      <circle cx={cx} cy={cy} r="4" fill="#fff" />
      <text x="26" y={cy + 14} fill="#64748B" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
        300
      </text>
      <text x="174" y={cy + 14} fill="#64748B" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
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

function brandColor(o: Offer) {
  return o.brandColor && /^#[0-9a-f]{6}$/i.test(o.brandColor) ? o.brandColor : '#1D4ED8';
}

type ResultsProps = {
  loan: LoanJourney;
  profile: EligibilityProfile;
  scoreOnFile: number | null;
  scoreSource: string | null;
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
  const src = scoreSourceLabel(p.scoreSource);
  const info = scoreInfo(score);
  const bestOverall = [p.banks[0], p.nbfcs[0]].filter(Boolean).sort((a, b) => a.offeredRatePercent - b.offeredRatePercent)[0] as Offer | undefined;
  const bestRate = bestOverall?.offeredRatePercent;
  const emiAtBest = bestRate != null ? pmt(loan.outstanding, bestRate, tenure) : 0;
  const saving = bestRate != null ? btSaving(loan.outstanding, loan.rate, bestRate, tenure) : 0;
  const offer = (p.tab === 'bank' ? p.banks : p.nbfcs)[0];

  const tabBtn = (t: 'bank' | 'nbfc', label: string, icon: React.ReactNode) => (
    <button
      type="button"
      aria-pressed={p.tab === t}
      onClick={() => p.setTab(t)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${p.tab === t ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Tag />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your Balance Transfer Plan</h1>
        <p className="text-sm text-slate-600 leading-relaxed">Here&apos;s what we&apos;re arranging for you</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Credit score gauge */}
        <div className="card-fintech p-5 sm:p-6 text-center">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">{estimated ? 'Your Estimated Credit Score' : src.title}</div>
          <ScoreGauge score={score} />
          <div className="text-5xl font-bold text-slate-900 tabular-nums mt-2">{score}</div>
          <div className="mt-2 flex justify-center">
            {estimated ? <span className="badge-amber">ESTIMATED SCORE</span> : <span className={src.bureau ? 'badge-slate' : 'badge-amber'}>{src.badge}</span>}
          </div>
          <div className={`text-2xl font-bold mt-3 ${info.cls}`}>{info.label}</div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto mt-2">{info.desc}</p>
          {estimated ? (
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mt-3">Estimated from your answers — your bureau score may differ. Lenders check it when you apply.</p>
          ) : src.bureau ? (
            <div className="inline-flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 mt-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">POWERED BY</span>
              <span className="text-sm font-bold text-slate-900">{src.bureau}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mt-3">The score you told us — not checked with a bureau yet. Lenders check your actual score when you apply.</p>
          )}
        </div>

        {/* Your Loan Summary */}
        <div className="card-fintech overflow-hidden">
          <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center gap-3">
            <Landmark className="w-5 h-5 text-blue-400 shrink-0" aria-hidden />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Balance Transfer</div>
              <div className="text-base font-bold">Your Loan Summary</div>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="text-[11px] font-medium text-slate-500">Loan amount</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{fmtINR(loan.outstanding)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="text-[11px] font-medium text-slate-500">Tenure</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{fmtTenure(tenure)}</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="lfbt-tenure-slider" className="text-xs font-semibold text-slate-700">
                  Tenure
                </label>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {tenure} <span className="text-xs font-medium text-slate-500">months</span>
                </div>
              </div>
              <input type="range" id="lfbt-tenure-slider" className="w-full accent-blue-600" min={12} max={72} step={6} value={tenure} onChange={(e) => p.setTenure(parseInt(e.target.value, 10))} />
              <div className="flex justify-between items-center gap-2 mt-1 text-xs text-slate-500">
                <span>12 mo</span>
                <span className="font-semibold text-emerald-600 text-center">{bestRate != null ? `${fmtINR(emiAtBest)} /mo at best rate` : '— /mo at best rate'}</span>
                <span>72 mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matched Offers */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Matched Offers</div>
        <div className="flex justify-between items-baseline gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-900">Your Best BT Options</h2>
          <div className="text-xs text-slate-500">on {fmtINR(loan.outstanding)}</div>
        </div>
      </div>

      <div className="card-fintech p-5 sm:p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
            <div className="text-[11px] font-medium text-rose-700 uppercase mb-1">Your rate now</div>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">{loan.rate.toFixed(2)}%</div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" aria-hidden />
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-[11px] font-medium text-emerald-700 uppercase mb-1">Best available</div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{bestRate != null ? `${fmtRate(bestRate)}%` : '—'}</div>
          </div>
        </div>
        <div className="mt-3 text-center text-sm text-slate-600">
          Potential interest saving: <strong className="text-emerald-600">{fmtINR(saving)}</strong>
        </div>
      </div>

      <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        {tabBtn('bank', 'Banks', <Landmark className="w-3.5 h-3.5" aria-hidden />)}
        {tabBtn('nbfc', 'NBFCs', <Building2 className="w-3.5 h-3.5" aria-hidden />)}
      </div>

      {p.offersError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
          {p.offersError}
        </div>
      )}

      <div className={`space-y-3 transition-opacity ${p.offersLoading ? 'opacity-60' : ''}`}>
        {p.applied ? (
          <div role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-base font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden />
              Application submitted to {p.applied}
            </div>
            <div className="text-sm leading-relaxed">
              Your balance transfer request for {fmtINR(loan.outstanding)} over {tenure} months is with the lender. We&apos;ll keep you posted — you can track it any time.
            </div>
            <Link href="/balance-transfer" className="btn-primary w-full sm:w-auto">
              Track My Application
              <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </Link>
          </div>
        ) : offer ? (
          <OfferCard offer={offer} tenure={tenure} applying={p.applying === offer.lenderId} disabled={!!p.applying || p.offersLoading} error={p.applyError} onApply={() => p.onApply(offer)} />
        ) : (
          <div className="card-fintech p-5 text-sm text-slate-600 text-center">
            {p.offersLoading ? 'Loading offers…' : `No ${p.tab === 'bank' ? 'bank' : 'NBFC'} offers match this loan right now. Try the other tab or a different tenure.`}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
        <div>
          <div className="font-semibold uppercase tracking-wider mb-1">Before You Switch</div>
          <div className="leading-relaxed">
            Check your current lender&apos;s foreclosure charge (usually 2–4% of outstanding) and the new lender&apos;s processing fee (0.5–2%). Net savings = interest saved − both charges.
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer, tenure, applying, disabled, error, onApply }: { offer: Offer; tenure: number; applying: boolean; disabled: boolean; error: string | null; onApply: () => void }) {
  const emi = Math.round(offer.estimatedEmiRupees);
  return (
    <div className="card-fintech p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: brandColor(offer) }} aria-hidden>
          {offer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-slate-900">{offer.name}</div>
            <span className="badge-emerald">BEST MATCH ✓</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {offer.type === 'bank' ? 'Bank' : 'NBFC'} · {tenure} months tenure
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{fmtRate(offer.offeredRatePercent)}%</div>
          <div className="text-[11px] text-slate-500">p.a.</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 min-w-0">
          <div className="text-[11px] font-medium text-emerald-700 uppercase">Monthly EMI</div>
          <div className="text-base font-bold text-emerald-600 tabular-nums">₹{emi.toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 min-w-0">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Processing</div>
          <div className="text-base font-bold text-slate-900 tabular-nums">{fmtINR(offer.processingFeeRupees)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 min-w-0">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Disbursal</div>
          <div className="text-base font-bold text-slate-900">{disbursalText(offer)}</div>
        </div>
      </div>
      {offer.meetsMinimumScore === false && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
          <span>
            {offer.name} usually looks for a credit score of {offer.minCreditScore}+. You can still apply — the lender makes the final decision.
          </span>
        </div>
      )}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3">
        <Lock className="w-4 h-4 shrink-0" aria-hidden />
        <span>Your data is shared securely with {offer.name} only after you apply. No impact on your credit score.</span>
      </div>
      <button type="button" onClick={onApply} disabled={disabled} className="btn-accent w-full disabled:opacity-70">
        {applying ? (
          'Submitting…'
        ) : (
          <>
            Apply Now
            <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
          </>
        )}
      </button>
      {error && (
        <div role="alert" className="text-xs font-medium text-rose-600 text-center">
          {error}
        </div>
      )}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden />
        Applying with {offer.name} · Lowest rate match · ₹{emi.toLocaleString('en-IN')}/mo
      </div>
    </div>
  );
}

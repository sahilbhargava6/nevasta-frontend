'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowRight, Briefcase, Building2, CheckCircle2, ChevronDown, CreditCard, Home, Landmark, Loader2, Lock, MapPin, Store, Wallet } from 'lucide-react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { api } from '@/lib/api';
import { applyForCards, fetchOffers, journeyRunId, type Offer } from '@/lib/applyOffer';
import { detailKey, trackStep } from '@/lib/track';
import { combineCards } from '@/lib/ccPlanMath';
import { DEFAULT_CC_JOURNEY, DEFAULT_PROFILE, estimateCreditScore, fmtINR, useJourney, type EligibilityProfile } from '@/lib/journey';
import { isValidPincode, pincodeHint, usePincodeLookup } from '@/lib/pincodes';

/* Offer-match wizard — design #cc-offer-match-page (prototype lines ~10763–11095, JS ~10279–10759),
   plus the "See all offers" list from #cc-loan-offers-page (~6543–6623). */

const AMT_MIN = 10000;
const AMT_MAX = 500000;
const clampAmt = (v: number) => Math.min(AMT_MAX, Math.max(AMT_MIN, Math.round(v) || AMT_MIN));
const clampTenure = (v: number) => Math.min(60, Math.max(6, Math.round(v) || 48));

const inputCls =
  'w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';
const smallInputCls =
  'px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 text-right tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';
const errCls = 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500';
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

export default function CCOffersPage() {
  return (
    <JourneyGate intent="debt-cc">
      <Suspense fallback={null}>
        <OfferMatch />
      </Suspense>
    </JourneyGate>
  );
}

type Errors = Partial<Record<'address' | 'pincode' | 'city' | 'education' | 'sector' | 'loanNeed', string>>;

function OfferMatch() {
  const router = useRouter();
  const params = useSearchParams();
  const [cc, , , ccReady] = useJourney('cc', DEFAULT_CC_JOURNEY);
  const [profile, updateProfile, , profileReady] = useJourney<EligibilityProfile>('profile', DEFAULT_PROFILE);
  const combined = useMemo(() => combineCards(cc.cards), [cc.cards]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<'checking' | 'results'>('checking');

  const initialTenure = clampTenure(Number(params.get('tenure')) || 48);
  const [amount, setAmount] = useState(AMT_MIN);
  const [amountText, setAmountText] = useState('');
  const [tenure, setTenure] = useState(initialTenure);
  const [tenureText, setTenureText] = useState(String(initialTenure));

  const [score, setScore] = useState<{ score: number; estimated: boolean } | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [listTab, setListTab] = useState<'bank' | 'nbfc'>('bank');

  const [applying, setApplying] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ name: string; count: number } | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const go = (n: 1 | 2 | 3) => {
    setStep(n);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const onBack = () => {
    if (step === 3) go(2);
    else if (step === 2) go(1);
    else router.push('/journey/credit-card/switch-to-loan');
  };

  // ---- Step 2 helpers ----
  // Verified with MapmyIndia (India Post backup); fills city/state when found
  const pinCheck = usePincodeLookup(profile.pincode, (info) =>
    updateProfile((p) => ({ ...p, city: !p.city.trim() || p.state !== info.state ? info.city : p.city, state: info.state || p.state })),
  );
  const pinInfo = pinCheck.status === 'verified' ? pinCheck.info : null;
  const pinHint = pincodeHint(pinCheck.status, pinCheck.info);
  const onPincode = (raw: string) => {
    const pincode = raw.replace(/\D/g, '').slice(0, 6);
    updateProfile((p) => ({ ...p, pincode }));
    if (errors.pincode) setErrors((e) => ({ ...e, pincode: undefined }));
  };

  const baseAmount = combined.outstanding > 0 ? combined.outstanding : 80000;

  const runEligibility = () => {
    const e: Errors = {};
    if (!profile.address.trim()) e.address = 'Please enter your full address.';
    if (!isValidPincode(profile.pincode)) e.pincode = 'Please enter a valid 6-digit pincode.';
    else if (pinCheck.status === 'not_found') e.pincode = "We couldn't find this pincode. Please check it.";
    else if (pinCheck.status === 'checking') e.pincode = 'Still checking your pincode. Please try again in a moment.';
    if (!profile.city.trim()) e.city = 'Please enter your city.';
    if (!profile.education) e.education = 'Please select your highest education level.';
    if (!profile.sector) e.sector = 'Please select your working sector (Salaried or Self Employed).';
    if (!profile.loanNeed) e.loanNeed = 'Please select your loan requirement.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const wanted = profile.loanNeed === 'more' ? (profile.extraAmount > baseAmount ? Math.min(profile.extraAmount, AMT_MAX) : baseAmount) : baseAmount;
    const amt = clampAmt(wanted);
    setAmount(amt);
    setAmountText(String(amt));
    setPhase('checking');
    setShowAll(false);
    setApplyError(null);
    setApplied(null);
    go(3);

    const minWait = new Promise((r) => setTimeout(r, 2000));
    const scoreReq = api
      .get('/users/me')
      .then((res: any) => (typeof res?.data?.creditScore === 'number' ? res.data.creditScore : null))
      .catch(() => null);
    setLoadingOffers(true);
    const offersReq = fetchOffers(amt, tenure)
      .then((list) => {
        setOffers(list);
        setOffersError(null);
      })
      .catch((err: Error) => {
        setOffers(null);
        setOffersError(err.message || 'Could not load offers.');
      })
      .finally(() => setLoadingOffers(false));

    Promise.all([scoreReq, offersReq, minWait]).then(([onFile]) => {
      setScore(estimateCreditScore(profile, onFile as number | null));
      setPhase('results');
      trackStep('credit_card', 'offers_shown');
    });
  };

  // Re-match offers when the loan amount or tenure changes on the results screen
  const firstFetch = useRef(true);
  useEffect(() => {
    if (step !== 3 || phase !== 'results') {
      firstFetch.current = true;
      return;
    }
    if (firstFetch.current) {
      firstFetch.current = false;
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      setLoadingOffers(true);
      fetchOffers(amount, tenure)
        .then((list) => {
          if (!live) return;
          setOffers(list);
          setOffersError(null);
        })
        .catch((err: Error) => {
          if (!live) return;
          setOffersError(err.message || 'Could not load offers.');
        })
        .finally(() => live && setLoadingOffers(false));
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [amount, tenure, step, phase]);

  const retryOffers = () => {
    setLoadingOffers(true);
    fetchOffers(amount, tenure)
      .then((list) => {
        setOffers(list);
        setOffersError(null);
      })
      .catch((err: Error) => setOffersError(err.message || 'Could not load offers.'))
      .finally(() => setLoadingOffers(false));
  };

  const qualifies = (o: Offer) => (o.meetsMinimumScore === null || score?.estimated ? (score ? score.score >= o.minCreditScore : false) : o.meetsMinimumScore);
  const eligible = (offers ?? []).filter(qualifies);
  const bestOffer = eligible[0] ?? null;
  const lowestMinScore = offers && offers.length ? Math.min(...offers.map((o) => o.minCreditScore)) : null;

  const apply = async (offer: Offer) => {
    setApplyError(null);
    setApplying(offer.lenderId);
    try {
      const apps = await applyForCards(cc.cards, offer.lenderId, tenure, journeyRunId());
      if (!apps.length) throw new Error('Add your card balance first — there is no outstanding amount to transfer.');
      setApplied({ name: offer.name, count: apps.length });
      trackStep('credit_card', 'applied', detailKey(offer.name));
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Could not submit your application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  if (!ccReady || !profileReady) return null;

  const pinHintClass =
    pinCheck.status === 'verified' ? 'text-emerald-700' : pinCheck.status === 'not_found' ? 'text-rose-600' : pinCheck.status === 'unavailable' ? 'text-amber-700' : 'text-slate-500';

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader onBack={onBack} />

      <main className={`${step === 3 && phase === 'results' ? 'max-w-3xl' : 'max-w-xl'} mx-auto px-4 sm:px-6 py-8 space-y-6`}>
        {/* Progress (steps 1–2) */}
        {step <= 2 && (
          <div aria-label={`Step ${step} of 2`}>
            <span className="badge-blue">STEP {step} OF 2 — {step === 1 ? 'YOUR HOME' : 'YOUR DETAILS'}</span>
            <div className="mt-3 flex gap-1.5" aria-hidden>
              {[1, 2].map((d) => (
                <div key={d} className={`h-1.5 flex-1 rounded-full transition-all ${d <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Property + inline rent ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                <Home className="w-4 h-4" aria-hidden /> Eligibility
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Do you own or rent your home?</h1>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">Property ownership affects your eligibility and the rates lenders will offer you.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ChoiceCard selected={profile.housing === 'own'} onClick={() => updateProfile({ housing: 'own' })} icon={<Home className="w-5 h-5" />} title="Own" sub="Property in my name or family-owned" />
              <ChoiceCard selected={profile.housing === 'rent'} onClick={() => updateProfile({ housing: 'rent' })} icon={<Building2 className="w-5 h-5" />} title="Rent" sub="Currently in rented accommodation" />
            </div>

            {profile.housing === 'rent' && (
              <div className="card-fintech p-5">
                <label htmlFor="com-rent-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Rent Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                  <input
                    id="com-rent-input"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="e.g. 18000"
                    value={profile.rent ?? ''}
                    onChange={(e) => updateProfile({ rent: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}
                    className={`${inputCls} pl-7`}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">This goes into your debt-to-income calculation</p>
              </div>
            )}

            {profile.housing && (
              <button
                type="button"
                onClick={() => {
                  if (profile.housing === 'own') updateProfile({ rent: null });
                  go(2);
                }}
                className="btn-accent w-full sm:w-auto"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
              </button>
            )}
          </div>
        )}

        {/* ── Step 2: Address ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4" aria-hidden /> Address
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Where do you live?</h1>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">We use this to surface lenders active in your area and for your loan application.</p>
            </div>

            <div className="card-fintech p-5 sm:p-6 space-y-4">
              <div>
                <label htmlFor="com-address-input" className={labelCls}>
                  Full Address
                </label>
                <textarea
                  id="com-address-input"
                  rows={2}
                  placeholder="Flat / House No., Street, Area…"
                  value={profile.address}
                  onChange={(e) => {
                    updateProfile({ address: e.target.value });
                    if (errors.address) setErrors((x) => ({ ...x, address: undefined }));
                  }}
                  aria-invalid={!!errors.address}
                  className={`${inputCls} resize-none ${errors.address ? errCls : ''}`}
                />
                <FieldError msg={errors.address} />
              </div>

              <div>
                <label htmlFor="com-pincode-input" className={labelCls}>
                  Pincode
                </label>
                <input
                  id="com-pincode-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="e.g. 400001"
                  value={profile.pincode}
                  onChange={(e) => onPincode(e.target.value)}
                  aria-invalid={!!errors.pincode}
                  className={`${inputCls} tabular-nums tracking-widest ${errors.pincode ? errCls : ''}`}
                />
                <FieldError msg={errors.pincode} />
                {!errors.pincode && pinHint && (
                  <p role="status" className={`text-xs mt-1 ${pinHintClass}`}>
                    {pinHint.text}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label htmlFor="com-city-input" className={labelCls}>
                    City
                  </label>
                  <input
                    id="com-city-input"
                    type="text"
                    placeholder="Mumbai"
                    value={profile.city}
                    onChange={(e) => {
                      updateProfile({ city: e.target.value });
                      if (errors.city) setErrors((x) => ({ ...x, city: undefined }));
                    }}
                    aria-invalid={!!errors.city}
                    className={`${inputCls} ${errors.city ? errCls : ''}`}
                  />
                  <FieldError msg={errors.city} />
                </div>
                <div className="min-w-0">
                  <label htmlFor="com-state-input" className={labelCls}>
                    State <span className="font-normal text-slate-400">(auto)</span>
                  </label>
                  <input
                    id="com-state-input"
                    type="text"
                    placeholder="Auto-filled"
                    readOnly={!!pinInfo}
                    value={profile.state}
                    onChange={(e) => updateProfile({ state: e.target.value })}
                    className={`${inputCls} ${pinInfo ? 'bg-slate-100 text-slate-600 cursor-default' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="com-edu-select" className={labelCls}>
                  Highest Education Level
                </label>
                <div className="relative">
                  <select
                    id="com-edu-select"
                    value={profile.education}
                    onChange={(e) => {
                      updateProfile({ education: e.target.value });
                      if (errors.education) setErrors((x) => ({ ...x, education: undefined }));
                    }}
                    aria-invalid={!!errors.education}
                    className={`${inputCls} appearance-none pr-9 cursor-pointer ${errors.education ? errCls : ''}`}
                  >
                    <option value="">Select your education level</option>
                    <option value="10th">10th / SSC</option>
                    <option value="12th">12th / HSC</option>
                    <option value="graduate">Graduate</option>
                    <option value="postgraduate">Post Graduate</option>
                    <option value="professional">Professional (CA / CFA / Doctor)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                </div>
                <FieldError msg={errors.education} />
              </div>

              <div role="group" aria-labelledby="com-sector-label">
                <div id="com-sector-label" className={labelCls}>
                  Working Sector
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ChoiceCard
                    small
                    selected={profile.sector === 'salaried'}
                    onClick={() => {
                      updateProfile({ sector: 'salaried' });
                      setErrors((x) => ({ ...x, sector: undefined }));
                    }}
                    icon={<Briefcase className="w-5 h-5" />}
                    title="Salaried"
                    sub="Fixed monthly income"
                  />
                  <ChoiceCard
                    small
                    selected={profile.sector === 'self'}
                    onClick={() => {
                      updateProfile({ sector: 'self' });
                      setErrors((x) => ({ ...x, sector: undefined }));
                    }}
                    icon={<Store className="w-5 h-5" />}
                    title="Self Employed"
                    sub="Business / Freelance"
                  />
                </div>
                <FieldError msg={errors.sector} />
              </div>

              <div role="group" aria-labelledby="com-need-label">
                <div id="com-need-label" className={labelCls}>
                  Loan Requirement
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ChoiceCard
                    small
                    selected={profile.loanNeed === 'balance'}
                    onClick={() => {
                      updateProfile({ loanNeed: 'balance' });
                      setErrors((x) => ({ ...x, loanNeed: undefined }));
                    }}
                    icon={<CreditCard className="w-5 h-5" />}
                    title="Card Balance Only"
                    sub={combined.outstanding > 0 ? `Clear ${fmtINR(combined.outstanding)} outstanding` : 'Clear card outstanding'}
                  />
                  <ChoiceCard
                    small
                    selected={profile.loanNeed === 'more'}
                    onClick={() => {
                      updateProfile({ loanNeed: 'more' });
                      setErrors((x) => ({ ...x, loanNeed: undefined }));
                    }}
                    icon={<Wallet className="w-5 h-5" />}
                    title="Need More Funds"
                    sub="Additional top-up"
                  />
                </div>
                <FieldError msg={errors.loanNeed} />

                {profile.loanNeed === 'more' && (
                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <label htmlFor="com-extra-amt-input" className={labelCls}>
                      Total Loan Amount Needed
                    </label>
                    <div className="relative mb-3">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                      <input
                        id="com-extra-amt-input"
                        type="number"
                        min={AMT_MIN}
                        max={AMT_MAX}
                        step={5000}
                        inputMode="numeric"
                        value={profile.extraAmount}
                        onChange={(e) => updateProfile({ extraAmount: Number(e.target.value) || 0 })}
                        onBlur={() => updateProfile({ extraAmount: clampAmt(profile.extraAmount) })}
                        className={`${inputCls} pl-7 tabular-nums`}
                      />
                    </div>
                    <input
                      type="range"
                      min={AMT_MIN}
                      max={AMT_MAX}
                      step={5000}
                      aria-label="Total loan amount needed"
                      value={clampAmt(profile.extraAmount)}
                      onChange={(e) => updateProfile({ extraAmount: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-500">₹10,000</span>
                      <span className="text-xs text-slate-500">Max ₹5,00,000</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Subject to lender approval</p>
                  </div>
                )}
              </div>
            </div>

            {Object.values(errors).some(Boolean) && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                Please complete the highlighted fields.
              </div>
            )}

            <button type="button" onClick={runEligibility} className="btn-accent w-full sm:w-auto">
              Check my eligibility <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </button>
          </div>
        )}

        {/* ── Step 3: Eligibility check + results ── */}
        {step === 3 && phase === 'checking' && (
          <div role="status" aria-live="polite" className="card-fintech p-8 sm:p-12 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-5" aria-hidden />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Finding your best offer…</h1>
            <p className="text-sm text-slate-600">Matching your profile with lender criteria</p>
          </div>
        )}

        {step === 3 && phase === 'results' && score && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" aria-hidden /> Results
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your Best Matched Offer</h1>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">Based on your credit profile &amp; loan requirement</p>
            </div>

            <ScoreCard score={score.score} estimated={score.estimated} lowestRate={offers && offers.length ? offers[0].offeredRatePercent : null} />

            {/* Loan summary */}
            <div className="card-fintech p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3.5">Your Loan Details</h2>
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" aria-hidden />
                <div>
                  <div className="text-xs font-medium text-slate-500">Loan Purpose</div>
                  <div className="text-sm font-semibold text-slate-900">{profile.loanNeed === 'more' ? 'Balance Transfer + Extra Funds' : 'Card Balance Transfer Only'}</div>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between items-center mb-2 gap-3">
                  <label htmlFor="com-amt-input" className="text-xs font-semibold text-slate-700">
                    Loan Amount
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-500">₹</span>
                    <input
                      id="com-amt-input"
                      type="number"
                      min={AMT_MIN}
                      max={AMT_MAX}
                      step={5000}
                      inputMode="numeric"
                      value={amountText}
                      onChange={(e) => {
                        setAmountText(e.target.value);
                        const v = Number(e.target.value);
                        if (v >= AMT_MIN && v <= AMT_MAX) setAmount(Math.round(v));
                      }}
                      onBlur={() => {
                        const v = clampAmt(Number(amountText));
                        setAmount(v);
                        setAmountText(String(v));
                      }}
                      className={`${smallInputCls} w-28`}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={AMT_MIN}
                  max={AMT_MAX}
                  step={5000}
                  aria-label="Loan amount"
                  value={amount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setAmount(v);
                    setAmountText(String(v));
                  }}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-500">₹10,000</span>
                  <span className="text-xs text-slate-500">₹5,00,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 gap-3">
                  <label htmlFor="com-tenure-input" className="text-xs font-semibold text-slate-700">
                    Tenure
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="com-tenure-input"
                      type="number"
                      min={6}
                      max={60}
                      step={6}
                      inputMode="numeric"
                      value={tenureText}
                      onChange={(e) => {
                        setTenureText(e.target.value);
                        const v = Number(e.target.value);
                        if (v >= 6 && v <= 60) setTenure(Math.round(v));
                      }}
                      onBlur={() => {
                        const v = clampTenure(Number(tenureText));
                        setTenure(v);
                        setTenureText(String(v));
                      }}
                      className={`${smallInputCls} w-20`}
                    />
                    <span className="text-sm font-medium text-slate-500">months</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={6}
                  max={60}
                  step={6}
                  aria-label="Tenure in months"
                  value={tenure}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setTenure(v);
                    setTenureText(String(v));
                  }}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-500">6 mo</span>
                  <span className="text-xs text-slate-500">60 mo</span>
                </div>
              </div>
            </div>

            {/* Eligibility banner — only when an offer actually matches the score */}
            {offers && offers.length > 0 && (
              bestOffer ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <div className="text-base font-semibold mb-1">You&apos;re eligible for our best offers!</div>
                    <div className="text-sm leading-relaxed">
                      Your credit profile meets {eligible.length === 1 ? '1 partner lender’s' : `${eligible.length} partner lenders’`} minimum score. Apply in minutes — no branch visit needed.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <div className="text-base font-semibold mb-1">No offer matches your score yet</div>
                    <div className="text-sm leading-relaxed">
                      Our partner lenders ask for a credit score of at least {lowestMinScore}
                      {score.estimated ? ' (yours above is an estimate — the lender checks your actual bureau score)' : ''}. You can still compare their offers below and apply — the lender makes the final decision.
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Matched offers */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                Matched Offers {loadingOffers && <Loader2 className="w-3.5 h-3.5 animate-spin" role="img" aria-label="Updating offers" />}
              </div>

              {offersError ? (
                <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 leading-relaxed">
                  {offersError}{' '}
                  <button type="button" onClick={retryOffers} className="font-semibold underline">
                    Try again
                  </button>
                </div>
              ) : offers && offers.length === 0 ? (
                <div className="card-fintech p-4 text-sm text-slate-600 leading-relaxed">
                  We couldn&apos;t find a partner offer for {fmtINR(amount)} over {tenure} months right now. Try a different amount or tenure, or{' '}
                  <Link href="/contact" className="font-semibold text-blue-600 hover:text-blue-700">
                    talk to us
                  </Link>
                  .
                </div>
              ) : bestOffer ? (
                <BestMatchCard offer={bestOffer} amount={amount} tenure={tenure} />
              ) : null}
            </div>

            {/* Success / Apply */}
            {applied ? (
              <div ref={successRef} role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2" aria-hidden />
                <div className="text-base font-semibold mb-2">Application submitted to {applied.name}</div>
                <div className="text-sm leading-relaxed mb-4">
                  {applied.count > 1 ? `We sent ${applied.count} balance-transfer requests (one per card). ` : ''}The lender will review your profile and confirm your final rate. You can track it in My Applications.
                </div>
                <Link href="/balance-transfer" className="btn-accent">
                  Go to My Applications <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
                </Link>
              </div>
            ) : (
              bestOffer && (
                <div>
                  <button type="button" onClick={() => apply(bestOffer)} disabled={!!applying} className="btn-accent w-full py-3 text-base">
                    {applying === bestOffer.lenderId ? 'Submitting…' : 'Apply Now'}
                    {applying !== bestOffer.lenderId && <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />}
                  </button>
                  <div className="text-center mt-2.5 text-xs text-slate-500">
                    Applying with {bestOffer.name} · Lowest rate match · {fmtINR(bestOffer.estimatedEmiRupees)}/mo
                  </div>
                </div>
              )
            )}

            {applyError && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3">
                {applyError}
              </div>
            )}

            {/* See all offers */}
            {offers && offers.length > (bestOffer ? 1 : 0) && !applied && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!showAll) setListTab(offers.some((o) => o.type === 'bank') ? 'bank' : 'nbfc');
                    setShowAll((v) => !v);
                  }}
                  aria-expanded={showAll}
                  className="btn-secondary w-full"
                >
                  {showAll ? 'Hide all offers' : `See all offers (${offers.length})`}
                  <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform ${showAll ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {showAll && (
                  <AllOffers offers={offers} tab={listTab} setTab={setListTab} cardRate={combined.rate} qualifies={qualifies} applying={applying} onApply={apply} />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div role="alert" className="text-xs font-medium text-rose-600 mt-1">
      {msg}
    </div>
  );
}

function ChoiceCard({ selected, onClick, icon, title, sub, small = false }: { selected: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border-2 text-left transition-all cursor-pointer ${small ? 'p-3.5' : 'p-4'} ${
        selected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className={`mb-2 ${selected ? 'text-blue-600' : 'text-slate-500'}`} aria-hidden>
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="text-xs text-slate-500 leading-snug mt-0.5">{sub}</div>
    </button>
  );
}

/* ---------- Credit score speedometer (design comDrawGauge) ---------- */

function bandFor(score: number, lowestRate: number | null) {
  const from = lowestRate !== null ? ` and rates starting at ${lowestRate}% p.a.` : '';
  if (score >= 800) return { band: 'Excellent', cls: 'text-emerald-600', msg: 'Outstanding credit history! You qualify for the best rates and maximum loan amounts from our lending partners.' };
  if (score >= 750) return { band: 'Very Good', cls: 'text-emerald-600', msg: `Strong credit profile — you're pre-matched with premium partner offers${from}.` };
  if (score >= 700) return { band: 'Good', cls: 'text-blue-600', msg: 'Your score clears the 700 threshold that unlocks NBFC lending. Great news — you have real options below.' };
  if (score >= 650) return { band: 'Fair', cls: 'text-amber-600', msg: 'Your score is in the fair range. Select NBFCs with flexible criteria can still work with your profile.' };
  return { band: 'Needs Improvement', cls: 'text-rose-600', msg: 'Your score is below most lender thresholds. Focus on timely payments and reducing utilisation to improve it.' };
}

function ScoreCard({ score, estimated, lowestRate }: { score: number; estimated: boolean; lowestRate: number | null }) {
  const [shown, setShown] = useState(300);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const duration = 1400;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setShown(300 + (score - 300) * ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const cx = 150;
  const cy = 145;
  const needleR = 90;
  const clamped = Math.min(900, Math.max(300, shown));
  const rad = ((180 - ((clamped - 300) / 600) * 180) * Math.PI) / 180;
  const nx = (cx + needleR * Math.cos(rad)).toFixed(1);
  const ny = (cy - needleR * Math.sin(rad)).toFixed(1);
  const { band, cls, msg } = bandFor(score, lowestRate);
  const font = { fontFamily: 'Inter,sans-serif' };

  return (
    <div className="card-fintech p-5 sm:p-6 text-center">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{estimated ? 'Your Estimated Credit Score' : 'Your Credit Score'}</div>
      <span className={`${estimated ? 'badge-amber' : 'badge-emerald'} mb-3`}>{estimated ? 'Estimated' : 'On file'}</span>
      <svg viewBox="0 0 300 210" role="img" aria-label={`${estimated ? 'Estimated credit score' : 'Credit score'} ${score} out of 900, ${band}`} className="w-full max-w-[290px] block mx-auto">
        <path d="M 85 145 L 35 145 A 115 115 0 0 1 137.2 30.7 L 142.8 80.4 A 65 65 0 0 0 85 145 Z" fill="#F43F5E" />
        <path d="M 142.8 80.4 L 137.2 30.7 A 115 115 0 0 1 206.9 45.1 L 182.2 88.5 A 65 65 0 0 0 142.8 80.4 Z" fill="#F59E0B" />
        <path d="M 182.2 88.5 L 206.9 45.1 A 115 115 0 0 1 242.7 76.9 L 202.4 106.5 A 65 65 0 0 0 182.2 88.5 Z" fill="#3B82F6" />
        <path d="M 202.4 106.5 L 242.7 76.9 A 115 115 0 0 1 265 145 L 215 145 A 65 65 0 0 0 202.4 106.5 Z" fill="#10B981" />
        {[
          [35, 145],
          [137.2, 30.7],
          [206.9, 45.1],
          [242.7, 76.9],
          [265, 145],
        ].map(([x, y]) => (
          <line key={`${x}-${y}`} x1="150" y1="145" x2={x} y2={y} stroke="white" strokeWidth="2.5" />
        ))}
        <text x="82.9" y="87.1" textAnchor="middle" fontSize="8" fontWeight="900" fill="white" letterSpacing="0.8" transform="rotate(-48,82.9,83.1)" {...font}>
          POOR
        </text>
        <text x="168.2" y="56.9" textAnchor="middle" fontSize="8" fontWeight="900" fill="white" letterSpacing="0.8" transform="rotate(12,168.2,56.9)" {...font}>
          FAIR
        </text>
        <text x="209.8" y="77.8" textAnchor="middle" fontSize="8" fontWeight="900" fill="white" letterSpacing="0.8" transform="rotate(42,209.8,77.8)" {...font}>
          GOOD
        </text>
        <text x="234" y="117" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="white" letterSpacing="0.8" transform="rotate(71,234,117)" {...font}>
          EXCELLENT
        </text>
        <circle cx="150" cy="145" r="63" fill="white" />
        <line x1="150" y1="145" x2={nx} y2={ny} stroke="white" strokeWidth="6" strokeLinecap="round" />
        <line x1="150" y1="145" x2={nx} y2={ny} stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="150" cy="145" r="16" fill="white" />
        <circle cx="150" cy="145" r="13" fill="#0F172A" />
        <circle cx="150" cy="145" r="6.5" fill="white" />
        <circle cx="150" cy="145" r="3" fill="#0F172A" />
        <text x="28" y="161" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748B" {...font}>
          300
        </text>
        <text x="272" y="161" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748B" {...font}>
          900
        </text>
        <text x="150" y="181" textAnchor="middle" fontSize="44" fontWeight="700" fill="#0F172A" {...font}>
          {Math.round(shown)}
        </text>
        <text x="150" y="198" textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748B" letterSpacing="2" {...font}>
          {estimated ? 'ESTIMATED' : 'CREDIT SCORE'}
        </text>
      </svg>
      <div className={`text-2xl font-bold mt-0.5 leading-tight ${cls}`}>{band}</div>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed px-2">{msg}</p>
      <div className="mt-3.5 inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 leading-snug">
        {estimated ? 'Estimated from your answers — the lender checks your bureau score' : 'From the credit report on your account'}
      </div>
    </div>
  );
}

/* ---------- Offer cards ---------- */

function LenderMark({ offer }: { offer: Offer }) {
  const bg = offer.brandColor || '#2563EB';
  return (
    <div
      aria-hidden
      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0 tracking-wide ${offer.initials.length > 3 ? 'text-[10px]' : 'text-sm'}`}
      style={{ background: bg }}
    >
      {offer.initials}
    </div>
  );
}

const disbursal = (o: Offer) => (o.disbursalDaysMin === o.disbursalDaysMax ? `${o.disbursalDaysMin} day${o.disbursalDaysMin === 1 ? '' : 's'}` : `${o.disbursalDaysMin}–${o.disbursalDaysMax} days`);

function BestMatchCard({ offer, amount, tenure }: { offer: Offer; amount: number; tenure: number }) {
  return (
    <div className="card-fintech p-5 border-2 border-emerald-500">
      <div className="flex items-start gap-3.5 mb-4">
        <LenderMark offer={offer} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-slate-900 break-words">{offer.name}</div>
            <span className="badge-emerald">BEST MATCH ✓</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Up to {fmtINR(amount)} · {tenure} months tenure
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{offer.offeredRatePercent}%</div>
          <div className="text-[11px] text-slate-500 -mt-0.5">p.a.</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Monthly EMI" value={fmtINR(offer.estimatedEmiRupees)} highlight />
        <Stat label="Processing" value={fmtINR(offer.processingFeeRupees)} />
        <Stat label="Disbursal" value={disbursal(offer)} />
      </div>
      <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 flex gap-2 items-start">
        <Lock className="w-4 h-4 shrink-0 mt-px" aria-hidden />
        <span className="leading-relaxed">Your data is shared securely with {offer.name} only after you apply. Checking offers has no impact on your credit score.</span>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 text-center min-w-0 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`text-[11px] font-medium mb-1 ${highlight ? 'text-blue-700' : 'text-slate-500'}`}>{label}</div>
      <div className={`text-sm font-bold break-words tabular-nums ${highlight ? 'text-blue-800' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function AllOffers(props: {
  offers: Offer[];
  tab: 'bank' | 'nbfc';
  setTab: (t: 'bank' | 'nbfc') => void;
  cardRate: number;
  qualifies: (o: Offer) => boolean;
  applying: string | null;
  onApply: (o: Offer) => void;
}) {
  const { offers, tab, setTab, cardRate, qualifies, applying, onApply } = props;
  const list = offers.filter((o) => o.type === tab);
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Lender type" className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        {(['bank', 'nbfc'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
              tab === t ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'bank' ? <Landmark className="w-3.5 h-3.5" aria-hidden /> : <Building2 className="w-3.5 h-3.5" aria-hidden />}
            {t === 'bank' ? 'Banks' : 'NBFCs'}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">
        {tab === 'bank'
          ? 'Banks typically offer lower rates and stricter eligibility. Stable income and low existing EMIs help most.'
          : 'NBFCs are more flexible on credit score but charge slightly higher rates. Good fallback if banks decline.'}
      </p>

      <div className="flex flex-col gap-4">
        {list.length === 0 && <div className="text-sm text-slate-500 text-center p-3">No {tab === 'bank' ? 'bank' : 'NBFC'} offers for this amount and tenure right now.</div>}
        {list.map((o) => {
          const diff = cardRate - o.offeredRatePercent;
          const ok = qualifies(o);
          return (
            <div key={o.lenderId} className="card-fintech p-5">
              <div className="flex items-start gap-3.5 flex-wrap">
                <LenderMark offer={o} />
                <div className="flex-1 min-w-[140px]">
                  <div className="font-semibold text-slate-900 mb-0.5">{o.name}</div>
                  <div className="text-sm font-bold text-slate-900">
                    @{o.offeredRatePercent}% <span className="font-normal text-slate-500">p.a.</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    EMI {fmtINR(o.estimatedEmiRupees)}/mo · Processing fee: {fmtINR(o.processingFeeRupees)}
                  </div>
                  {cardRate > 0 && diff > 0 && (
                    <span className={`${diff > 15 ? 'badge-emerald' : 'badge-amber'} mt-2`}>{diff > 15 ? '✓ Well below your card rate' : '✓ Below your card rate'}</span>
                  )}
                  {!ok && <div className="text-xs font-medium text-amber-700 mt-1.5">Usually asks for a credit score of {o.minCreditScore}+</div>}
                </div>
                <button type="button" onClick={() => onApply(o)} disabled={!!applying} className="btn-accent shrink-0">
                  {applying === o.lenderId ? 'Submitting…' : 'Apply'}
                  {applying !== o.lenderId && <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-fintech p-5">
        <div className="text-sm font-semibold text-slate-900 mb-2.5">How to compare offers</div>
        <div className="text-sm text-slate-600 leading-relaxed">
          1. Compare the final rate, not just the starting or estimated rate.
          <br />
          2. Check for processing fees (0.5–2% of loan amount).
          <br />
          3. Confirm there&apos;s no prepayment penalty if you want to close early.
        </div>
      </div>
    </div>
  );
}

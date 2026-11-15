'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, Building2, Check, ChevronDown, Home, Landmark, Loader2, Search, Store } from 'lucide-react';
import { DEFAULT_MULTI_JOURNEY, DEFAULT_PROFILE, fmtINR, useJourney } from '@/lib/journey';
import { isValidPincode, pincodeHint, usePincodeLookup } from '@/lib/pincodes';
import { fetchOffers, type Offer } from '@/lib/applyOffer';
import { consolidationSavings, fmtDcCompact, portfolioStats } from '@/lib/consolidationMath';
import ConsolidationShell from '../_components/ConsolidationShell';

/**
 * Design: #dc-eligibility-page, wizard rendered by dceRenderStep1 / dceRenderStep2
 * and the dcShowLoading screen.
 */

type Step = 1 | 2 | 'loading';
type FieldKey = 'rent' | 'pincode' | 'sector' | 'income';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';
const inputBase =
  'w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2';
const inputOk = 'border-slate-300 focus:ring-blue-600/20 focus:border-blue-600';
const inputErr = 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500';
const inputCls = (error: boolean, extra = '') => `${inputBase} ${error ? inputErr : inputOk} ${extra}`.trim();
const choiceCls = (selected: boolean, error = false) =>
  `w-full block rounded-xl border-2 p-4 text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 ${
    error ? 'border-rose-400 bg-white' : selected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white hover:border-slate-300'
  }`;
const errorCls = 'text-xs font-medium text-rose-600 mt-1';

const HINT_CLS: Record<string, string> = {
  checking: 'text-slate-500',
  verified: 'text-emerald-700',
  not_found: 'text-rose-600',
  unavailable: 'text-amber-700',
};

function Eyebrow() {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
      <Landmark className="w-4 h-4" aria-hidden /> Debt Consolidation
    </div>
  );
}

function Dots({ step }: { step: 1 | 2 }) {
  return (
    <div className="text-center" aria-label={`Step ${step} of 2`}>
      <div className="inline-flex gap-2 items-center">
        {[1, 2].map((d) => (
          <div key={d} className={`h-2 rounded-full transition-all ${d === step ? 'w-5 bg-blue-600' : d < step ? 'w-2 bg-blue-300' : 'w-2 bg-slate-300'}`} />
        ))}
      </div>
    </div>
  );
}

function CheckRow({ first, active, done, label, value }: { first?: boolean; active: boolean; done: boolean; label: string; value: string }) {
  return (
    <div className={`flex items-center gap-3.5 py-3 transition-opacity ${first ? '' : 'border-t border-slate-100'} ${active ? 'opacity-100' : 'opacity-40'}`}>
      {done ? (
        <div className="w-6 h-6 rounded-full shrink-0 bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Check className="w-3.5 h-3.5" aria-hidden />
        </div>
      ) : (
        <div className="w-6 h-6 shrink-0 flex items-center justify-center text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        </div>
      )}
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{done ? value : 'Checking…'}</div>
      </div>
    </div>
  );
}

export default function ConsolidationEligibilityPage() {
  const router = useRouter();
  const [multi, , , multiReady] = useJourney('multi', DEFAULT_MULTI_JOURNEY);
  const [profile, setProfile, , profileReady] = useJourney('profile', DEFAULT_PROFILE);
  const ready = multiReady && profileReady;
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, boolean>>>({});
  const timers = useRef<number[]>([]);

  const stats = portfolioStats(multi.debts);

  // Loading screen state
  const [phase, setPhase] = useState(0); // checks completed (0..3)
  const [timeUp, setTimeUp] = useState(false);
  const [offers, setOffers] = useState<Offer[] | null>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => {
    const t = timers;
    return () => t.current.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (ready && stats.totalOutstanding <= 0) router.replace('/journey/multiple');
  }, [ready, stats.totalOutstanding, router]);

  const flash = (field: FieldKey) => {
    setErrors((e) => ({ ...e, [field]: true }));
    later(() => setErrors((e) => ({ ...e, [field]: false })), 1500);
  };

  const goStep = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const onBack = () => {
    clearTimers();
    if (step === 'loading') goStep(2);
    else if (step === 2) goStep(1);
    else router.push('/journey/multiple/summary');
  };

  // ── Step 1 ──
  const selectHousing = (val: 'own' | 'rent') => {
    if (val === 'own') {
      setProfile({ housing: 'own', rent: null });
      later(() => goStep(2), 280);
    } else {
      setProfile({ housing: 'rent' });
    }
  };

  const continueFromRent = () => {
    if (!profile.rent || profile.rent <= 0) {
      flash('rent');
      return;
    }
    goStep(2);
  };

  // ── Step 2 ──
  // Verified with MapmyIndia (India Post backup); city/state are filled from it and
  // become editable only when the pincode can't be confirmed
  const pinCheck = usePincodeLookup(profile.pincode, (info) => setProfile({ city: info.city, state: info.state }));
  const unknownPin = pinCheck.status === 'not_found' || pinCheck.status === 'unavailable';
  const pinHint = pincodeHint(pinCheck.status, pinCheck.info);
  const pinError =
    pinCheck.status === 'not_found'
      ? "We couldn't find this pincode. Please check it."
      : pinCheck.status === 'checking'
        ? 'Still checking your pincode. Please try again in a moment.'
        : 'Please enter a valid 6-digit pincode.';

  const onPincode = (raw: string) => {
    setProfile({ pincode: raw.replace(/\D/g, '').slice(0, 6) });
  };

  const submitStep2 = () => {
    if (!isValidPincode(profile.pincode) || pinCheck.status === 'not_found' || pinCheck.status === 'checking') {
      flash('pincode');
      return;
    }
    if (!profile.sector) {
      flash('sector');
      return;
    }
    if (!profile.income || profile.income <= 0) {
      flash('income');
      return;
    }
    startLoading();
  };

  // ── Loading screen (dcShowLoading) ──
  const startLoading = () => {
    clearTimers();
    setPhase(0);
    setTimeUp(false);
    setOffers(null);
    goStep('loading');
    fetchOffers(stats.totalOutstanding, 36)
      .then(setOffers)
      .catch(() => setOffers([]));
    later(() => setPhase(1), 700);
    later(() => setPhase(2), 1400);
    later(() => setPhase(3), 2100);
    later(() => setTimeUp(true), 2800);
  };

  useEffect(() => {
    if (step === 'loading' && timeUp && offers !== null) router.push('/journey/multiple/plan');
  }, [step, timeUp, offers, router]);

  const best = offers?.[0];
  const savings36 = best ? consolidationSavings(stats.debts, best.offeredRatePercent, 36, best.estimatedEmiRupees) : 0;

  const salSel = profile.sector === 'salaried';
  const selfSel = profile.sector === 'self';

  return (
    <ConsolidationShell onBack={onBack}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {ready && step !== 'loading' && <Dots step={step} />}

        {ready && step === 1 && (
          <div className="space-y-6">
            <div>
              <Eyebrow />
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Do you own or rent your home?</h1>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Property ownership affects your eligibility and the rates lenders will offer you.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" aria-pressed={profile.housing === 'own'} className={choiceCls(profile.housing === 'own')} onClick={() => selectHousing('own')}>
                <Home className="w-7 h-7 mx-auto mb-3 text-blue-600" aria-hidden />
                <div className="text-base font-semibold text-slate-900 mb-1">Own</div>
                <div className="text-xs text-slate-500 leading-snug">Property in my name or family-owned</div>
              </button>
              <button type="button" aria-pressed={profile.housing === 'rent'} className={choiceCls(profile.housing === 'rent')} onClick={() => selectHousing('rent')}>
                <Building2 className="w-7 h-7 mx-auto mb-3 text-blue-600" aria-hidden />
                <div className="text-base font-semibold text-slate-900 mb-1">Rent</div>
                <div className="text-xs text-slate-500 leading-snug">Currently in rented accommodation</div>
              </button>
            </div>

            {profile.housing === 'rent' && (
              <div className="card-fintech p-5 sm:p-6">
                <label htmlFor="dce-rent" className={labelCls}>
                  Monthly Rent Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">₹</span>
                  <input
                    id="dce-rent"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    autoFocus
                    placeholder="e.g. 25000"
                    className={inputCls(!!errors.rent, 'pl-7')}
                    aria-invalid={errors.rent || undefined}
                    value={profile.rent || ''}
                    onChange={(e) => setProfile({ rent: parseFloat(e.target.value) || null })}
                    onKeyDown={(e) => e.key === 'Enter' && continueFromRent()}
                  />
                </div>
                {errors.rent && <div className={errorCls}>Please enter your monthly rent.</div>}
                <button type="button" onClick={continueFromRent} className="btn-accent w-full sm:w-auto mt-4">
                  Continue <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
                </button>
              </div>
            )}
          </div>
        )}

        {ready && step === 2 && (
          <div className="space-y-6">
            <div>
              <Eyebrow />
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Where do you live?</h1>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">We use this to surface lenders active in your area.</p>
            </div>

            <div className="card-fintech p-5 sm:p-6 space-y-4">
              <div>
                <label htmlFor="dce-address" className={labelCls}>
                  Full Address
                </label>
                <textarea
                  id="dce-address"
                  rows={2}
                  placeholder="Flat / House No., Street, Area…"
                  className={inputCls(false, 'resize-none')}
                  value={profile.address}
                  onChange={(e) => setProfile({ address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dce-pincode" className={labelCls}>
                    Pincode
                  </label>
                  <input
                    id="dce-pincode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    placeholder="e.g. 400001"
                    className={inputCls(!!errors.pincode)}
                    aria-invalid={errors.pincode || undefined}
                    value={profile.pincode}
                    onChange={(e) => onPincode(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="dce-city" className={labelCls}>
                    City
                  </label>
                  <input
                    id="dce-city"
                    type="text"
                    placeholder={unknownPin ? 'Enter city' : 'Auto-filled'}
                    readOnly={!unknownPin}
                    className={inputCls(false, unknownPin ? '' : 'text-slate-600')}
                    value={profile.city}
                    onChange={(e) => setProfile({ city: e.target.value })}
                  />
                </div>
              </div>
              {errors.pincode ? (
                <div role="alert" className={errorCls}>
                  {pinError}
                </div>
              ) : (
                pinHint && (
                  <div role="status" className={`text-xs ${HINT_CLS[pinCheck.status] ?? 'text-slate-500'}`}>
                    {pinHint.text}
                  </div>
                )
              )}

              <div>
                <label htmlFor="dce-state" className={labelCls}>
                  State
                </label>
                <input
                  id="dce-state"
                  type="text"
                  placeholder={unknownPin ? 'Enter state' : 'Auto-filled'}
                  readOnly={!unknownPin}
                  className={inputCls(false, unknownPin ? '' : 'text-slate-600')}
                  value={profile.state}
                  onChange={(e) => setProfile({ state: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="dce-edu" className={labelCls}>
                  Highest Education Level
                </label>
                <div className="relative">
                  <select
                    id="dce-edu"
                    className={inputCls(false, 'appearance-none pr-9 cursor-pointer')}
                    value={profile.education}
                    onChange={(e) => setProfile({ education: e.target.value })}
                  >
                    <option value="">Select your education level</option>
                    <option value="graduate">Graduate (B.A. / B.Sc. / B.Com / B.E.)</option>
                    <option value="postgrad">Post Graduate (M.A. / M.Sc. / MBA)</option>
                    <option value="doctorate">Doctorate / PhD</option>
                    <option value="diploma">Diploma / Vocational</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                </div>
              </div>
            </div>

            <div className="card-fintech p-5 sm:p-6 space-y-4">
              <div role="group" aria-labelledby="dce-sector-lbl">
                <div id="dce-sector-lbl" className={labelCls}>
                  Working Sector
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" aria-pressed={salSel} className={choiceCls(salSel, !!errors.sector)} onClick={() => setProfile({ sector: 'salaried' })}>
                    <Briefcase className="w-6 h-6 mx-auto mb-2 text-blue-600" aria-hidden />
                    <div className="text-sm font-semibold text-slate-900 mb-0.5">Salaried</div>
                    <div className="text-xs text-slate-500 leading-snug">Fixed monthly income</div>
                  </button>
                  <button type="button" aria-pressed={selfSel} className={choiceCls(selfSel, !!errors.sector)} onClick={() => setProfile({ sector: 'self' })}>
                    <Store className="w-6 h-6 mx-auto mb-2 text-blue-600" aria-hidden />
                    <div className="text-sm font-semibold text-slate-900 mb-0.5">Self Employed</div>
                    <div className="text-xs text-slate-500 leading-snug">Business / Freelance</div>
                  </button>
                </div>
                {errors.sector && <div className={errorCls}>Please choose your working sector.</div>}
              </div>

              {profile.sector && (
                <div>
                  <label htmlFor="dce-income" className={labelCls}>
                    {salSel ? 'Monthly Take-Home Salary' : 'Average Monthly Income'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">₹</span>
                    <input
                      id="dce-income"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="e.g. 75000"
                      className={inputCls(!!errors.income, 'pl-7')}
                      aria-invalid={errors.income || undefined}
                      value={profile.income || ''}
                      onChange={(e) => setProfile({ income: parseFloat(e.target.value) || null })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitStep2();
                        }
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {salSel ? 'Your net in-hand salary after all deductions' : 'Average net income per month from your business / freelance'}
                  </div>
                  {errors.income && <div className={errorCls}>Please enter your monthly income.</div>}
                </div>
              )}
            </div>

            <button type="button" onClick={submitStep2} className="btn-accent w-full sm:w-auto">
              Find My Consolidation Plan <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div aria-live="polite" className="space-y-6">
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse" aria-hidden>
                <Search className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Finding your consolidation plan…</h1>
              <div className="text-sm text-slate-600 mb-6">Matching your profile with lender criteria</div>
              <div className="flex justify-center items-center gap-2" aria-hidden>
                {[0, 0.2, 0.4].map((delay) => (
                  <div key={delay} className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            </div>
            <div className="card-fintech px-5 py-1">
              <CheckRow first active done={phase >= 1} label="Analysing your debt profile" value={`${fmtINR(stats.totalOutstanding)} outstanding`} />
              <CheckRow
                active={phase >= 1}
                done={phase >= 2 && offers !== null}
                label="Matching consolidation lenders"
                value={`${offers?.length ?? 0} lender${offers?.length === 1 ? '' : 's'} matched`}
              />
              <CheckRow
                active={phase >= 2}
                done={phase >= 3 && offers !== null}
                label="Calculating your savings"
                value={savings36 > 0 ? `Up to ${fmtDcCompact(savings36)} saveable` : 'Plan ready!'}
              />
            </div>
          </div>
        )}
      </main>
    </ConsolidationShell>
  );
}

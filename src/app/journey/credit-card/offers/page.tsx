'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { api } from '@/lib/api';
import { applyForCards, fetchOffers, journeyRunId, type Offer } from '@/lib/applyOffer';
import { combineCards } from '@/lib/ccPlanMath';
import { DEFAULT_CC_JOURNEY, DEFAULT_PROFILE, estimateCreditScore, fmtINR, useJourney, type EligibilityProfile } from '@/lib/journey';
import { isValidPincode, pincodeHint, usePincodeLookup } from '@/lib/pincodes';

/* Offer-match wizard — design #cc-offer-match-page (prototype lines ~10763–11095, JS ~10279–10759),
   plus the "See all offers" list from #cc-loan-offers-page (~6543–6623). */

const NAVY = '#1A2E3F';
const GREEN = '#059669';
const AMT_MIN = 10000;
const AMT_MAX = 500000;
const clampAmt = (v: number) => Math.min(AMT_MAX, Math.max(AMT_MIN, Math.round(v) || AMT_MIN));
const clampTenure = (v: number) => Math.min(60, Math.max(6, Math.round(v) || 48));

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(26,46,63,0.5)', textTransform: 'uppercase', marginBottom: 8 };
const fieldBorder = '1.5px solid rgba(196,168,130,0.4)';
const inputStyle: React.CSSProperties = { width: '100%', padding: 14, border: fieldBorder, borderRadius: 12, fontSize: 15, fontWeight: 600, color: NAVY, fontFamily: 'var(--sans)', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const primaryBtn: React.CSSProperties = { width: '100%', background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 14px rgba(5,150,105,0.3)' };

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
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Could not submit your application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  if (!ccReady || !profileReady) return null;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader onBack={onBack} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px', boxSizing: 'border-box' }}>
        {/* Progress dots (steps 1–2) */}
        {step <= 2 && (
          <div style={{ textAlign: 'center', marginBottom: 28 }} aria-label={`Step ${step} of 2`}>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              {[1, 2].map((d) => (
                <div
                  key={d}
                  style={{
                    height: 8,
                    transition: 'all .3s',
                    width: d === step ? 20 : 8,
                    borderRadius: d === step ? 4 : '50%',
                    background: d < step ? '#047857' : d === step ? GREEN : 'rgba(26,46,63,0.18)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Property + inline rent ── */}
        {step === 1 && (
          <div className="com-step-anim">
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: NAVY, marginBottom: 8, lineHeight: 1.25 }}>Do you own or rent your home?</h1>
            <div style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', marginBottom: 24, lineHeight: 1.6 }}>Property ownership affects your eligibility and the rates lenders will offer you.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <ChoiceCard selected={profile.housing === 'own'} onClick={() => updateProfile({ housing: 'own' })} icon="🏠" title="Own" sub="Property in my name or family-owned" />
              <ChoiceCard selected={profile.housing === 'rent'} onClick={() => updateProfile({ housing: 'rent' })} icon="🏢" title="Rent" sub="Currently in rented accommodation" />
            </div>

            {profile.housing === 'rent' && (
              <div style={{ marginTop: 20, background: '#F0FDF9', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 16, padding: '16px 18px' }}>
                <label htmlFor="com-rent-input" style={{ ...labelStyle, color: GREEN, marginBottom: 10 }}>
                  Monthly Rent Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: 'rgba(26,46,63,0.4)' }}>₹</span>
                  <input
                    id="com-rent-input"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="e.g. 18000"
                    value={profile.rent ?? ''}
                    onChange={(e) => updateProfile({ rent: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}
                    style={{ ...inputStyle, padding: '14px 14px 14px 30px', border: '1.5px solid rgba(5,150,105,0.25)', fontSize: 18, fontWeight: 700 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.45)', marginTop: 8 }}>This goes into your debt-to-income calculation</div>
              </div>
            )}

            {profile.housing && (
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={() => {
                    if (profile.housing === 'own') updateProfile({ rent: null });
                    go(2);
                  }}
                  style={primaryBtn}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Address ── */}
        {step === 2 && (
          <div className="com-step-anim">
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: NAVY, marginBottom: 8, lineHeight: 1.25 }}>Where do you live?</h1>
            <div style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', marginBottom: 24, lineHeight: 1.6 }}>We use this to surface lenders active in your area and for your loan application.</div>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="com-address-input" style={labelStyle}>
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
                style={{ ...inputStyle, fontWeight: 500, resize: 'none', lineHeight: 1.5, borderColor: errors.address ? '#DC2626' : undefined }}
              />
              <FieldError msg={errors.address} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="com-pincode-input" style={labelStyle}>
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
                style={{ ...inputStyle, fontSize: 20, fontWeight: 700, letterSpacing: 3, borderColor: errors.pincode ? '#DC2626' : undefined }}
              />
              <FieldError msg={errors.pincode} />
              {!errors.pincode && pinHint && (
                <div role="status" style={{ fontSize: 12, marginTop: 6, color: pinHint.color }}>
                  {pinHint.text}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ minWidth: 0 }}>
                <label htmlFor="com-city-input" style={labelStyle}>
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
                  style={{ ...inputStyle, borderColor: errors.city ? '#DC2626' : undefined }}
                />
                <FieldError msg={errors.city} />
              </div>
              <div style={{ minWidth: 0 }}>
                <label htmlFor="com-state-input" style={labelStyle}>
                  State <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: 10, color: 'rgba(26,46,63,0.35)' }}>(auto)</span>
                </label>
                <input
                  id="com-state-input"
                  type="text"
                  placeholder="Auto-filled"
                  readOnly={!!pinInfo}
                  value={profile.state}
                  onChange={(e) => updateProfile({ state: e.target.value })}
                  style={pinInfo ? { ...inputStyle, border: '1.5px solid rgba(196,168,130,0.18)', color: profile.state ? NAVY : 'rgba(26,46,63,0.55)', background: 'rgba(26,46,63,0.03)' } : inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="com-edu-select" style={labelStyle}>
                Highest Education Level
              </label>
              <select
                id="com-edu-select"
                value={profile.education}
                onChange={(e) => {
                  updateProfile({ education: e.target.value });
                  if (errors.education) setErrors((x) => ({ ...x, education: undefined }));
                }}
                aria-invalid={!!errors.education}
                style={{ ...inputStyle, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', borderColor: errors.education ? '#DC2626' : undefined }}
              >
                <option value="">Select your education level</option>
                <option value="10th">10th / SSC</option>
                <option value="12th">12th / HSC</option>
                <option value="graduate">Graduate</option>
                <option value="postgraduate">Post Graduate</option>
                <option value="professional">Professional (CA / CFA / Doctor)</option>
              </select>
              <FieldError msg={errors.education} />
            </div>

            <div style={{ marginBottom: 24 }} role="group" aria-labelledby="com-sector-label">
              <div id="com-sector-label" style={{ ...labelStyle, marginBottom: 10 }}>
                Working Sector
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ChoiceCard
                  small
                  selected={profile.sector === 'salaried'}
                  onClick={() => {
                    updateProfile({ sector: 'salaried' });
                    setErrors((x) => ({ ...x, sector: undefined }));
                  }}
                  icon="💼"
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
                  icon="🏪"
                  title="Self Employed"
                  sub="Business / Freelance"
                />
              </div>
              <FieldError msg={errors.sector} />
            </div>

            <div style={{ marginBottom: 24 }} role="group" aria-labelledby="com-need-label">
              <div id="com-need-label" style={{ ...labelStyle, marginBottom: 10 }}>
                Loan Requirement
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ChoiceCard
                  small
                  selected={profile.loanNeed === 'balance'}
                  onClick={() => {
                    updateProfile({ loanNeed: 'balance' });
                    setErrors((x) => ({ ...x, loanNeed: undefined }));
                  }}
                  icon="💳"
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
                  icon="💰"
                  title="Need More Funds"
                  sub="Additional top-up"
                />
              </div>
              <FieldError msg={errors.loanNeed} />

              {profile.loanNeed === 'more' && (
                <div style={{ marginTop: 14, background: '#F0FDF9', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 14, padding: '16px 16px 14px' }}>
                  <label htmlFor="com-extra-amt-input" style={{ ...labelStyle, letterSpacing: 1, color: '#065F46', marginBottom: 12 }}>
                    Total Loan Amount Needed
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid rgba(5,150,105,0.35)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: NAVY, flexShrink: 0 }}>₹</span>
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
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 18, fontWeight: 800, color: NAVY, fontFamily: 'var(--sans)', background: 'transparent', width: '100%', minWidth: 0 }}
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
                    style={{ width: '100%', accentColor: GREEN, height: 5, cursor: 'pointer', marginBottom: 6 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)', fontWeight: 600 }}>₹10,000</span>
                    <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)', fontWeight: 600 }}>Max ₹5,00,000</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.45)', marginTop: 5 }}>Subject to lender approval</div>
                </div>
              )}
            </div>

            {Object.values(errors).some(Boolean) && (
              <div role="alert" style={{ background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#B91C1C', marginBottom: 14 }}>
                Please complete the highlighted fields.
              </div>
            )}

            <button onClick={runEligibility} style={primaryBtn}>
              Check my eligibility →
            </button>
          </div>
        )}

        {/* ── Step 3: Eligibility check + results ── */}
        {step === 3 && phase === 'checking' && (
          <div className="com-step-anim" role="status" aria-live="polite">
            <div style={{ textAlign: 'center', padding: '52px 20px 48px' }}>
              <div style={{ fontSize: 58, marginBottom: 22, display: 'inline-block', animation: 'comPulse 1.4s ease-in-out infinite' }} aria-hidden>
                🔍
              </div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 900, color: NAVY, marginBottom: 10, lineHeight: 1.25 }}>Finding your best offer…</h1>
              <div style={{ fontSize: 13.5, color: 'rgba(26,46,63,0.45)', marginBottom: 28 }}>Matching your profile with lender criteria</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9 }}>
                {[0, 0.2, 0.4].map((d) => (
                  <div key={d} style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN, animation: `comDotBounce 1.2s ease-in-out ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && phase === 'results' && score && (
          <div className="com-step-anim">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 900, color: NAVY, lineHeight: 1.2, marginBottom: 4 }}>Your Best Matched Offer</h1>
              <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.45)' }}>Based on your credit profile &amp; loan requirement</div>
            </div>

            <ScoreCard score={score.score} estimated={score.estimated} lowestRate={offers && offers.length ? offers[0].offeredRatePercent : null} />

            {/* Loan summary */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 18px 18px', border: '1.5px solid rgba(196,168,130,0.22)', boxShadow: '0 4px 18px rgba(26,46,63,0.08)', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'rgba(26,46,63,0.32)', textTransform: 'uppercase', marginBottom: 14 }}>Your Loan Details</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(37,99,235,0.05)', borderRadius: 12, border: '1px solid rgba(37,99,235,0.1)' }}>
                <span style={{ fontSize: 20 }} aria-hidden>
                  💳
                </span>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.42)', fontWeight: 600, marginBottom: 1 }}>Loan Purpose</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{profile.loanNeed === 'more' ? 'Balance Transfer + Extra Funds' : 'Card Balance Transfer Only'}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="com-amt-input" style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,46,63,0.55)' }}>
                    Loan Amount
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>₹</span>
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
                      style={{ width: 90, border: fieldBorder, borderRadius: 8, padding: '5px 8px', fontSize: 13, fontWeight: 800, color: NAVY, fontFamily: 'var(--sans)', textAlign: 'right', background: '#FFF8F2', outline: 'none' }}
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
                  style={{ width: '100%', accentColor: GREEN, height: 5, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.35)', fontWeight: 600 }}>₹10,000</span>
                  <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.35)', fontWeight: 600 }}>₹5,00,000</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="com-tenure-input" style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,46,63,0.55)' }}>
                    Tenure
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                      style={{ width: 55, border: fieldBorder, borderRadius: 8, padding: '5px 8px', fontSize: 13, fontWeight: 800, color: NAVY, fontFamily: 'var(--sans)', textAlign: 'right', background: '#FFF8F2', outline: 'none' }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>months</span>
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
                  style={{ width: '100%', accentColor: GREEN, height: 5, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.35)', fontWeight: 600 }}>6 mo</span>
                  <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.35)', fontWeight: 600 }}>60 mo</span>
                </div>
              </div>
            </div>

            {/* Eligibility banner — only when an offer actually matches the score */}
            {offers && offers.length > 0 && (
              bestOffer ? (
                <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', borderRadius: 18, padding: '18px 20px', border: '1.5px solid rgba(5,150,105,0.18)', boxShadow: '0 3px 14px rgba(5,150,105,0.1)', marginBottom: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden>
                    🎉
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 900, color: '#065F46', marginBottom: 6, lineHeight: 1.25 }}>You&apos;re eligible for our best offers!</div>
                  <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
                    Your credit profile meets {eligible.length === 1 ? '1 partner lender’s' : `${eligible.length} partner lenders’`} minimum score. Apply in minutes — no branch visit needed.
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FFF7ED', borderRadius: 18, padding: '18px 20px', border: '1.5px solid rgba(249,115,22,0.25)', marginBottom: 18, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 900, color: '#9A3412', marginBottom: 6, lineHeight: 1.25 }}>No offer matches your score yet</div>
                  <div style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.6 }}>
                    Our partner lenders ask for a credit score of at least {lowestMinScore}
                    {score.estimated ? ' (yours above is an estimate — the lender checks your actual bureau score)' : ''}. You can still compare their offers below and apply — the lender makes the final decision.
                  </div>
                </div>
              )
            )}

            {/* Matched offers */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.3, color: 'rgba(26,46,63,0.38)', textTransform: 'uppercase', marginBottom: 14 }}>
                Matched Offers {loadingOffers && <span className="com-spinner" style={{ width: 12, height: 12, verticalAlign: 'middle', marginLeft: 6 }} aria-label="Updating offers" />}
              </div>

              {offersError ? (
                <div role="alert" style={{ background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 14, padding: 16, fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>
                  {offersError}{' '}
                  <button onClick={retryOffers} style={{ background: 'none', border: 'none', color: '#B91C1C', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontFamily: 'var(--sans)' }}>
                    Try again
                  </button>
                </div>
              ) : offers && offers.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, fontSize: 13, color: 'rgba(26,46,63,0.65)', lineHeight: 1.6, border: '1.5px solid rgba(196,168,130,0.2)' }}>
                  We couldn&apos;t find a partner offer for {fmtINR(amount)} over {tenure} months right now. Try a different amount or tenure, or{' '}
                  <Link href="/contact" style={{ color: GREEN, fontWeight: 700 }}>
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
              <div ref={successRef} role="status" style={{ marginTop: 22, background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: 18, padding: '20px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 900, color: '#065F46', marginBottom: 8, lineHeight: 1.3 }}>✅ Application submitted to {applied.name}</div>
                <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6, marginBottom: 14 }}>
                  {applied.count > 1 ? `We sent ${applied.count} balance-transfer requests (one per card). ` : ''}The lender will review your profile and confirm your final rate. You can track it in My Applications.
                </div>
                <Link href="/balance-transfer" style={{ display: 'inline-block', background: GREEN, color: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                  Go to My Applications →
                </Link>
              </div>
            ) : (
              bestOffer && (
                <div style={{ marginTop: 22, marginBottom: 6 }}>
                  <button
                    onClick={() => apply(bestOffer)}
                    disabled={!!applying}
                    style={{ ...primaryBtn, padding: 17, fontSize: 17, boxShadow: '0 5px 18px rgba(5,150,105,0.35)', letterSpacing: 0.2, opacity: applying ? 0.7 : 1, cursor: applying ? 'wait' : 'pointer' }}
                  >
                    {applying === bestOffer.lenderId ? 'Submitting…' : 'Apply Now →'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'rgba(26,46,63,0.4)' }}>
                    Applying with {bestOffer.name} · Lowest rate match · {fmtINR(bestOffer.estimatedEmiRupees)}/mo
                  </div>
                </div>
              )
            )}

            {applyError && (
              <div role="alert" style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#B91C1C' }}>
                {applyError}
              </div>
            )}

            {/* See all offers (design #cc-loan-offers-page layout) */}
            {offers && offers.length > (bestOffer ? 1 : 0) && !applied && (
              <div style={{ marginTop: 18 }}>
                <button
                  onClick={() => {
                    if (!showAll) setListTab(offers.some((o) => o.type === 'bank') ? 'bank' : 'nbfc');
                    setShowAll((v) => !v);
                  }}
                  aria-expanded={showAll}
                  style={{ width: '100%', background: '#fff', border: '1.5px solid #2563EB', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, color: '#2563EB', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                >
                  {showAll ? 'Hide all offers ↑' : `See all offers (${offers.length}) ↓`}
                </button>
                {showAll && (
                  <AllOffers offers={offers} tab={listTab} setTab={setListTab} cardRate={combined.rate} qualifies={qualifies} applying={applying} onApply={apply} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div role="alert" style={{ fontSize: 12, color: '#DC2626', marginTop: 6, fontWeight: 600 }}>
      {msg}
    </div>
  );
}

function ChoiceCard({ selected, onClick, icon, title, sub, small = false }: { selected: boolean; onClick: () => void; icon: string; title: string; sub: string; small?: boolean }) {
  return (
    <button type="button" className={`com-prop-card${selected ? ' selected' : ''}`} onClick={onClick} aria-pressed={selected} style={{ fontFamily: 'var(--sans)', ...(small ? { padding: '18px 12px' } : {}) }}>
      <div style={{ fontSize: small ? 28 : 36, marginBottom: small ? 8 : 12 }} aria-hidden>
        {icon}
      </div>
      <div style={{ fontSize: small ? 14 : 16, fontWeight: 800, color: NAVY, marginBottom: small ? 0 : 4 }}>{title}</div>
      <div style={{ fontSize: small ? 11 : 12, color: 'rgba(26,46,63,0.5)', lineHeight: 1.4, marginTop: small ? 3 : 0 }}>{sub}</div>
    </button>
  );
}

/* ---------- Credit score speedometer (design comDrawGauge) ---------- */

function bandFor(score: number, lowestRate: number | null) {
  const from = lowestRate !== null ? ` and rates starting at ${lowestRate}% p.a.` : '';
  if (score >= 800) return { band: 'Excellent', color: GREEN, msg: 'Outstanding credit history! You qualify for the best rates and maximum loan amounts from our lending partners.' };
  if (score >= 750) return { band: 'Very Good', color: GREEN, msg: `Strong credit profile — you're pre-matched with premium partner offers${from}.` };
  if (score >= 700) return { band: 'Good', color: GREEN, msg: 'Your score clears the 700 threshold that unlocks NBFC lending. Great news — you have real options below.' };
  if (score >= 650) return { band: 'Fair', color: '#D97706', msg: 'Your score is in the fair range. Select NBFCs with flexible criteria can still work with your profile.' };
  return { band: 'Needs Improvement', color: '#DC2626', msg: 'Your score is below most lender thresholds. Focus on timely payments and reducing utilisation to improve it.' };
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
  const { band, color, msg } = bandFor(score, lowestRate);
  const font = { fontFamily: 'Inter,sans-serif' };

  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: '22px 16px 20px', border: '1.5px solid rgba(196,168,130,0.18)', boxShadow: '0 6px 28px rgba(26,46,63,0.09),0 1px 4px rgba(26,46,63,0.05)', marginBottom: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'rgba(26,46,63,0.32)', textTransform: 'uppercase', marginBottom: 8 }}>{estimated ? 'Your Estimated Credit Score' : 'Your Credit Score'}</div>
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, borderRadius: 10, padding: '3px 10px', marginBottom: 10, background: estimated ? '#FFF7ED' : '#ECFDF5', color: estimated ? '#C2410C' : '#047857', border: `1px solid ${estimated ? 'rgba(249,115,22,0.3)' : 'rgba(5,150,105,0.25)'}` }}>
        {estimated ? 'Estimated' : 'On file'}
      </div>
      <svg viewBox="0 0 300 210" role="img" aria-label={`${estimated ? 'Estimated credit score' : 'Credit score'} ${score} out of 900, ${band}`} style={{ width: '100%', maxWidth: 290, display: 'block', margin: '0 auto' }}>
        <defs>
          <filter id="com-needle-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1A2E3F" floodOpacity="0.25" />
          </filter>
        </defs>
        <path d="M 85 145 L 35 145 A 115 115 0 0 1 265 145 L 215 145 A 65 65 0 0 0 85 145 Z" fill="rgba(26,46,63,0.06)" transform="translate(0,3)" />
        <path d="M 85 145 L 35 145 A 115 115 0 0 1 137.2 30.7 L 142.8 80.4 A 65 65 0 0 0 85 145 Z" fill="#FDBA74" />
        <path d="M 142.8 80.4 L 137.2 30.7 A 115 115 0 0 1 206.9 45.1 L 182.2 88.5 A 65 65 0 0 0 142.8 80.4 Z" fill="#FB923C" />
        <path d="M 182.2 88.5 L 206.9 45.1 A 115 115 0 0 1 242.7 76.9 L 202.4 106.5 A 65 65 0 0 0 182.2 88.5 Z" fill="#FACC15" />
        <path d="M 202.4 106.5 L 242.7 76.9 A 115 115 0 0 1 265 145 L 215 145 A 65 65 0 0 0 202.4 106.5 Z" fill="#4ADE80" />
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
        <line x1="150" y1="145" x2={nx} y2={ny} stroke="#1A2E3F" strokeWidth="3.5" strokeLinecap="round" filter="url(#com-needle-shadow)" />
        <circle cx="150" cy="145" r="16" fill="white" />
        <circle cx="150" cy="145" r="13" fill="#1A2E3F" />
        <circle cx="150" cy="145" r="6.5" fill="white" />
        <circle cx="150" cy="145" r="3" fill="#1A2E3F" />
        <text x="28" y="161" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(26,46,63,0.5)" {...font}>
          300
        </text>
        <text x="272" y="161" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(26,46,63,0.5)" {...font}>
          900
        </text>
        <text x="150" y="181" textAnchor="middle" fontSize="44" fontWeight="900" fill="#1A2E3F" fontFamily="Playfair Display,serif">
          {Math.round(shown)}
        </text>
        <text x="150" y="198" textAnchor="middle" fontSize="10" fontWeight="800" fill="rgba(26,46,63,0.38)" letterSpacing="2" {...font}>
          {estimated ? 'ESTIMATED' : 'CREDIT SCORE'}
        </text>
      </svg>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 900, marginTop: 2, lineHeight: 1.2, color }}>{band}</div>
      <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.55)', marginTop: 7, lineHeight: 1.7, padding: '0 8px' }}>{msg}</div>
      <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(26,46,63,0.05)', borderRadius: 10, padding: '5px 13px', border: '1px solid rgba(26,46,63,0.09)', fontSize: 11, color: 'rgba(26,46,63,0.55)', fontWeight: 600, lineHeight: 1.4 }}>
        {estimated ? 'Estimated from your answers — the lender checks your bureau score' : 'From the credit report on your account'}
      </div>
    </div>
  );
}

/* ---------- Offer cards ---------- */

function LenderMark({ offer, size = 52 }: { offer: Offer; size?: number }) {
  const bg = offer.brandColor || '#EDE9FE';
  const fg = offer.brandColor ? '#fff' : '#7C3AED';
  return (
    <div aria-hidden style={{ width: size, height: size, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: offer.initials.length > 3 ? 11 : 16, fontWeight: 900, color: fg, flexShrink: 0, letterSpacing: 0.5 }}>
      {offer.initials}
    </div>
  );
}

const disbursal = (o: Offer) => (o.disbursalDaysMin === o.disbursalDaysMax ? `${o.disbursalDaysMin} day${o.disbursalDaysMin === 1 ? '' : 's'}` : `${o.disbursalDaysMin}–${o.disbursalDaysMax} days`);

function BestMatchCard({ offer, amount, tenure }: { offer: Offer; amount: number; tenure: number }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 20, border: `2px solid ${GREEN}`, boxShadow: '0 6px 24px rgba(5,150,105,0.14)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 14px', borderRadius: '0 16px 0 10px', letterSpacing: 0.5 }}>BEST MATCH ✓</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, marginTop: 8 }}>
        <LenderMark offer={offer} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: NAVY, overflowWrap: 'anywhere' }}>{offer.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.45)', marginTop: 3 }}>
            Up to {fmtINR(amount)} · {tenure} months tenure
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: GREEN }}>{offer.offeredRatePercent}%</div>
          <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)', marginTop: -2 }}>p.a.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Stat label="Monthly EMI" value={fmtINR(offer.estimatedEmiRupees)} highlight />
        <Stat label="Processing" value={fmtINR(offer.processingFeeRupees)} />
        <Stat label="Disbursal" value={disbursal(offer)} />
      </div>
      <div style={{ marginTop: 12, background: 'rgba(37,99,235,0.05)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }} aria-hidden>
          🔒
        </span>
        <span style={{ fontSize: 12, color: 'rgba(26,46,63,0.55)', lineHeight: 1.4 }}>
          Your data is shared securely with {offer.name} only after you apply. Checking offers has no impact on your credit score.
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)' : 'rgba(26,46,63,0.04)', borderRadius: 11, padding: '11px 6px', textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 9, color: highlight ? '#065F46' : 'rgba(26,46,63,0.45)', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color: highlight ? '#065F46' : NAVY, overflowWrap: 'anywhere' }}>{value}</div>
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
    <div style={{ marginTop: 16 }}>
      <div role="tablist" aria-label="Lender type" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(26,46,63,0.08)', borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {(['bank', 'nbfc'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{ background: tab === t ? GREEN : 'transparent', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: tab === t ? 700 : 600, color: tab === t ? '#fff' : 'rgba(26,46,63,0.5)', cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: tab === t ? '0 2px 8px rgba(5,150,105,0.25)' : 'none' }}
          >
            {t === 'bank' ? '🏦 Banks' : '🏢 NBFCs'}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.6, marginBottom: 20 }}>
        {tab === 'bank'
          ? 'Banks typically offer lower rates and stricter eligibility. Stable income and low existing EMIs help most.'
          : 'NBFCs are more flexible on credit score but charge slightly higher rates. Good fallback if banks decline.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {list.length === 0 && (
          <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.55)', textAlign: 'center', padding: 12 }}>No {tab === 'bank' ? 'bank' : 'NBFC'} offers for this amount and tenure right now.</div>
        )}
        {list.map((o) => {
          const diff = cardRate - o.offeredRatePercent;
          const ok = qualifies(o);
          return (
            <div key={o.lenderId} style={{ background: '#fff', border: '1.5px solid rgba(196,168,130,0.2)', borderRadius: 18, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <LenderMark offer={o} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 2 }}>{o.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>
                    @{o.offeredRatePercent}% <span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(26,46,63,0.55)' }}>p.a.</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.5)', marginTop: 1 }}>
                    EMI {fmtINR(o.estimatedEmiRupees)}/mo · Processing fee: {fmtINR(o.processingFeeRupees)}
                  </div>
                  {cardRate > 0 && diff > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        borderRadius: 20,
                        padding: '4px 10px',
                        marginTop: 8,
                        background: diff > 15 ? '#ECFDF5' : '#FFF7ED',
                        border: `1px solid ${diff > 15 ? 'rgba(5,150,105,0.25)' : 'rgba(249,115,22,0.25)'}`,
                      }}
                    >
                      <span style={{ color: diff > 15 ? GREEN : '#C2410C', fontSize: 12, fontWeight: 700 }}>{diff > 15 ? '✓ Well below your card rate' : '✓ Below your card rate'}</span>
                    </div>
                  )}
                  {!ok && <div style={{ fontSize: 11, color: '#C2410C', marginTop: 6, fontWeight: 600 }}>Usually asks for a credit score of {o.minCreditScore}+</div>}
                </div>
                <button
                  onClick={() => onApply(o)}
                  disabled={!!applying}
                  style={{ background: GREEN, border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: applying ? 'wait' : 'pointer', fontFamily: 'var(--sans)', flexShrink: 0, marginTop: 2, boxShadow: '0 2px 8px rgba(5,150,105,0.2)', opacity: applying && applying !== o.lenderId ? 0.6 : 1 }}
                >
                  {applying === o.lenderId ? 'Submitting…' : 'Apply →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '1.5px solid rgba(196,168,130,0.3)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 10 }}>How to compare offers</div>
        <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.65)', lineHeight: 1.7 }}>
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

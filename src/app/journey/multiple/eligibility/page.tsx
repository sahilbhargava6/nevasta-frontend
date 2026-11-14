'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_MULTI_JOURNEY, DEFAULT_PROFILE, fmtINR, useJourney } from '@/lib/journey';
import { isValidPincode, pincodeHint, usePincodeLookup } from '@/lib/pincodes';
import { fetchOffers, type Offer } from '@/lib/applyOffer';
import { consolidationSavings, fmtDcCompact, portfolioStats } from '@/lib/consolidationMath';
import ConsolidationShell from '../_components/ConsolidationShell';
import styles from '../_components/consolidation.module.css';

/**
 * Design: #dc-eligibility-page, wizard rendered by dceRenderStep1 / dceRenderStep2
 * and the dcShowLoading screen.
 */

type Step = 1 | 2 | 'loading';
type FieldKey = 'rent' | 'pincode' | 'sector' | 'income';

const BLUE = '#2563EB';
const IDLE_BORDER = 'rgba(196,168,130,0.4)';
const RED = '#DC2626';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.2,
  color: 'rgba(26,46,63,0.5)',
  textTransform: 'uppercase',
  marginBottom: 8,
};

const inputStyle = (error: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%',
  padding: 14,
  border: `1.5px solid ${error ? RED : IDLE_BORDER}`,
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 500,
  color: '#1A2E3F',
  fontFamily: 'var(--sans)',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .2s',
  ...extra,
});

const cardStyle = (selected: boolean, error = false): React.CSSProperties => ({
  cursor: 'pointer',
  borderRadius: 18,
  padding: '22px 16px',
  border: `2px solid ${error ? RED : selected ? BLUE : 'rgba(196,168,130,0.25)'}`,
  background: selected ? '#EFF6FF' : '#fff',
  transition: 'all .2s',
  textAlign: 'center',
  boxShadow: selected ? '0 4px 16px rgba(37,99,235,0.2)' : '0 2px 10px rgba(0,0,0,0.04)',
});

const errorText: React.CSSProperties = { fontSize: 12, color: RED, fontWeight: 600, marginTop: 6 };

const primaryBtn: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(135deg,#2563EB,#1E40AF)',
  border: 'none',
  borderRadius: 16,
  padding: 17,
  fontSize: 16,
  fontWeight: 800,
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  letterSpacing: 0.2,
  boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
};

function Badge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
      <span style={{ fontSize: 10 }} aria-hidden>
        🏦
      </span>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: BLUE, textTransform: 'uppercase' }}>Debt Consolidation</span>
    </div>
  );
}

function Dots({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }} aria-label={`Step ${step} of 2`}>
      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        {[1, 2].map((d) => (
          <div
            key={d}
            style={
              d === step
                ? { width: 20, height: 8, borderRadius: 4, background: BLUE, transition: 'all .3s' }
                : d < step
                  ? { width: 8, height: 8, borderRadius: '50%', background: '#93C5FD', transition: 'all .3s' }
                  : { width: 8, height: 8, borderRadius: '50%', background: 'rgba(26,46,63,0.18)', transition: 'all .3s' }
            }
          />
        ))}
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
);

function CheckRow({ first, active, done, label, value }: { first?: boolean; active: boolean; done: boolean; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', ...(first ? {} : { borderTop: '1px solid rgba(196,168,130,0.12)' }), opacity: active ? 1 : 0.35, transition: 'opacity .3s' }}>
      {done ? (
        <CheckIcon />
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
          <div className="lfbt-spinner" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E3F' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.45)', marginTop: 2 }}>{done ? value : 'Checking…'}</div>
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
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>
        {ready && step !== 'loading' && <Dots step={step} />}

        {ready && step === 1 && (
          <div>
            <Badge />
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: '#1A2E3F', marginBottom: 8, lineHeight: 1.25 }}>Do you own or rent your home?</h1>
            <p style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', marginBottom: 24, lineHeight: 1.6 }}>Property ownership affects your eligibility and the rates lenders will offer you.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <button type="button" className={styles.choice} aria-pressed={profile.housing === 'own'} style={cardStyle(profile.housing === 'own')} onClick={() => selectHousing('own')}>
                <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden>
                  🏠
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2E3F', marginBottom: 4 }}>Own</div>
                <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.5)', lineHeight: 1.4 }}>Property in my name or family-owned</div>
              </button>
              <button type="button" className={styles.choice} aria-pressed={profile.housing === 'rent'} style={cardStyle(profile.housing === 'rent')} onClick={() => selectHousing('rent')}>
                <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden>
                  🏢
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2E3F', marginBottom: 4 }}>Rent</div>
                <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.5)', lineHeight: 1.4 }}>Currently in rented accommodation</div>
              </button>
            </div>

            {profile.housing === 'rent' && (
              <div style={{ marginTop: 20, animation: 'lfbtFadeIn .3s ease-out both' }}>
                <label htmlFor="dce-rent" style={{ ...labelStyle, marginBottom: 8 }}>
                  Monthly Rent Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: 'rgba(26,46,63,0.4)', pointerEvents: 'none' }}>₹</span>
                  <input
                    id="dce-rent"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    autoFocus
                    placeholder="e.g. 25000"
                    className={styles.field}
                    aria-invalid={errors.rent || undefined}
                    value={profile.rent || ''}
                    onChange={(e) => setProfile({ rent: parseFloat(e.target.value) || null })}
                    onKeyDown={(e) => e.key === 'Enter' && continueFromRent()}
                    style={inputStyle(!!errors.rent, { padding: '14px 14px 14px 32px', fontSize: 20, fontWeight: 700 })}
                  />
                </div>
                {errors.rent && <div style={errorText}>Please enter your monthly rent.</div>}
                <button type="button" onClick={continueFromRent} style={{ ...primaryBtn, marginTop: 18, borderRadius: 14, padding: 15, fontSize: 15, boxShadow: '0 6px 20px rgba(37,99,235,0.3)' }}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {ready && step === 2 && (
          <div>
            <Badge />
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: '#1A2E3F', marginBottom: 8, lineHeight: 1.25 }}>Where do you live?</h1>
            <p style={{ fontSize: 14, color: 'rgba(26,46,63,0.55)', marginBottom: 24, lineHeight: 1.6 }}>We use this to surface lenders active in your area.</p>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="dce-address" style={labelStyle}>
                Full Address
              </label>
              <textarea
                id="dce-address"
                rows={2}
                placeholder="Flat / House No., Street, Area…"
                className={styles.field}
                value={profile.address}
                onChange={(e) => setProfile({ address: e.target.value })}
                style={inputStyle(false, { resize: 'none', lineHeight: 1.5 })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label htmlFor="dce-pincode" style={labelStyle}>
                  Pincode
                </label>
                <input
                  id="dce-pincode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="e.g. 400001"
                  className={styles.field}
                  aria-invalid={errors.pincode || undefined}
                  value={profile.pincode}
                  onChange={(e) => onPincode(e.target.value)}
                  style={inputStyle(!!errors.pincode, { fontSize: 20, fontWeight: 700 })}
                />
              </div>
              <div>
                <label htmlFor="dce-city" style={labelStyle}>
                  City
                </label>
                <input
                  id="dce-city"
                  type="text"
                  placeholder={unknownPin ? 'Enter city' : 'Auto-filled'}
                  readOnly={!unknownPin}
                  className={styles.field}
                  value={profile.city}
                  onChange={(e) => setProfile({ city: e.target.value })}
                  style={inputStyle(false, { fontSize: 16, fontWeight: 600, background: unknownPin ? '#fff' : '#FAFAF8' })}
                />
              </div>
            </div>
            {errors.pincode ? (
              <div role="alert" style={{ ...errorText, marginTop: -8, marginBottom: 12 }}>{pinError}</div>
            ) : (
              pinHint && (
                <div role="status" style={{ fontSize: 12, marginTop: -8, marginBottom: 12, color: pinHint.color }}>
                  {pinHint.text}
                </div>
              )
            )}

            <div style={{ marginBottom: 22 }}>
              <label htmlFor="dce-state" style={labelStyle}>
                State
              </label>
              <input
                id="dce-state"
                type="text"
                placeholder={unknownPin ? 'Enter state' : 'Auto-filled'}
                readOnly={!unknownPin}
                className={styles.field}
                value={profile.state}
                onChange={(e) => setProfile({ state: e.target.value })}
                style={inputStyle(false, { fontSize: 16, fontWeight: 600, background: unknownPin ? '#fff' : '#FAFAF8' })}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="dce-edu" style={labelStyle}>
                Highest Education Level
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="dce-edu"
                  className={styles.field}
                  value={profile.education}
                  onChange={(e) => setProfile({ education: e.target.value })}
                  style={inputStyle(false, { padding: '14px 40px 14px 14px', fontWeight: 600, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' })}
                >
                  <option value="">Select your education level</option>
                  <option value="graduate">Graduate (B.A. / B.Sc. / B.Com / B.E.)</option>
                  <option value="postgrad">Post Graduate (M.A. / M.Sc. / MBA)</option>
                  <option value="doctorate">Doctorate / PhD</option>
                  <option value="diploma">Diploma / Vocational</option>
                  <option value="other">Other</option>
                </select>
                <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B8BA4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div style={{ marginBottom: 16 }} role="group" aria-labelledby="dce-sector-lbl">
              <div id="dce-sector-lbl" style={{ ...labelStyle, marginBottom: 10 }}>
                Working Sector
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button type="button" className={styles.choice} aria-pressed={salSel} style={cardStyle(salSel, !!errors.sector)} onClick={() => setProfile({ sector: 'salaried' })}>
                  <div style={{ fontSize: 30, marginBottom: 10 }} aria-hidden>
                    💼
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2E3F', marginBottom: 3 }}>Salaried</div>
                  <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.5)', lineHeight: 1.4 }}>Fixed monthly income</div>
                </button>
                <button type="button" className={styles.choice} aria-pressed={selfSel} style={cardStyle(selfSel, !!errors.sector)} onClick={() => setProfile({ sector: 'self' })}>
                  <div style={{ fontSize: 30, marginBottom: 10 }} aria-hidden>
                    🏪
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2E3F', marginBottom: 3 }}>Self Employed</div>
                  <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.5)', lineHeight: 1.4 }}>Business / Freelance</div>
                </button>
              </div>
              {errors.sector && <div style={errorText}>Please choose your working sector.</div>}
            </div>

            {profile.sector && (
              <div style={{ marginBottom: 24, animation: 'lfbtFadeIn .3s ease-out both' }}>
                <label htmlFor="dce-income" style={{ ...labelStyle, marginBottom: 6 }}>
                  {salSel ? 'Monthly Take-Home Salary' : 'Average Monthly Income'}
                </label>
                <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.45)', marginBottom: 10 }}>
                  {salSel ? 'Your net in-hand salary after all deductions' : 'Average net income per month from your business / freelance'}
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(26,46,63,0.5)', pointerEvents: 'none' }}>₹</span>
                  <input
                    id="dce-income"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="e.g. 75000"
                    className={styles.field}
                    aria-invalid={errors.income || undefined}
                    value={profile.income || ''}
                    onChange={(e) => setProfile({ income: parseFloat(e.target.value) || null })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitStep2();
                      }
                    }}
                    style={inputStyle(!!errors.income, { padding: '14px 14px 14px 32px', fontSize: 16, fontWeight: 400, borderRadius: 14 })}
                  />
                </div>
                {errors.income && <div style={errorText}>Please enter your monthly income.</div>}
              </div>
            )}

            <button type="button" onClick={submitStep2} style={primaryBtn}>
              Find My Consolidation Plan →
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div aria-live="polite">
            <div style={{ textAlign: 'center', padding: '52px 20px 44px' }}>
              <div style={{ fontSize: 58, marginBottom: 22, display: 'inline-block', animation: 'lfbtPulse 1.4s ease-in-out infinite' }} aria-hidden>
                🔍
              </div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 900, color: '#1A2E3F', marginBottom: 10, lineHeight: 1.25 }}>Finding your consolidation plan…</h1>
              <div style={{ fontSize: 13.5, color: 'rgba(26,46,63,0.45)', marginBottom: 28 }}>Matching your profile with lender criteria</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9 }} aria-hidden>
                {[0, 0.2, 0.4].map((delay) => (
                  <div key={delay} style={{ width: 9, height: 9, borderRadius: '50%', background: BLUE, animation: `lfbtBounce 1.2s ease-in-out ${delay}s infinite` }} />
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: '4px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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
      </div>
    </ConsolidationShell>
  );
}

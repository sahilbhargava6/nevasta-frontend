'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DEFAULT_MULTI_JOURNEY, DEFAULT_PROFILE, estimateCreditScore, fmtINR, scoreBand, useJourney } from '@/lib/journey';
import { applyForDebts, fetchOffers, journeyRunId, type Offer } from '@/lib/applyOffer';
import { DEBT_TYPE_LABEL, consolidationSavings, debtEmi, debtMonths, fmtDcCompact, portfolioStats, tenureLabel } from '@/lib/consolidationMath';
import ConsolidationShell from '../_components/ConsolidationShell';
import ScoreGauge from '../_components/ScoreGauge';
import styles from '../_components/consolidation.module.css';

/** Design: #dc-results-page ("Your Consolidation Plan"), dcShowResults / dcRenderOffer / dcApplyNow. */

const MIN_TENURE = 12;
const MAX_TENURE = 84;

const BAND_COPY: Record<ReturnType<typeof scoreBand>, { color: string; desc: string }> = {
  Excellent: { color: '#16a34a', desc: 'Excellent score! You qualify for the best consolidation rates from all banks and NBFCs.' },
  Good: { color: '#2563EB', desc: 'Your score unlocks NBFC lending. You have solid consolidation options below.' },
  Fair: { color: '#F08A30', desc: 'Fair score. NBFCs can still consolidate your debt — see your options below.' },
  Poor: { color: '#DC2626', desc: 'Your score is below 580. A few NBFCs can still help — see your options below.' },
};

type OfferState = { status: 'loading' | 'done' | 'error'; list: Offer[] };

const disbursalText = (o: Offer) =>
  o.disbursalDaysMin === o.disbursalDaysMax ? `${o.disbursalDaysMin} day${o.disbursalDaysMin === 1 ? '' : 's'}` : `${o.disbursalDaysMin}-${o.disbursalDaysMax} days`;

const noticeBox: React.CSSProperties = {
  fontSize: 12.5,
  color: '#92400E',
  background: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: 12,
  padding: '12px 14px',
  marginBottom: 16,
  lineHeight: 1.5,
};

export default function ConsolidationPlanPage() {
  const router = useRouter();
  const [multi, setMulti, , multiReady] = useJourney('multi', DEFAULT_MULTI_JOURNEY);
  const [profile, , , profileReady] = useJourney('profile', DEFAULT_PROFILE);
  const ready = multiReady && profileReady;

  const stats = portfolioStats(multi.debts);
  const total = stats.totalOutstanding;
  const tenure = Math.min(MAX_TENURE, Math.max(MIN_TENURE, multi.tenure || 36));

  const [scoreOnFile, setScoreOnFile] = useState<number | null | undefined>(undefined);
  const [offers, setOffers] = useState<OfferState>({ status: 'loading', list: [] });
  const [reload, setReload] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    if (ready && total <= 0) router.replace('/journey/multiple');
  }, [ready, total, router]);

  // Bureau score on file, if any (otherwise an estimate from the wizard answers)
  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/me')
      .then((res: any) => !cancelled && setScoreOnFile(res?.data?.creditScore ?? null))
      .catch(() => !cancelled && setScoreOnFile(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Real lender offers for the whole portfolio at the chosen tenure (debounced while sliding)
  useEffect(() => {
    if (!ready || total <= 0) return;
    let cancelled = false;
    setOffers((o) => ({ ...o, status: 'loading' }));
    const t = window.setTimeout(() => {
      fetchOffers(total, tenure)
        .then((list) => !cancelled && setOffers({ status: 'done', list }))
        .catch(() => !cancelled && setOffers({ status: 'error', list: [] }));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [ready, total, tenure, reload]);

  const best = offers.list[0];
  const savings = best ? consolidationSavings(stats.debts, best.offeredRatePercent, tenure, best.estimatedEmiRupees) : 0;

  const score = scoreOnFile === undefined ? null : estimateCreditScore(profile, scoreOnFile);
  const band = score ? scoreBand(score.score) : null;

  const changeTenure = (months: number) => {
    setApplyError('');
    setMulti({ tenure: months });
  };

  const apply = async () => {
    if (!best || applying) return;
    setApplying(true);
    setApplyError('');
    try {
      await applyForDebts(stats.debts, best.lenderId, tenure, journeyRunId());
      setApplied(true);
    } catch (err: any) {
      setApplyError(err?.message || 'Something went wrong while starting your application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const chips = [
    profile.housing === 'own' ? '🏠 Home Owner' : profile.housing === 'rent' ? '🔑 Renter' : '',
    profile.housing === 'rent' && profile.rent ? `Rent ${fmtINR(profile.rent)}/mo` : '',
    profile.sector === 'salaried' ? '💼 Salaried' : profile.sector === 'self' ? '🏪 Self-Employed' : '',
    profile.income ? `${fmtINR(profile.income)}/mo` : '',
    profile.city ? `📍 ${profile.city}${profile.state ? `, ${profile.state}` : ''}` : '',
  ].filter(Boolean);

  const fillPct = ((tenure - MIN_TENURE) / (MAX_TENURE - MIN_TENURE)) * 100;

  return (
    <ConsolidationShell backHref="/journey/multiple/eligibility">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>
        <div style={{ marginBottom: 14, padding: '0 2px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: '#1A2E3F', lineHeight: 1.2 }}>Your Consolidation Plan</h1>
          <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.45)', marginTop: 4 }}>Here&apos;s what we found for you</div>
        </div>

        {ready && total > 0 && (
          <>
            {/* Credit score card */}
            <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(26,46,63,0.4)', textTransform: 'uppercase', marginBottom: 18 }}>
                {score?.estimated ? 'Your Estimated Credit Score' : 'Your CRIF Credit Score'}
              </div>
              <div style={{ marginBottom: 6 }}>
                <ScoreGauge score={score?.score ?? null} />
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#1A2E3F', lineHeight: 1, marginBottom: 4 }}>{score ? score.score : '—'}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(26,46,63,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                {score?.estimated ? 'Estimated' : 'CRIF SCORE'}
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 10, color: band ? BAND_COPY[band].color : '#1A2E3F' }}>{band ?? '—'}</div>
              <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.5)', lineHeight: 1.55, maxWidth: 280, margin: '0 auto 18px' }}>{band ? BAND_COPY[band].desc : ''}</div>
              {score?.estimated ? (
                <div style={{ fontSize: 11.5, color: 'rgba(26,46,63,0.5)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
                  Estimated from your answers — not a bureau score. Your lender will check your actual score before approval.
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid rgba(196,168,130,0.35)', borderRadius: 24, padding: '8px 18px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(26,46,63,0.4)', textTransform: 'uppercase' }}>POWERED BY</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#1A2E3F', letterSpacing: 0.5 }}>CRIF</span>
                </div>
              )}
            </div>

            {/* Your Loan Summary card */}
            <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 18px rgba(0,0,0,0.08)' }}>
              <div style={{ background: 'linear-gradient(135deg,#059669 0%,#047857 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
                  🎉
                </span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>Debt Consolidation</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginTop: 2 }}>Your Loan Summary</div>
                </div>
              </div>
              <div style={{ padding: '18px 16px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.09),rgba(37,99,235,0.04))', border: '1.5px solid rgba(37,99,235,0.2)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: 'rgba(37,99,235,0.7)', textTransform: 'uppercase', marginBottom: 7 }}>LOAN AMOUNT</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2E3F', lineHeight: 1 }}>{fmtDcCompact(total)}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,rgba(5,150,105,0.09),rgba(5,150,105,0.04))', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: 'rgba(5,150,105,0.7)', textTransform: 'uppercase', marginBottom: 7 }}>TENURE</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2E3F', lineHeight: 1 }}>{tenureLabel(tenure)}</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <label htmlFor="dc-tenure" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,46,63,0.6)' }}>
                      Tenure
                    </label>
                    <div style={{ background: '#F9F6F1', border: '1.5px solid rgba(196,168,130,0.35)', borderRadius: 10, padding: '5px 16px', fontSize: 20, fontWeight: 800, color: '#1A2E3F' }}>{tenure}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,46,63,0.6)' }}>months</div>
                  </div>
                  <div style={{ position: 'relative', height: 6, background: 'rgba(196,168,130,0.2)', borderRadius: 3, marginBottom: 12 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'linear-gradient(90deg,#059669,#34D399)', borderRadius: 3, transition: 'width .2s', width: `${fillPct.toFixed(1)}%` }} />
                  </div>
                  <input
                    id="dc-tenure"
                    type="range"
                    min={MIN_TENURE}
                    max={MAX_TENURE}
                    step={6}
                    value={tenure}
                    className={styles.range}
                    aria-valuetext={`${tenure} months`}
                    onChange={(e) => changeTenure(parseInt(e.target.value, 10))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)', fontWeight: 600 }}>12 mo</div>
                    {best && offers.status !== 'error' && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.08)', padding: '3px 10px', borderRadius: 20, opacity: offers.status === 'loading' ? 0.5 : 1 }}>
                        {fmtINR(best.estimatedEmiRupees)} /mo at best rate
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'rgba(26,46,63,0.4)', fontWeight: 600 }}>84 mo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings banner */}
            {offers.status === 'done' && savings > 0 && (
              <div className="dc-savings-banner">
                <div className="dc-savings-lbl">Estimated Interest Saved</div>
                <div className="dc-savings-val">{fmtDcCompact(savings)}</div>
                <div className="dc-savings-sub">by consolidating into one loan</div>
              </div>
            )}

            {/* Eligibility profile banner */}
            {profile.housing && chips.length > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#047857', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--sans)' }}>Your Profile</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {chips.map((c) => (
                    <div className="dce-chip" key={c}>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched offers */}
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: 'rgba(26,46,63,0.38)', textTransform: 'uppercase', marginBottom: 12, marginTop: 4 }}>Matched Offers</div>
            <div aria-live="polite">
              {applied ? (
                <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid #6EE7B7', borderRadius: 16, padding: '28px 20px', textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden>
                    ✅
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 800, color: '#065F46', marginBottom: 6 }}>Application Started!</div>
                  <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5, marginBottom: 18 }}>
                    Our partner lender will reach out within 24 hours to complete your KYC and disburse the loan directly to your existing lenders.
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(4,120,87,0.7)', marginBottom: 18 }}>📞 Expect a call from a verified Navesta advisor</div>
                  <Link href="/balance-transfer" className="dc-apply-btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                    Track my application →
                  </Link>
                </div>
              ) : offers.status === 'error' ? (
                <div style={noticeBox} role="alert">
                  We couldn&apos;t load lender offers right now.{' '}
                  <button type="button" onClick={() => setReload((n) => n + 1)} style={{ background: 'none', border: 'none', padding: 0, color: '#C96010', fontWeight: 700, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}>
                    Try again
                  </button>
                </div>
              ) : !best && offers.status === 'loading' ? (
                <div className="dc-offer-card" style={{ textAlign: 'center', color: 'rgba(42,22,6,0.5)', fontSize: 13 }}>
                  <div className="lfbt-spinner" style={{ marginBottom: 8 }} />
                  <div>Finding the best lender for you…</div>
                </div>
              ) : !best ? (
                <div style={noticeBox}>
                  ⚠️ None of our partner lenders can cover the full {fmtDcCompact(total)} in one consolidation loan over {tenure} months right now. Try another tenure,{' '}
                  <Link href="/journey/multiple" style={{ color: '#C96010', fontWeight: 700 }}>
                    consolidate fewer debts
                  </Link>{' '}
                  or{' '}
                  <Link href="/contact" style={{ color: '#C96010', fontWeight: 700 }}>
                    talk to an advisor
                  </Link>
                  .
                </div>
              ) : (
                <div className="dc-offer-card" style={{ opacity: offers.status === 'loading' ? 0.6 : 1, transition: 'opacity .2s' }}>
                  <div className="dc-best-badge">BEST MATCH ✓</div>
                  <div className="dc-offer-head">
                    <div className="dc-offer-avatar" style={{ background: best.brandColor || '#1A3D2B', boxShadow: `0 4px 12px ${(best.brandColor || '#1A3D2B') + '33'}` }} aria-hidden>
                      {best.initials}
                    </div>
                    <div>
                      <div className="dc-offer-name">{best.name}</div>
                      <div className="dc-offer-rate">@ {best.offeredRatePercent.toFixed(2)}% p.a.</div>
                    </div>
                  </div>
                  {best.meetsMinimumScore === false && (
                    <div style={{ fontSize: 11.5, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '7px 10px', marginBottom: 10 }}>
                      ⚠️ This lender usually looks for a credit score of {best.minCreditScore}+. You can still apply, but approval isn&apos;t guaranteed.
                    </div>
                  )}
                  <div className="dc-offer-chips">
                    <div className="dc-chip">
                      <div className="dc-chip-lbl">Monthly EMI</div>
                      <div className="dc-chip-val">{fmtINR(best.estimatedEmiRupees)}</div>
                    </div>
                    <div className="dc-chip">
                      <div className="dc-chip-lbl">Processing</div>
                      <div className="dc-chip-val">{fmtINR(best.processingFeeRupees)}</div>
                    </div>
                    <div className="dc-chip">
                      <div className="dc-chip-lbl">Disbursal</div>
                      <div className="dc-chip-val">{disbursalText(best)}</div>
                    </div>
                  </div>
                  <div className="dc-security-note">🔒 SSL secured · RBI registered lender · No prepayment penalty</div>
                  <button type="button" className="dc-apply-btn" onClick={apply} disabled={applying || offers.status === 'loading'} style={{ opacity: applying ? 0.7 : 1 }}>
                    {applying ? 'Starting your application…' : 'Apply Now →'}
                  </button>
                  {applyError && (
                    <div role="alert" style={{ marginTop: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, fontWeight: 600 }}>
                      {applyError}
                    </div>
                  )}
                  <div className="dc-offer-footer">
                    {best.name} · {best.offeredRatePercent.toFixed(2)}% for {tenure} months
                  </div>
                </div>
              )}
            </div>

            {/* Debt breakdown */}
            <div className="dc-breakdown">
              <div className="dc-breakdown-title">Debts Being Consolidated</div>
              {stats.debts.map((d, i) => (
                <div className="dc-breakdown-row" key={i}>
                  <div>
                    <div className="dc-breakdown-type">{DEBT_TYPE_LABEL[d.type]}</div>
                    <div className="dc-breakdown-rate">
                      {d.rate.toFixed(1)}% · {fmtINR(debtEmi(d))}/mo · {debtMonths(d)} mo left
                    </div>
                  </div>
                  <div className="dc-breakdown-amt">{fmtDcCompact(d.amount)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ConsolidationShell>
  );
}

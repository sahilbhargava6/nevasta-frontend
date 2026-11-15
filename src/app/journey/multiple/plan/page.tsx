'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, Landmark, Loader2, Lock, PartyPopper, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { DEFAULT_MULTI_JOURNEY, DEFAULT_PROFILE, estimateCreditScore, fmtINR, scoreBand, scoreSourceLabel, useJourney } from '@/lib/journey';
import { applyForDebts, fetchOffers, journeyRunId, type Offer } from '@/lib/applyOffer';
import { detailKey, trackStep } from '@/lib/track';
import { DEBT_TYPE_LABEL, consolidationSavings, debtEmi, debtMonths, fmtDcCompact, portfolioStats, tenureLabel } from '@/lib/consolidationMath';
import ConsolidationShell from '../_components/ConsolidationShell';
import ScoreGauge from '../_components/ScoreGauge';

/** Design: #dc-results-page ("Your Consolidation Plan"), dcShowResults / dcRenderOffer / dcApplyNow. */

const MIN_TENURE = 12;
const MAX_TENURE = 84;

const BAND_COPY: Record<ReturnType<typeof scoreBand>, { cls: string; desc: string }> = {
  Excellent: { cls: 'text-emerald-600', desc: 'Excellent score! You qualify for the best consolidation rates from all banks and NBFCs.' },
  Good: { cls: 'text-blue-600', desc: 'Your score unlocks NBFC lending. You have solid consolidation options below.' },
  Fair: { cls: 'text-amber-600', desc: 'Fair score. NBFCs can still consolidate your debt — see your options below.' },
  Poor: { cls: 'text-rose-600', desc: 'Your score is below 580. A few NBFCs can still help — see your options below.' },
};

type OfferState = { status: 'loading' | 'done' | 'error'; list: Offer[] };

const disbursalText = (o: Offer) =>
  o.disbursalDaysMin === o.disbursalDaysMax ? `${o.disbursalDaysMin} day${o.disbursalDaysMin === 1 ? '' : 's'}` : `${o.disbursalDaysMin}-${o.disbursalDaysMax} days`;

export default function ConsolidationPlanPage() {
  const router = useRouter();
  const [multi, setMulti, , multiReady] = useJourney('multi', DEFAULT_MULTI_JOURNEY);
  const [profile, , , profileReady] = useJourney('profile', DEFAULT_PROFILE);
  const ready = multiReady && profileReady;

  const stats = portfolioStats(multi.debts);
  const total = stats.totalOutstanding;
  const tenure = Math.min(MAX_TENURE, Math.max(MIN_TENURE, multi.tenure || 36));

  const [scoreOnFile, setScoreOnFile] = useState<number | null | undefined>(undefined);
  const [scoreSource, setScoreSource] = useState<string | null>(null);
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
      .then((res: any) => {
        if (cancelled) return;
        setScoreOnFile(res?.data?.creditScore ?? null);
        setScoreSource(res?.data?.creditScores?.[0]?.source ?? null);
      })
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
  const src = scoreSourceLabel(scoreSource);

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
      trackStep('multiple', 'applied', detailKey(best.name));
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

  return (
    <ConsolidationShell backHref="/journey/multiple/eligibility">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Landmark className="w-4 h-4" aria-hidden /> Debt Consolidation
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your Consolidation <span className="text-blue-600">Plan</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">Here&apos;s what we found for you</p>
        </div>

        {ready && total > 0 && (
          <>
            {/* Credit score card */}
            <div className="card-fintech p-5 sm:p-6 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                {score?.estimated ? 'Your Estimated Credit Score' : src.title}
              </div>
              <div className="mb-2">
                <ScoreGauge score={score?.score ?? null} />
              </div>
              <div className="text-5xl font-bold text-slate-900 tabular-nums leading-none mb-2">{score ? score.score : '—'}</div>
              <div className="mb-2">
                {score?.estimated ? <span className="badge-amber">Estimated</span> : <span className={src.bureau ? 'badge-slate' : 'badge-amber'}>{src.badge}</span>}
              </div>
              <div className={`text-2xl font-bold mb-2 ${band ? BAND_COPY[band].cls : 'text-slate-900'}`}>{band ?? '—'}</div>
              <div className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto mb-4">{band ? BAND_COPY[band].desc : ''}</div>
              {score?.estimated ? (
                <div className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Estimated from your answers — not a bureau score. Your lender will check your actual score before approval.
                </div>
              ) : src.bureau ? (
                <div className="inline-flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">POWERED BY</span>
                  <span className="text-sm font-bold text-slate-900">{src.bureau}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  The score you told us — not checked with a bureau yet. Your lender will check your actual score before approval.
                </div>
              )}
            </div>

            {/* Your Loan Summary card */}
            <div className="card-fintech p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0" aria-hidden>
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Debt Consolidation</div>
                  <h2 className="text-base font-semibold text-slate-900">Your Loan Summary</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[11px] font-medium text-slate-500">LOAN AMOUNT</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{fmtDcCompact(total)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[11px] font-medium text-slate-500">TENURE</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{tenureLabel(tenure)}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="dc-tenure" className="text-sm font-semibold text-slate-900">
                    Tenure
                  </label>
                  <div className="text-sm font-semibold text-slate-900 tabular-nums">{tenure} months</div>
                </div>
                <input
                  id="dc-tenure"
                  type="range"
                  min={MIN_TENURE}
                  max={MAX_TENURE}
                  step={6}
                  value={tenure}
                  className="w-full accent-blue-600"
                  aria-valuetext={`${tenure} months`}
                  onChange={(e) => changeTenure(parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between items-center mt-1 gap-2">
                  <div className="text-xs text-slate-500">12 mo</div>
                  {best && offers.status !== 'error' && (
                    <span className={`badge-emerald transition-opacity ${offers.status === 'loading' ? 'opacity-50' : ''}`}>{fmtINR(best.estimatedEmiRupees)} /mo at best rate</span>
                  )}
                  <div className="text-xs text-slate-500">84 mo</div>
                </div>
              </div>
            </div>

            {/* Savings banner */}
            {offers.status === 'done' && savings > 0 && (
              <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Estimated Interest Saved</div>
                <div className="text-3xl font-bold tabular-nums text-emerald-400 mt-1">{fmtDcCompact(savings)}</div>
                <div className="text-xs text-slate-400 mt-1">by consolidating into one loan</div>
              </div>
            )}

            {/* Eligibility profile banner */}
            {profile.housing && chips.length > 0 && (
              <div className="card-fintech p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Profile</div>
                <div className="flex gap-2 flex-wrap">
                  {chips.map((c) => (
                    <span className="badge-slate" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Matched offers */}
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Offers</h2>
            <div aria-live="polite">
              {applied ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                  <CheckCircle2 className="w-9 h-9 mx-auto mb-3 text-emerald-600" aria-hidden />
                  <div className="text-xl font-bold text-emerald-800 mb-1.5">Application Started!</div>
                  <div className="text-sm text-emerald-800 leading-relaxed mb-4">
                    Our partner lender will reach out within 24 hours to complete your KYC and disburse the loan directly to your existing lenders.
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 mb-4">
                    <Phone className="w-3.5 h-3.5" aria-hidden /> Expect a call from a verified Navesta advisor
                  </div>
                  <Link href="/balance-transfer" className="btn-accent w-full sm:w-auto">
                    Track my application <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
                  </Link>
                </div>
              ) : offers.status === 'error' ? (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                  <div>
                    We couldn&apos;t load lender offers right now.{' '}
                    <button type="button" onClick={() => setReload((n) => n + 1)} className="font-semibold text-blue-600 hover:text-blue-700 underline">
                      Try again
                    </button>
                  </div>
                </div>
              ) : !best && offers.status === 'loading' ? (
                <div className="card-fintech p-5 text-center text-sm text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" aria-hidden />
                  <div>Finding the best lender for you…</div>
                </div>
              ) : !best ? (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                  <div>
                    None of our partner lenders can cover the full {fmtDcCompact(total)} in one consolidation loan over {tenure} months right now. Try another tenure,{' '}
                    <Link href="/journey/multiple" className="font-semibold text-blue-600 hover:text-blue-700">
                      consolidate fewer debts
                    </Link>{' '}
                    or{' '}
                    <Link href="/contact" className="font-semibold text-blue-600 hover:text-blue-700">
                      talk to an advisor
                    </Link>
                    .
                  </div>
                </div>
              ) : (
                <div className={`card-fintech p-5 space-y-4 ${offers.status === 'loading' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: best.brandColor || '#0F172A' }}
                        aria-hidden
                      >
                        {best.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{best.name}</div>
                        <span className="badge-emerald mt-1">BEST MATCH ✓</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-slate-900 tabular-nums">{best.offeredRatePercent.toFixed(2)}%</div>
                      <div className="text-xs text-slate-500">@ {best.offeredRatePercent.toFixed(2)}% p.a.</div>
                    </div>
                  </div>
                  {best.meetsMinimumScore === false && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                      This lender usually looks for a credit score of {best.minCreditScore}+. You can still apply, but approval isn&apos;t guaranteed.
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <div className="text-[11px] font-medium text-slate-500">Monthly EMI</div>
                      <div className="text-sm font-bold text-slate-900 tabular-nums">{fmtINR(best.estimatedEmiRupees)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <div className="text-[11px] font-medium text-slate-500">Processing</div>
                      <div className="text-sm font-bold text-slate-900 tabular-nums">{fmtINR(best.processingFeeRupees)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <div className="text-[11px] font-medium text-slate-500">Disbursal</div>
                      <div className="text-sm font-bold text-slate-900">{disbursalText(best)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden /> SSL secured · RBI registered lender · No prepayment penalty
                  </div>
                  <button type="button" className="btn-accent w-full" onClick={apply} disabled={applying || offers.status === 'loading'}>
                    {applying ? 'Starting your application…' : 'Apply Now'}
                    {!applying && <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />}
                  </button>
                  {applyError && (
                    <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                      {applyError}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 text-center">
                    {best.name} · {best.offeredRatePercent.toFixed(2)}% for {tenure} months
                  </div>
                </div>
              )}
            </div>

            {/* Debt breakdown */}
            <div className="card-fintech p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Debts Being Consolidated</h2>
              <div className="divide-y divide-slate-100">
                {stats.debts.map((d, i) => (
                  <div className="flex items-center justify-between gap-3 py-3" key={i}>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{DEBT_TYPE_LABEL[d.type]}</div>
                      <div className="text-xs text-slate-500">
                        {d.rate.toFixed(1)}% · {fmtINR(debtEmi(d))}/mo · {debtMonths(d)} mo left
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums shrink-0">{fmtDcCompact(d.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </ConsolidationShell>
  );
}

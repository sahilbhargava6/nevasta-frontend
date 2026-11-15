'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Gift, Info, Lightbulb, Loader2, PartyPopper, Wallet, Zap } from 'lucide-react';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useSession } from '@/components/session/SessionProvider';
import { fetchOffers, type Offer } from '@/lib/applyOffer';
import { fmtINR, pmt } from '@/lib/journey';
import { trackStep } from '@/lib/track';
import { INDICATIVE_BEST_RATE, LIFE_EVENTS, elpFmtINR, type LifeEventKey } from '../events';

const TICKS = ['6 mo', '12', '24', '36', '48', '60 mo'];
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';
const inputCls =
  'w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';

/** Event loan plan (design #elp-page + elpCalc), with live lender offers. */
export default function EventPlanner({ eventKey }: { eventKey: LifeEventKey }) {
  const ev = LIFE_EVENTS[eventKey];
  const { user, ready, openAuth } = useSession();

  const [incomeText, setIncomeText] = useState('');
  const [amountText, setAmountText] = useState(String(ev.defaultAmount));
  const [tenure, setTenure] = useState<number>(ev.defaultTenure);

  const income = parseFloat(incomeText) || 0;
  const amount = parseFloat(amountText) || 0;
  const maxEMI = income * 0.4;

  // Live lender offers (signed-in customers; the offers API needs an account)
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user || amount <= 0) {
      setOffers(null);
      setOffersError(null);
      setLoadingOffers(false);
      return;
    }
    let cancelled = false;
    setLoadingOffers(true);
    const t = setTimeout(() => {
      fetchOffers(amount, tenure)
        .then((list) => {
          if (cancelled) return;
          setOffers(list);
          setOffersError(null);
        })
        .catch((err: Error) => {
          if (cancelled) return;
          setOffers(null);
          setOffersError(err.message || 'Could not load lender offers.');
        })
        .finally(() => {
          if (!cancelled) setLoadingOffers(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ready, user, amount, tenure]);

  const topOffers = (offers ?? []).slice(0, 3);
  const best = topOffers[0];
  const bestRate = best ? best.offeredRatePercent : INDICATIVE_BEST_RATE;
  const bestEMI = pmt(amount, bestRate, tenure);
  const bestInterest = bestEMI * tenure - amount;
  const overLimit = income > 0 && bestEMI > maxEMI;
  const showResults = amount > 0 && tenure > 0;

  const amountLabel =
    amount >= 100000 ? `₹${(amount / 100000).toFixed(2)}L loan` : amount > 0 ? `₹${Math.round(amount).toLocaleString('en-IN')} loan` : '—';

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/life-events" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero card */}
        <div className="card-fintech p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <PartyPopper className="w-4 h-4" aria-hidden /> Life-Event Planning
          </div>
          <div className="mt-3 flex items-start gap-4">
            <div className="text-4xl leading-none" aria-hidden>
              {ev.emoji}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{ev.title}</h1>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{ev.tagline}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3">
            <Info className="w-4 h-4 shrink-0" aria-hidden />
            <span>{ev.proof}</span>
          </div>
        </div>

        {/* Input card */}
        <div className="card-fintech p-5 sm:p-6 space-y-6">
          {/* Monthly income */}
          <div>
            <label htmlFor="elp-income" className={labelCls}>
              MONTHLY INCOME
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">₹</span>
              <input id="elp-income" type="number" inputMode="numeric" min={0} placeholder="e.g. 85000" value={incomeText} onChange={(e) => setIncomeText(e.target.value)} className={`${inputCls} pl-7`} />
            </div>
            <div className="text-xs text-slate-500 mt-1">We&apos;ll check EMI stays within 40% of this — the lender&apos;s affordability rule</div>
            <div className="text-right text-xs text-slate-500 mt-1">
              Max EMI at 40% → <strong className="text-slate-900">{income > 0 ? `${elpFmtINR(maxEMI)}/mo` : '—'}</strong>
            </div>
          </div>

          {/* Loan amount */}
          <div>
            <label htmlFor="elp-amount" className={labelCls}>
              LOAN AMOUNT NEEDED
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">₹</span>
              <input id="elp-amount" type="number" inputMode="numeric" min={0} placeholder="e.g. 800000" value={amountText} onChange={(e) => setAmountText(e.target.value)} className={`${inputCls} pl-7`} />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 mt-1">
              <span>{ev.typicalRange}</span>
              <span>{amountLabel}</span>
            </div>
          </div>

          {/* Repayment tenure */}
          <div>
            <label htmlFor="elp-tenure" className={labelCls}>
              REPAYMENT TENURE
            </label>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{tenure} months</div>
              <div className="text-xs text-slate-500">Drag to adjust</div>
            </div>
            <input
              id="elp-tenure"
              type="range"
              min={6}
              max={60}
              step={6}
              value={tenure}
              onChange={(e) => setTenure(parseInt(e.target.value, 10) || 24)}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              {TICKS.map((t) => (
                <span key={t} className="text-xs text-slate-500">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {showResults && (
          <>
            {/* Result card */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6">
              <div className="text-center text-xs text-slate-400 uppercase tracking-wider mb-3">{best ? 'BEST AVAILABLE RATE' : 'INDICATIVE RATE'}</div>
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-blue-400">
                  <Zap className="w-3.5 h-3.5" aria-hidden /> {bestRate}% p.a. · {best ? best.name : 'Indicative'}
                </span>
              </div>
              <div className="text-center mb-1">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums">{elpFmtINR(Math.round(bestEMI))}</span>
                <span className="text-base text-slate-400 font-medium">/mo</span>
              </div>
              <div className="text-center text-sm text-slate-400 mb-4 leading-relaxed">
                {tenure} months · {elpFmtINR(amount)} loan · {elpFmtINR(Math.round(bestInterest))} interest
              </div>
              {overLimit && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                  EMI is {Math.round((bestEMI / income) * 100)}% of your income (limit 40%) — try a longer tenure
                </div>
              )}
            </div>

            {/* Lender offers */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Lender offers for {elpFmtINR(amount)} over {tenure} months
              </h2>

              {!ready || (user && loadingOffers && !offers) ? (
                <div className={`${noteCard} flex items-center gap-2`}>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden /> Finding lender offers…
                </div>
              ) : !user ? (
                <div className={noteCard}>
                  <div className="text-sm font-semibold text-slate-900 mb-1">See live offers from our lending partners</div>
                  <div className="text-xs text-slate-500 leading-relaxed mb-3">Create a free account to compare real rates and EMIs for this plan. No impact on your credit score.</div>
                  <button type="button" onClick={() => openAuth({ mode: 'signup' })} className="btn-accent w-full sm:w-auto">
                    Sign up to see offers
                  </button>
                </div>
              ) : offersError ? (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                  {offersError}
                </div>
              ) : topOffers.length === 0 ? (
                <div className={noteCard}>No lender offers match this amount and tenure right now. Try a different amount, or talk to an advisor below.</div>
              ) : (
                topOffers.map((offer, idx) => <OfferCard key={offer.lenderId} offer={offer} isBest={idx === 0} amount={amount} tenure={tenure} income={income} />)
              )}
            </div>

            <Link href="/contact" className="btn-secondary w-full" onClick={() => trackStep('life_events', 'advisor', eventKey)}>
              Talk to an advisor about this plan <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </Link>

            <div className="text-xs text-slate-500 leading-relaxed">Rates are indicative for 2026. Final rate depends on your income, employment type and lender policy.</div>

            {/* Navesta perks */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Gift className="w-4 h-4 text-blue-600" aria-hidden /> Navesta Perks
                </h2>
                <span className="text-xs text-slate-500">Exclusive benefits on loan disbursal</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="card-fintech border-blue-600 p-4">
                  <span className="badge-blue mb-3">Exclusive</span>
                  <div className="text-2xl mb-2" aria-hidden>
                    {ev.perk1Emoji}
                  </div>
                  <div className="text-base font-bold text-slate-900 mb-1">
                    {ev.perk1Val} {ev.perk1Label}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed mb-3">{ev.perk1Desc}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ev.perk1DotColor }} />
                    <span className="text-xs font-semibold text-slate-700">{ev.perk1Partner}</span>
                  </div>
                </div>
                <div className="card-fintech p-4">
                  <Wallet className="w-6 h-6 text-blue-600 mb-2" aria-hidden />
                  <div className="text-base font-bold text-slate-900 mb-1">1% EMI Cashback</div>
                  <div className="text-xs text-slate-500 leading-relaxed mb-3">On your first 3 EMIs, credited to Navesta wallet</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0 bg-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">Navesta</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 leading-relaxed">Perks are auto-credited within 48 hrs of loan disbursal. Subject to partner T&amp;Cs.</div>
            </div>

            {/* Smart tips */}
            <div className="card-fintech p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <Lightbulb className="w-4 h-4 text-blue-600" aria-hidden /> Smart tips for your {ev.title.toLowerCase()}
              </h2>
              <ul className="space-y-3">
                {ev.tips.map((tip) => (
                  <li key={tip} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
                    <span className="text-sm text-slate-600 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const noteCard = 'card-fintech p-5 text-sm text-slate-600 leading-relaxed';

function OfferCard({ offer, isBest, amount, tenure, income }: { offer: Offer; isBest: boolean; amount: number; tenure: number; income: number }) {
  const emi = pmt(amount, offer.offeredRatePercent, tenure);
  const totInt = emi * tenure - amount;
  const exceeds = income > 0 && emi > income * 0.4;
  const days = offer.disbursalDaysMin === offer.disbursalDaysMax ? `${offer.disbursalDaysMin}` : `${offer.disbursalDaysMin}–${offer.disbursalDaysMax}`;
  const tagline = `Disbursal in ${days} day${days === '1' ? '' : 's'} · ${offer.processingFeeRupees > 0 ? `${fmtINR(offer.processingFeeRupees)} processing` : 'No processing fee'}`;

  return (
    <div className={`card-fintech p-5 space-y-3 ${isBest ? 'border-blue-600' : ''}`}>
      {isBest && <span className="badge-emerald">Best rate</span>}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ background: offer.brandColor || '#2563EB' }} />
          <div className="min-w-0">
            <div className="font-semibold text-slate-900">{offer.name}</div>
            <div className="text-xs text-slate-500">{tagline}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-blue-600">{offer.offeredRatePercent}% p.a.</div>
          <div className="text-xl font-bold text-slate-900 tabular-nums leading-tight">
            {elpFmtINR(Math.round(emi))}
            <span className="text-xs font-medium text-slate-500">/mo</span>
          </div>
          <div className="text-xs text-slate-500">+{elpFmtINR(Math.round(totInt))} interest</div>
        </div>
      </div>
      {exceeds && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden /> EMI exceeds 40% of your income
        </div>
      )}
      {offer.meetsMinimumScore === false && <div className="text-xs text-slate-500">Usually needs a credit score of {offer.minCreditScore}+</div>}
    </div>
  );
}

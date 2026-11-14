'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useSession } from '@/components/session/SessionProvider';
import { fetchOffers, type Offer } from '@/lib/applyOffer';
import { fmtINR, pmt } from '@/lib/journey';
import { INDICATIVE_BEST_RATE, LIFE_EVENTS, elpFmtINR, type LifeEventKey } from '../events';

const label: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#8A6A3A', letterSpacing: '.6px', marginBottom: 4, display: 'block' };
const inputWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', border: '1.5px solid rgba(109,40,217,0.25)', borderRadius: 12, overflow: 'hidden', background: '#FAF7FF' };
const rupeeBox: React.CSSProperties = { background: '#EDE9FE', padding: '14px 14px', borderRight: '1.5px solid rgba(109,40,217,0.2)', flexShrink: 0 };
const inputStyle: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', padding: '14px 14px', fontSize: 16, fontWeight: 600, fontFamily: 'var(--sans)', background: 'transparent', color: '#1A1035', minWidth: 0 };
const TICKS = ['6 mo', '12', '24', '36', '48', '60 mo'];

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
    <div className="nv" style={{ minHeight: '100vh', background: '#F5EFE8', fontFamily: 'var(--sans)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/life-events" />

      <div style={{ padding: '20px 16px 100px', maxWidth: 560, margin: '0 auto' }}>
        {/* Hero card */}
        <div style={{ borderRadius: 20, padding: '22px 20px 18px', marginBottom: 16, position: 'relative', overflow: 'hidden', background: ev.bg }}>
          <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1, display: 'block' }} aria-hidden>{ev.emoji}</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 900, color: '#1A1035', lineHeight: 1.15, marginBottom: 8 }}>{ev.title}</h1>
          <div style={{ fontSize: 14, color: 'rgba(26,16,53,0.65)', lineHeight: 1.55, marginBottom: 16 }}>{ev.tagline}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(109,40,217,0.13)', color: '#5B21B6', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 24, lineHeight: 1.3 }}>{ev.proof}</div>
        </div>

        {/* Input card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '22px 18px', marginBottom: 16, border: '1.5px solid rgba(196,168,130,0.2)', boxShadow: '0 2px 12px rgba(42,22,6,0.04)' }}>
          {/* Monthly income */}
          <div style={{ marginBottom: 22 }}>
            <label htmlFor="elp-income" style={label}>MONTHLY INCOME</label>
            <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.45)', marginBottom: 10, lineHeight: 1.45 }}>We&apos;ll check EMI stays within 40% of this — the lender&apos;s affordability rule</div>
            <div style={inputWrap}>
              <div style={rupeeBox}><span style={{ fontSize: 17, fontWeight: 700, color: '#6D28D9' }}>₹</span></div>
              <input id="elp-income" type="number" inputMode="numeric" min={0} placeholder="e.g. 85000" value={incomeText} onChange={(e) => setIncomeText(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(42,22,6,0.45)', marginTop: 6 }}>
              Max EMI at 40% → <strong style={{ color: '#5B21B6' }}>{income > 0 ? `${elpFmtINR(maxEMI)}/mo` : '—'}</strong>
            </div>
          </div>

          {/* Loan amount */}
          <div style={{ marginBottom: 22 }}>
            <label htmlFor="elp-amount" style={label}>LOAN AMOUNT NEEDED</label>
            <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.45)', marginBottom: 10 }}>{ev.typicalRange}</div>
            <div style={inputWrap}>
              <div style={rupeeBox}><span style={{ fontSize: 17, fontWeight: 700, color: '#6D28D9' }}>₹</span></div>
              <input id="elp-amount" type="number" inputMode="numeric" min={0} placeholder="e.g. 800000" value={amountText} onChange={(e) => setAmountText(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(42,22,6,0.45)', marginTop: 6 }}>{amountLabel}</div>
          </div>

          {/* Repayment tenure */}
          <div>
            <label htmlFor="elp-tenure" style={{ ...label, marginBottom: 10 }}>REPAYMENT TENURE</label>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 'clamp(26px,6vw,32px)', fontWeight: 900, color: '#6D28D9', lineHeight: 1 }}>{tenure} months</div>
              <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.4)', fontStyle: 'italic' }}>Drag to adjust</div>
            </div>
            <input
              id="elp-tenure"
              type="range"
              min={6}
              max={60}
              step={6}
              value={tenure}
              onChange={(e) => setTenure(parseInt(e.target.value, 10) || 24)}
              style={{ width: '100%', accentColor: '#6D28D9', height: 6, cursor: 'pointer', borderRadius: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginTop: 7 }}>
              {TICKS.map((t) => (
                <span key={t} style={{ fontSize: 10, color: 'rgba(42,22,6,0.35)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {showResults && (
          <>
            {/* Result card */}
            <div style={{ background: 'linear-gradient(155deg,#3B0764 0%,#4C1D95 35%,#5B21B6 65%,#7C3AED 100%)', borderRadius: 22, padding: '24px 20px 20px', marginBottom: 16, boxShadow: '0 10px 36px rgba(76,29,149,0.38)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '1.2px', marginBottom: 14 }}>
                {best ? 'BEST AVAILABLE RATE' : 'INDICATIVE RATE'}
              </div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  ⚡ {bestRate}% p.a. · {best ? best.name : 'Indicative'}
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px,9vw,52px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{elpFmtINR(Math.round(bestEMI))}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>/mo</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.5 }}>
                {tenure} months · {elpFmtINR(amount)} loan · {elpFmtINR(Math.round(bestInterest))} interest
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginBottom: overLimit ? 14 : 0 }} />
              {overLimit && (
                <div role="alert" style={{ background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#FDE68A', lineHeight: 1.5 }}>
                  ⚠️&nbsp; EMI is {Math.round((bestEMI / income) * 100)}% of your income (limit 40%) — try a longer tenure
                </div>
              )}
            </div>

            {/* Lender offers */}
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#2A1606', marginBottom: 12 }}>
              Lender offers for {elpFmtINR(amount)} over {tenure} months
            </h2>

            <div style={{ marginBottom: 16 }}>
              {!ready || (user && loadingOffers && !offers) ? (
                <div style={noteCard}>Finding lender offers…</div>
              ) : !user ? (
                <div style={noteCard}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1035', marginBottom: 6 }}>See live offers from our lending partners</div>
                  <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.55)', lineHeight: 1.5, marginBottom: 12 }}>
                    Create a free account to compare real rates and EMIs for this plan. No impact on your credit score.
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuth({ mode: 'signup' })}
                    style={{ background: '#6D28D9', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)', cursor: 'pointer' }}
                  >
                    Sign up to see offers
                  </button>
                </div>
              ) : offersError ? (
                <div style={{ ...noteCard, color: '#B91C1C' }} role="alert">{offersError}</div>
              ) : topOffers.length === 0 ? (
                <div style={noteCard}>No lender offers match this amount and tenure right now. Try a different amount, or talk to an advisor below.</div>
              ) : (
                topOffers.map((offer, idx) => <OfferCard key={offer.lenderId} offer={offer} isBest={idx === 0} amount={amount} tenure={tenure} income={income} />)
              )}
            </div>

            <Link
              href="/contact"
              style={{ display: 'block', textAlign: 'center', background: '#fff', color: '#6D28D9', border: '1.5px solid #6D28D9', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}
            >
              Talk to an advisor about this plan →
            </Link>

            <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.4)', lineHeight: 1.6, marginBottom: 20 }}>
              Rates are indicative for 2026. Final rate depends on your income, employment type and lender policy.
            </div>

            {/* Navesta perks */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#2A1606' }}>🎁 Navesta Perks</span>
                <span style={{ fontSize: 12, color: 'rgba(42,22,6,0.45)' }}>Exclusive benefits on loan disbursal</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div style={{ background: '#fff', border: '2px solid #6D28D9', borderRadius: 16, padding: '16px 14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: '#6D28D9', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '.3px', whiteSpace: 'nowrap' }}>✦ Exclusive</div>
                  <div style={{ marginTop: 10, fontSize: 28, marginBottom: 10 }} aria-hidden>{ev.perk1Emoji}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#1A1035', marginBottom: 6, lineHeight: 1.2 }}>{ev.perk1Val} {ev.perk1Label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.5)', lineHeight: 1.45, marginBottom: 10 }}>{ev.perk1Desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.perk1DotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: ev.perk1DotColor }}>{ev.perk1Partner}</span>
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1.5px solid rgba(196,168,130,0.25)', borderRadius: 16, padding: '16px 14px' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }} aria-hidden>💸</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#1A1035', marginBottom: 6, lineHeight: 1.2 }}>1% EMI Cashback</div>
                  <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.5)', lineHeight: 1.45, marginBottom: 10 }}>On your first 3 EMIs, credited to Navesta wallet</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>Navesta</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.35)', lineHeight: 1.55 }}>Perks are auto-credited within 48 hrs of loan disbursal. Subject to partner T&amp;Cs.</div>
            </div>

            {/* Smart tips */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#2A1606', marginBottom: 14 }}>💡 Smart tips for your {ev.title.toLowerCase()}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ev.tips.map((tip) => (
                  <div key={tip} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: '#6D28D9', fontSize: 13, flexShrink: 0, marginTop: 2 }} aria-hidden>◆</span>
                    <span style={{ fontSize: 13, color: 'rgba(42,22,6,0.7)', lineHeight: 1.6 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const noteCard: React.CSSProperties = { background: '#fff', borderRadius: 18, padding: 18, border: '1.5px solid rgba(196,168,130,0.25)', boxShadow: '0 2px 10px rgba(42,22,6,0.05)', fontSize: 13, color: 'rgba(42,22,6,0.6)', lineHeight: 1.5 };

function OfferCard({ offer, isBest, amount, tenure, income }: { offer: Offer; isBest: boolean; amount: number; tenure: number; income: number }) {
  const emi = pmt(amount, offer.offeredRatePercent, tenure);
  const totInt = emi * tenure - amount;
  const exceeds = income > 0 && emi > income * 0.4;
  const days = offer.disbursalDaysMin === offer.disbursalDaysMax ? `${offer.disbursalDaysMin}` : `${offer.disbursalDaysMin}–${offer.disbursalDaysMax}`;
  const tagline = `Disbursal in ${days} day${days === '1' ? '' : 's'} · ${offer.processingFeeRupees > 0 ? `${fmtINR(offer.processingFeeRupees)} processing` : 'No processing fee'}`;

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, border: isBest ? '2px solid #6D28D9' : '1.5px solid rgba(196,168,130,0.25)', boxShadow: '0 2px 10px rgba(42,22,6,0.05)' }}>
      {isBest && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ background: 'rgba(109,40,217,0.1)', color: '#5B21B6', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>⭐ Best rate</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: exceeds || offer.meetsMinimumScore === false ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: offer.brandColor || '#2563EB', flexShrink: 0, marginTop: 4 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1035', marginBottom: 2 }}>{offer.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.4)' }}>{tagline}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#5B21B6' }}>{offer.offeredRatePercent}% p.a.</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1035', lineHeight: 1.1 }}>
            {elpFmtINR(Math.round(emi))}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(42,22,6,0.5)' }}>/mo</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.45)' }}>+{elpFmtINR(Math.round(totInt))} interest</div>
        </div>
      </div>
      {exceeds && (
        <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>⚠️ EMI exceeds 40% of your income</div>
      )}
      {offer.meetsMinimumScore === false && (
        <div style={{ marginTop: exceeds ? 8 : 0, fontSize: 11, color: 'rgba(42,22,6,0.5)' }}>Usually needs a credit score of {offer.minCreditScore}+</div>
      )}
    </div>
  );
}

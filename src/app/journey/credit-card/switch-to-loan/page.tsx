'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { fetchOffers } from '@/lib/applyOffer';
import { DEFAULT_CC_JOURNEY, fmtCompact, fmtINR, useJourney } from '@/lib/journey';
import { cardMinOnlyInterest, cardMonthlyRate, combineCards, pmtMonthly } from '@/lib/ccPlanMath';

/* "Switch to a Loan." — design #cc-loan-page (prototype lines ~6352–6542, JS ~9799–10169) */

const NAVY = '#1A2E3F';
const GREEN = '#059669';
/** Illustrative starting personal-loan rate used throughout the design. */
const LOAN_RATE_PCT = 10.75;
const LOAN_R = LOAN_RATE_PCT / 100 / 12;
const GRID = [6, 18, 60] as const;
const CHART_TENURES = [6, 12, 18, 24, 30, 36, 42, 48, 54, 60];

export default function CCSwitchToLoanPage() {
  return (
    <JourneyGate intent="debt-cc">
      <SwitchScreen />
    </JourneyGate>
  );
}

function SwitchScreen() {
  const router = useRouter();
  const [cc, , , ready] = useJourney('cc', DEFAULT_CC_JOURNEY);
  const combined = useMemo(() => combineCards(cc.cards), [cc.cards]);

  const outstanding = combined.outstanding;
  const cardRate = combined.rate > 0 ? combined.rate : 42;
  const income = Number(cc.income) || 0;
  const incomeKnown = income > 0;
  const takeHome = income * 0.72;
  const safeEmi = takeHome * 0.4;

  const minOnlyTotal = useMemo(() => cardMinOnlyInterest(outstanding, cardRate), [outstanding, cardRate]);

  // Best option: the shortest tenure whose EMI fits within 40% of take-home pay
  // (the prototype's loop never moved off 6 months).
  const best = useMemo(() => {
    if (!incomeKnown || outstanding <= 0) return { n: 6, custom: false, affordable: !incomeKnown };
    for (const n of GRID) if (pmtMonthly(outstanding, LOAN_R, n) <= safeEmi) return { n, custom: false, affordable: true };
    for (let n = 61; n <= 84; n++) if (pmtMonthly(outstanding, LOAN_R, n) <= safeEmi) return { n, custom: true, affordable: true };
    return { n: 60, custom: false, affordable: false };
  }, [incomeKnown, outstanding, safeEmi]);

  const [sel, setSel] = useState<number | 'custom' | null>(null);
  const [customMonthsState, setCustomMonths] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [lowestRate, setLowestRate] = useState<number | null>(null);

  const isCustom = sel === 'custom' || (sel === null && best.custom);
  const customMonths = customMonthsState ?? (best.custom ? best.n : 24);
  const tenure = isCustom ? customMonths : sel === null ? best.n : (sel as number);

  const calc = (n: number) => {
    const emi = pmtMonthly(outstanding, LOAN_R, n);
    const totalInt = emi * n - outstanding;
    return { emi, totalInt, saving: Math.max(0, minOnlyTotal - totalInt) };
  };
  const cur = calc(tenure);

  // Real partner offers for the amount and tenure (debounced while sliding)
  useEffect(() => {
    if (outstanding <= 0) return;
    let live = true;
    const t = setTimeout(() => {
      fetchOffers(outstanding, tenure)
        .then((offers) => {
          if (live) setLowestRate(offers.length ? Math.min(...offers.map((o) => o.offeredRatePercent)) : null);
        })
        .catch(() => {
          if (live) setLowestRate(null);
        });
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [outstanding, tenure]);

  if (!ready) return null;

  const pct = incomeKnown ? Math.round((cur.emi / takeHome) * 100) : null;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/journey/credit-card/fixes" />

      <div style={{ padding: '28px 20px 80px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Page heading */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 10 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: GREEN, textTransform: 'uppercase' }}>Loan Optimiser</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,6vw,34px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', marginBottom: 6 }}>
            Switch to a <span style={{ color: GREEN, fontStyle: 'italic' }}>Loan.</span>
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.5)', lineHeight: 1.5 }}>Cut interest · check eligibility</div>
        </div>

        {outstanding <= 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Add your card balance first</div>
            <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.6, marginBottom: 16 }}>We need your outstanding balance to compare a loan with your cards.</div>
            <Link href="/journey/credit-card" style={{ display: 'inline-block', background: GREEN, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Add my cards →
            </Link>
          </div>
        ) : (
          <>
            {/* AI-MATCHED REFINANCE card */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(5,150,105,0.18)', borderRadius: 22, padding: '22px 20px', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(180,120,10,0.08)', border: '1.5px solid rgba(200,140,10,0.35)', borderRadius: 20, padding: '5px 12px', marginBottom: 18 }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#9A6A00', textTransform: 'uppercase' }}>AI-MATCHED REFINANCE</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#FFF5F5', border: '1.5px solid rgba(220,38,38,0.18)', borderRadius: 14, padding: 16, textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(42,22,6,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>CARDS NOW</div>
                  <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.45)', marginBottom: 4 }}>avg. rate</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>{Math.round(cardRate)}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.45)', marginTop: 4 }}>per year</div>
                  <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.45)' }}>no end date</div>
                </div>
                <div style={{ fontSize: 22, color: 'rgba(42,22,6,0.2)', flexShrink: 0 }} aria-hidden>
                  →
                </div>
                <div style={{ flex: 1, background: '#F0FDF9', border: '1.5px solid rgba(5,150,105,0.22)', borderRadius: 14, padding: 16, textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(42,22,6,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>PERSONAL LOAN</div>
                  <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.45)', marginBottom: 4 }}>Starts @</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{LOAN_RATE_PCT}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.45)', marginTop: 4 }}>per year</div>
                  <div style={{ fontSize: 10, color: 'rgba(42,22,6,0.45)' }}>{tenure} months</div>
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'rgba(42,22,6,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>YOU COULD SAVE</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 900, color: GREEN, lineHeight: 1, marginBottom: 6 }}>{fmtCompact(cur.saving)}</div>
                <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.55)' }}>
                  vs card minimum · EMI <span style={{ color: NAVY, fontWeight: 700 }}>{fmtINR(cur.emi)}/mo</span>
                </div>
              </div>

              <div style={{ background: '#F0FDF9', border: '1px solid rgba(5,150,105,0.18)', borderRadius: 10, padding: '10px 12px', marginTop: 14 }}>
                <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.6)', lineHeight: 1.55 }}>
                  💡 Starts @{LOAN_RATE_PCT}% per year — your actual rate is confirmed after the lender reviews your profile
                </div>
                {lowestRate !== null && (
                  <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, marginTop: 6 }}>Lowest rate from our partners: {lowestRate}% p.a.</div>
                )}
              </div>
            </div>

            {/* Pick your plan */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: 'uppercase', marginBottom: 6 }}>PICK YOUR PLAN</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 18, lineHeight: 1.2 }}>How long do you want to take?</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {GRID.map((n) => {
                  const c = calc(n);
                  const selected = !isCustom && tenure === n;
                  return (
                    <PlanCard
                      key={n}
                      selected={selected}
                      best={!best.custom && best.n === n}
                      onClick={() => setSel(n)}
                      title={`${n} months`}
                      titleColor={selected ? GREEN : NAVY}
                      emi={c.emi}
                      sub={`saves ${fmtCompact(c.saving)}`}
                    />
                  );
                })}
                <PlanCard
                  selected={isCustom}
                  best={best.custom}
                  onClick={() => setSel('custom')}
                  title="Choose myself"
                  titleColor={isCustom ? GREEN : 'rgba(26,46,63,0.5)'}
                  emi={isCustom ? cur.emi : null}
                  sub={isCustom ? `saves ${fmtCompact(cur.saving)} · ${customMonths}m` : 'choose months'}
                />
              </div>

              {isCustom && (
                <div style={{ marginBottom: 14, background: '#F0FDF9', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label htmlFor="ccl-custom-months" style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,46,63,0.6)' }}>
                      Choose tenure
                    </label>
                    <span style={{ fontSize: 16, fontWeight: 900, color: GREEN, fontFamily: 'var(--sans)' }}>
                      {customMonths} month{customMonths === 1 ? '' : 's'}
                    </span>
                  </div>
                  <input
                    id="ccl-custom-months"
                    type="range"
                    min={3}
                    max={84}
                    value={customMonths}
                    onChange={(e) => setCustomMonths(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: GREEN, height: 6, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)' }}>3m</span>
                    <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)' }}>84m</span>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.4)', lineHeight: 1.6 }}>
                Numbers based on a starting rate of {LOAN_RATE_PCT}% — your actual rate is confirmed by the lender after review.
              </div>
            </div>

            {/* Optimisation insight */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: 'uppercase', marginBottom: 6 }}>OPTIMISATION INSIGHT</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 12, lineHeight: 1.2 }}>Why {tenure} months?</h2>
              <div style={{ fontSize: 14, color: 'rgba(26,46,63,0.7)', lineHeight: 1.65, marginBottom: 16 }}>
                {pct === null ? (
                  <>Add your monthly income on the earlier step to see the shortest tenure your income supports — we keep your EMI within a safe 40% of take-home pay.</>
                ) : pct <= 40 ? (
                  tenure === best.n ? (
                    <>
                      {tenure} months is the <strong>shortest tenure your income supports</strong> — keeping your EMI within a safe 40% of take-home pay (yours: {pct}%). Shorter tenure = less total interest. This is your sweet spot.
                    </>
                  ) : (
                    <>
                      At {tenure} months your EMI is {pct}% of take-home — within the safe 40% limit. {best.affordable && best.n < tenure ? `${best.n} months is the shortest tenure your income supports and saves more interest.` : 'Shorter tenure = less total interest.'}
                    </>
                  )
                ) : (
                  <>
                    At {tenure} months, your EMI is {pct}% of take-home — above the 40% safety threshold. Consider a longer tenure to keep repayments comfortable.
                  </>
                )}
              </div>

              <TenureBars outstanding={outstanding} safeEmi={incomeKnown ? safeEmi : Infinity} selected={tenure} best={best.affordable && incomeKnown ? best.n : null} />
            </div>

            {/* Toggle comparison */}
            <button
              onClick={() => setShowCompare((v) => !v)}
              aria-expanded={showCompare}
              style={{ width: '100%', background: '#fff', border: `1.5px solid ${showCompare ? '#7C3AED' : '#2563EB'}`, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, color: showCompare ? '#7C3AED' : '#2563EB', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: 0.2, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {showCompare ? 'Hide comparison' : 'Show comparison'} <span style={{ fontSize: 16 }}>{showCompare ? '↑' : '↓'}</span>
            </button>

            {showCompare && <Comparison outstanding={outstanding} cardRate={cardRate} loanMonths={tenure} minOnlyTotal={minOnlyTotal} />}

            {/* Next step */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#2563EB', textTransform: 'uppercase', marginBottom: 8 }}>NEXT STEP</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: '#1E3A8A', marginBottom: 16, lineHeight: 1.3 }}>Compare loan offers from banks &amp; NBFCs</h2>
              <button
                onClick={() => router.push(`/journey/credit-card/offers?tenure=${tenure}`)}
                style={{ width: '100%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', border: 'none', borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: 0.2, boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = '')}
              >
                See offers →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlanCard(props: { selected: boolean; best: boolean; onClick: () => void; title: string; titleColor: string; emi: number | null; sub: string }) {
  const { selected, best, onClick, title, titleColor, emi, sub } = props;
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{ border: selected ? `2px solid ${GREEN}` : '2px solid rgba(26,46,63,0.1)', background: selected ? '#F0FDF4' : '#fff', borderRadius: 14, padding: 14, cursor: 'pointer', position: 'relative', textAlign: 'left', fontFamily: 'var(--sans)' }}
    >
      {best && (
        <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: GREEN, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 10, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>★ Best option</span>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: titleColor, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>
        <span style={{ fontSize: 12 }}>₹</span>
        {emi === null ? '–' : Math.round(emi).toLocaleString('en-IN')}
        <span style={{ fontSize: 12 }}>/mo</span>
      </div>
      <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginTop: 4 }}>{sub}</div>
    </button>
  );
}

/** Design cclRenderChart(): total loan interest by tenure, greyed where the EMI is too high for income. */
function TenureBars({ outstanding, safeEmi, selected, best }: { outstanding: number; safeEmi: number; selected: number; best: number | null }) {
  const data = CHART_TENURES.map((n) => {
    const emi = pmtMonthly(outstanding, LOAN_R, n);
    return { n, totalInt: emi * n - outstanding, affordable: emi <= safeEmi };
  });
  const maxInt = data[data.length - 1].totalInt || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.4)' }}>← total over loan term (less = better)</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: GREEN }}>+ Optimal</div>
      </div>
      {data.map((row) => {
        const barW = Math.max(4, Math.round((row.totalInt / maxInt) * 100));
        const isSel = row.n === selected;
        const isOpt = best !== null ? row.n === best : isSel;
        const barColor = !row.affordable ? 'rgba(26,46,63,0.15)' : isSel ? '#0D9488' : '#99D6CF';
        const lc = isSel ? '#0D9488' : row.affordable ? 'rgba(26,46,63,0.65)' : 'rgba(26,46,63,0.35)';
        const fw = isSel ? 800 : 600;
        return (
          <div key={row.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`${row.n} months: ${fmtINR(row.totalInt)} total interest${row.affordable ? '' : ' (EMI too high for income)'}`}>
            <div style={{ fontSize: 11, fontWeight: fw, color: lc, width: 38, flexShrink: 0 }}>
              {row.n}m{isOpt && <span style={{ color: '#0D9488', fontSize: 11 }}> ★</span>}
            </div>
            <div style={{ flex: 1, height: 9, background: 'rgba(26,46,63,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${barW}%`, background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: lc, fontWeight: fw, textAlign: 'right', minWidth: 60 }}>{fmtINR(row.totalInt)}</div>
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 9, background: '#0D9488', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.55)' }}>Affordable</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 9, background: 'rgba(26,46,63,0.15)', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.55)' }}>EMI too high for income</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: '#0D9488' }}>★</span>
          <span style={{ fontSize: 10, color: 'rgba(26,46,63,0.55)' }}>Optimal point</span>
        </div>
      </div>
    </div>
  );
}

/** Design cclDrawLineChart(): cumulative interest, loan vs cards on minimum only. */
function Comparison({ outstanding, cardRate, loanMonths, minOnlyTotal }: { outstanding: number; cardRate: number; loanMonths: number; minOnlyTotal: number }) {
  const cardR = cardMonthlyRate(cardRate);
  const loanEMI = pmtMonthly(outstanding, LOAN_R, loanMonths);
  const minPay = Math.max(outstanding * 0.05, 200);

  const loanPts = [{ m: 0, v: 0 }];
  const cardPts = [{ m: 0, v: 0 }];
  let loanBal = outstanding;
  let cardBal = outstanding;
  let loanCum = 0;
  let cardCum = 0;
  for (let i = 1; i <= loanMonths; i++) {
    if (loanBal > 0.01) {
      const li = loanBal * LOAN_R;
      loanCum += li;
      loanBal = Math.max(0, loanBal + li - loanEMI);
    }
    if (cardBal > 0.01) {
      const ci = cardBal * cardR;
      cardCum += ci;
      const pay = Math.min(minPay, cardBal + ci);
      cardBal = Math.max(0, cardBal + ci - pay);
    }
    loanPts.push({ m: i, v: loanCum });
    cardPts.push({ m: i, v: cardCum });
  }

  let maxV = Math.max(cardCum, loanCum) * 1.08;
  if (!maxV || maxV <= 0) maxV = outstanding;
  const pad = { l: 55, r: 10, t: 10, b: 30 };
  const W = 320;
  const H = 180;
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const px = (m: number) => pad.l + (m / loanMonths) * cw;
  const py = (v: number) => pad.t + ch - (v / maxV) * ch;

  // ~4 evenly spaced "nice" ticks
  const raw = maxV / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const yTicks: number[] = [];
  for (let t = 0; t <= maxV; t += step) yTicks.push(t);
  const fmtY = (v: number) => (v >= 100000 ? '₹' + (v / 100000).toFixed(1).replace('.0', '') + 'L' : '₹' + Math.round(v).toLocaleString('en-IN'));

  const xTicks = Array.from(new Set([0, Math.round(loanMonths / 2), loanMonths]));
  const line = (pts: { m: number; v: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.m).toFixed(1)} ${py(p.v).toFixed(1)}`).join(' ');
  const greenArea = `${line(loanPts)} L ${px(loanMonths).toFixed(1)} ${py(0).toFixed(1)} Z`;
  const lp = loanPts[loanPts.length - 1];
  const cp = cardPts[cardPts.length - 1];
  const totalSaving = Math.max(0, minOnlyTotal - lp.v);
  const label = `Cumulative interest over ${loanMonths} months: ${fmtINR(lp.v)} with a loan versus ${fmtINR(cp.v)} on cards paying the minimum.`;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: 'uppercase', marginBottom: 6 }}>INTEREST YOU&apos;D PAY</div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 12, lineHeight: 1.2 }}>Card route vs Loan route</h2>
      <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.65)', lineHeight: 1.6, marginBottom: 20 }}>
        🔴 Cards only — interest piles up with no end date. 🟢 With a loan — fixed end, far less total interest.
      </div>

      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', marginBottom: 12 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label} style={{ display: 'block', fontFamily: 'var(--sans)' }}>
          <title>{label}</title>
          {yTicks.map((t) => {
            const y = py(t);
            if (y < pad.t || y > pad.t + ch + 2) return null;
            return (
              <g key={t}>
                <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(26,46,63,0.07)" strokeWidth="1" />
                <text x={pad.l - 4} y={y + 4} fontSize="9" fill="rgba(26,46,63,0.4)" textAnchor="end">
                  {fmtY(t)}
                </text>
              </g>
            );
          })}
          {xTicks.map((m) => {
            const isSel = m === loanMonths;
            return (
              <text key={m} x={px(m)} y={H - pad.b + 14} fontSize={isSel ? 10 : 9} fontWeight={isSel ? 800 : 400} fill={isSel ? NAVY : 'rgba(26,46,63,0.4)'} textAnchor={m === 0 ? 'start' : isSel ? 'end' : 'middle'}>
                {m}m
              </text>
            );
          })}
          <path d={greenArea} fill="rgba(5,150,105,0.08)" />
          <path d={line(cardPts)} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={line(loanPts)} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={px(lp.m)} cy={py(lp.v)} r="4" fill={GREEN} />
          <text x={px(lp.m) - 6} y={py(lp.v) - 8} fontSize="9" fontWeight="700" fill={GREEN} textAnchor="end">
            {fmtINR(lp.v)}
          </text>
          <circle cx={px(cp.m)} cy={py(cp.v)} r="4" fill="#EF4444" />
          <text x={px(cp.m) - 6} y={py(cp.v) - 8} fontSize="9" fontWeight="700" fill="#EF4444" textAnchor="end">
            {fmtINR(cp.v)}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 3, background: GREEN, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: 'rgba(26,46,63,0.65)' }}>With a loan ({LOAN_RATE_PCT}% illustrated)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 3, background: '#EF4444', borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: 'rgba(26,46,63,0.65)' }}>Cards · minimum only</span>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.7)', lineHeight: 1.65, marginBottom: 16 }}>
        After <strong>{loanMonths} months</strong> the loan is fully cleared. On cards only, you&apos;d still owe <strong>{fmtCompact(cardBal)}</strong> and have paid{' '}
        <strong>{fmtINR(cp.v)}</strong> in interest by then.
      </div>

      <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#065F46', textTransform: 'uppercase', marginBottom: 8 }}>YOU SAVE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }} aria-hidden>
            💰
          </span>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{fmtCompact(totalSaving)}</div>
        </div>
        <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.55 }}>vs staying on card minimum · illustrated at {LOAN_RATE_PCT}% p.a. (your rate will vary)</div>
      </div>
    </div>
  );
}

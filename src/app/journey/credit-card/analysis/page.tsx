'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { fmtINR, useJourney, type CardEntry } from '@/lib/journey';
import { EMPTY_CC_JOURNEY, fmtLakh, hasCardDetails, minPayProjection, monthlySplit, weightedCard } from '@/lib/ccMath';

// Design: #cc-analysis-page (Navesta_Website_22Sep26.html ~5603–5806),
// populated by submitCCDetails (~7470–7670).

const BG = 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CCAnalysisPage() {
  return (
    <JourneyGate intent="debt-cc">
      <Analysis />
    </JourneyGate>
  );
}

function Analysis() {
  const router = useRouter();
  const [journey, , , ready] = useJourney('cc', EMPTY_CC_JOURNEY);
  const [tab, setTab] = useState<'cards' | 'know'>('cards');
  const filled = hasCardDetails(journey);

  useEffect(() => {
    if (ready && !filled) router.replace('/journey/credit-card');
  }, [ready, filled, router]);

  if (!ready || !filled) return <div className="nv" style={{ minHeight: '100vh', background: BG }} />;

  const cards = journey.cards.filter((c) => c.outstanding > 0);
  const d = weightedCard(cards);
  const split = monthlySplit(d.outstanding, d.rate, d.minDue);
  const m3 = new Date();
  m3.setDate(1);
  m3.setMonth(m3.getMonth() + 3);
  const patternL = ((d.outstanding * 0.43) / 100000).toFixed(1);
  const limitPct = d.limit > 0 ? Math.round((d.outstanding / d.limit) * 100) : null;

  const income = journey.income;
  const debtMult = income > 0 ? d.outstanding / income : 0;
  const debtMultR = (Math.round(debtMult * 10) / 10).toFixed(1);
  const barPct = Math.min(98, (debtMult / 4) * 100);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 6px',
    border: 'none',
    borderRadius: 11,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
    transition: 'all .2s',
    background: active ? '#fff' : 'transparent',
    color: active ? '#2A1606' : 'rgba(42,22,6,0.45)',
    boxShadow: active ? '0 2px 8px rgba(58,35,16,0.10)' : 'none',
  });

  return (
    <div className="nv" style={{ minHeight: '100vh', background: BG, fontFamily: 'var(--sans)', overflowX: 'hidden', width: '100%' }}>
      <JourneyHeader backHref="/journey/credit-card" />

      <div style={{ padding: '28px 24px 120px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Page heading */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 10 }} aria-hidden>
              💳
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#DC2626', textTransform: 'uppercase' }}>Your Credit-Card Debt</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,6vw,34px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', marginBottom: 6 }}>
            Where your money <span style={{ color: '#DC2626', fontStyle: 'italic' }}>really</span> goes.
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.5)', lineHeight: 1.5 }}>Analysing your cards · a pattern worth ₹{patternL}L</div>
        </div>

        {/* Payment breakdown card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 20px 20px', boxShadow: '0 4px 24px rgba(58,35,16,0.08)', marginBottom: 20 }}>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(42,22,6,0.5)', marginBottom: 6 }}>This month you paid</div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 'clamp(40px,12vw,52px)', fontWeight: 900, color: '#2A1606', lineHeight: 1, marginBottom: 20, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(d.minDue)}</div>

          <div
            role="img"
            aria-label={`${split.intPct}% of your payment goes to interest and GST, ${split.clearedPct}% clears debt`}
            style={{ height: 10, borderRadius: 8, background: `linear-gradient(90deg,#DC2626 ${split.intPct}%,#0D9488 ${split.intPct}%)`, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', letterSpacing: '.8px' }}>▶ INTEREST + GST</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#0D9488', letterSpacing: '.8px' }}>DEBT CLEARED ◀</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'linear-gradient(145deg,#FFF1F2,#FFE4E6)', border: '1.5px solid rgba(220,38,38,0.15)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }} aria-hidden>
                🏦
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#991B1B', letterSpacing: '.8px', marginBottom: 10 }}>INTEREST + GST</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(19px,5.5vw,24px)', fontWeight: 900, color: '#DC2626', marginBottom: 4 }}>{fmtINR(split.interestGST)}</div>
              <div style={{ fontSize: 12, color: 'rgba(153,27,27,0.65)' }}>{split.intPct}% of payment</div>
              <div style={{ fontSize: 10, color: 'rgba(153,27,27,0.5)', marginTop: 6, lineHeight: 1.4 }}>({(d.rate / 12).toFixed(2)}%/mo + 18% GST)</div>
            </div>
            <div style={{ background: 'linear-gradient(145deg,#F0FDFA,#CCFBF1)', border: '1.5px solid rgba(13,148,136,0.2)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }} aria-hidden>
                ✅
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0F766E', letterSpacing: '.8px', marginBottom: 10 }}>DEBT CLEARED</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(19px,5.5vw,24px)', fontWeight: 900, color: '#0D9488', marginBottom: 4 }}>{fmtINR(split.cleared)}</div>
              <div style={{ fontSize: 12, color: 'rgba(15,118,110,0.65)', marginBottom: 4 }}>{split.clearedPct}% of payment</div>
              <div style={{ fontSize: 11, color: 'rgba(15,118,110,0.55)' }}>
                Reduces your
                <br />
                outstanding
              </div>
            </div>
          </div>
        </div>

        {/* Debt trajectory card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 24px rgba(58,35,16,0.08)', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginBottom: 4 }}>You owe today</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,5.5vw,26px)', fontWeight: 900, color: '#2A1606', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(d.outstanding)}</div>
            </div>
            <div style={{ fontSize: 22, color: 'rgba(42,22,6,0.3)' }} aria-hidden>
              →
            </div>
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginBottom: 4 }}>You&apos;ll owe in {MONTHS[m3.getMonth()]}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,5.5vw,26px)', fontWeight: 900, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(split.owe3m)}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.55)', lineHeight: 1.5, borderTop: '1px solid rgba(196,168,130,0.2)', paddingTop: 14 }}>
            Three more payments of about {fmtINR(d.minDue)} — and your debt barely moves.
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => router.push('/journey/credit-card/fixes')}
          style={{ width: '100%', background: 'linear-gradient(135deg,#1463C5,#0D4FA0)', border: 'none', borderRadius: 16, padding: 18, fontSize: 17, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 8px 28px rgba(20,99,197,0.35)', letterSpacing: '.2px' }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = '')}
        >
          Show me how to fix this →
        </button>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'rgba(42,22,6,0.35)' }}>Your personalised debt escape plan</div>

        {/* Tabs */}
        <div role="tablist" aria-label="Card analysis" style={{ display: 'flex', background: 'rgba(196,168,130,0.2)', borderRadius: 14, padding: 3, margin: '28px 0 0' }}>
          <button type="button" role="tab" id="cca-tab-cards" aria-selected={tab === 'cards'} aria-controls="cca-panel-cards" onClick={() => setTab('cards')} style={tabBtn(tab === 'cards')}>
            Your cards
          </button>
          <button type="button" role="tab" id="cca-tab-know" aria-selected={tab === 'know'} aria-controls="cca-panel-know" onClick={() => setTab('know')} style={tabBtn(tab === 'know')}>
            Know more
          </button>
        </div>

        {tab === 'cards' && (
          <div id="cca-panel-cards" role="tabpanel" aria-labelledby="cca-tab-cards" style={{ marginTop: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 4px 20px rgba(58,35,16,0.07)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#2A1606' }}>Your cards</span>
                {cards.length > 1 && <span style={{ fontSize: 13, color: 'rgba(42,22,6,0.4)', fontWeight: 500 }}>swipe →</span>}
              </div>

              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', marginBottom: 16, paddingBottom: cards.length > 1 ? 4 : 0 }}>
                {cards.map((c, i) => (
                  <CardVisual key={i} card={c} />
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2A1606' }}>Card limit used</span>
                  <span
                    title="Outstanding ÷ Credit limit"
                    aria-label="Outstanding divided by credit limit"
                    style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,153,207,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1099CF', fontWeight: 700, cursor: 'default' }}
                  >
                    ?
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2A1606', marginLeft: 2 }}>{limitPct === null ? '—' : `${limitPct}%`}</span>
                </div>
                <div style={{ height: 10, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(90deg,#22c55e 0%,#22c55e 30%,#eab308 30%,#eab308 70%,#ef4444 70%)', position: 'relative', marginBottom: 6 }}>
                  {limitPct !== null && (
                    <div style={{ position: 'absolute', top: -3, left: `${Math.min(96, limitPct)}%`, width: 4, height: 16, background: '#2A1606', borderRadius: 2, transform: 'translateX(-50%)', transition: 'left .5s' }} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Good &lt;30%</span>
                  <span style={{ fontSize: 11, color: '#ca8a04', fontWeight: 600 }}>Watch 30–70%</span>
                  <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>High</span>
                </div>
                {limitPct === null && <div style={{ fontSize: 11, color: 'rgba(42,22,6,0.45)', marginTop: 8 }}>Add your credit limit on the previous step to see how much of it you use.</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'know' && (
          <div id="cca-panel-know" role="tabpanel" aria-labelledby="cca-tab-know" style={{ marginTop: 20 }}>
            {/* Reality check: Debt vs income */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(58,35,16,0.07)', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#E07C10', textTransform: 'uppercase', marginBottom: 4 }}>Reality Check</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: '#2A1606' }}>Debt vs income</div>
                <div style={{ background: '#FEF3C7', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#92400E', whiteSpace: 'nowrap' }}>{debtMultR}x income</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 14, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.8px', color: 'rgba(42,22,6,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>Monthly Income</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(17px,5vw,22px)', fontWeight: 900, color: '#2A1606' }}>{fmtINR(income)}</div>
                </div>
                <div style={{ background: '#FFF7ED', borderRadius: 12, padding: 14, border: '1.5px solid rgba(220,38,38,0.1)', minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.8px', color: 'rgba(42,22,6,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>You Owe</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(17px,5vw,22px)', fontWeight: 900, color: '#DC2626' }}>{fmtINR(d.outstanding)}</div>
                </div>
              </div>
              <div style={{ position: 'relative', height: 8, background: 'linear-gradient(90deg,#22c55e 0%,#22c55e 25%,#eab308 25%,#eab308 50%,#f97316 50%,#f97316 75%,#dc2626 75%)', borderRadius: 4, marginBottom: 6 }}>
                <div style={{ position: 'absolute', top: -5, width: 14, height: 18, background: '#2A1606', borderRadius: 3, left: `${barPct.toFixed(1)}%`, transform: 'translateX(-50%)', transition: 'left .6s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                {['0×', '1×', '2×', '3×', '4×'].map((t) => (
                  <span key={t} style={{ fontSize: 11, color: 'rgba(42,22,6,0.4)' }}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.6)', lineHeight: 1.55 }}>
                You&apos;d need <strong>{debtMultR} months</strong> of your entire income to clear this outright.
              </div>
            </div>

            {/* Keep paying the minimum */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(58,35,16,0.07)', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#DC2626', textTransform: 'uppercase', marginBottom: 4 }}>Keep Paying the Minimum</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: '#2A1606', marginBottom: 4 }}>What you&apos;ll hand over</div>
              <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginBottom: 14 }}>Amount paid vs debt remaining, month by month.</div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="24" height="6" aria-hidden>
                    <line x1="0" y1="3" x2="24" y2="3" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="12" cy="3" r="3" fill="#1e40af" />
                  </svg>
                  <span style={{ fontSize: 11, color: 'rgba(42,22,6,0.6)', fontWeight: 500 }}>Paid to Bank</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="24" height="6" aria-hidden>
                    <line x1="0" y1="3" x2="24" y2="3" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="12" cy="3" r="3" fill="#ea580c" />
                  </svg>
                  <span style={{ fontSize: 11, color: 'rgba(42,22,6,0.6)', fontWeight: 500 }}>Still Owed</span>
                </div>
              </div>
              <MinPayChart outstanding={d.outstanding} rate={d.rate} minDue={d.minDue} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CardVisual({ card }: { card: CardEntry }) {
  const bank = (card.bank.trim() || 'Bank').split(/\s+/)[0].toLowerCase().substring(0, 8);
  const limitPct = card.limit > 0 ? `${Math.round((card.outstanding / card.limit) * 100)}%` : '—';
  return (
    <div style={{ background: 'linear-gradient(135deg,#1a3a6b 0%,#1e4d8c 50%,#2a6099 100%)', borderRadius: 20, padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', minHeight: 155, boxSizing: 'border-box', width: '100%', maxWidth: 320, flex: '0 0 min(100%, 320px)', scrollSnapAlign: 'start' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 72% 18%,rgba(255,255,255,0.13) 0%,transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '.5px', fontFamily: 'var(--sans)' }}>{bank}</div>
        <div style={{ fontStyle: 'italic', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 1, fontFamily: 'var(--serif)' }}>VISA</div>
      </div>
      <div style={{ width: 38, height: 28, background: 'linear-gradient(135deg,#D4A017,#B8860B)', borderRadius: 5, marginBottom: 12, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 17, border: '1.5px solid rgba(0,0,0,0.3)', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: 3, textTransform: 'uppercase' }}>Outstanding</div>
          <div style={{ fontSize: 'clamp(19px,5.5vw,24px)', fontWeight: 900, color: '#fff', fontFamily: 'var(--serif)', letterSpacing: '.5px' }}>{fmtINR(card.outstanding)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: 3, textTransform: 'uppercase' }}>Limit Used · Rate</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {limitPct} · {card.rate.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/** Design's min-payment projection chart (milestones 3M…24M), drawn as SVG. */
function MinPayChart({ outstanding, rate, minDue }: { outstanding: number; rate: number; minDue: number }) {
  const { milestones, owed, paid } = minPayProjection(outstanding, rate, minDue);
  const N = milestones.length;
  const W = 320;
  const H = 210;
  const padL = 14;
  const padR = 14;
  const padT = 34;
  const padB = 26;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const maxV = Math.max(1, ...owed, ...paid) * 1.25;
  const xAt = (i: number) => padL + (i / (N - 1)) * cW;
  const yAt = (v: number) => padT + cH - (v / maxV) * cH;
  const oPts = owed.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const pPts = paid.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x)},${Math.round(p.y)}`).join(' ');
  const area = (pts: { x: number; y: number }[]) => `${line(pts)} L${Math.round(pts[N - 1].x)},${padT + cH} L${Math.round(pts[0].x)},${padT + cH} Z`;
  const base = padT + cH;

  const summary = milestones.map((m, i) => `${m} months: paid ${fmtLakh(paid[i])}, still owed ${fmtLakh(owed[i])}`).join('; ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Paying only the minimum. ${summary}.`} style={{ display: 'block', maxWidth: '100%', overflow: 'hidden' }} shapeRendering="geometricPrecision" textRendering="optimizeLegibility">
      <defs>
        <linearGradient id="cca-oGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="cca-pGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e40af" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {milestones.map((_, i) => (
        <line key={`g${i}`} x1={xAt(i).toFixed(1)} y1={padT} x2={xAt(i).toFixed(1)} y2={base} stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3,3" />
      ))}
      <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {N === owed.length && N > 1 && (
        <>
          <path d={area(oPts)} fill="url(#cca-oGrad)" />
          <path d={area(pPts)} fill="url(#cca-pGrad)" />
          <path d={line(oPts)} fill="none" stroke="#ea580c" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
          <path d={line(pPts)} fill="none" stroke="#1e40af" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
          {milestones.map((m, i) => {
            const o = oPts[i];
            const p = pPts[i];
            const anchor = i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle';
            const blueAbove = p.y < o.y;
            return (
              <g key={m}>
                <circle cx={Math.round(o.x)} cy={Math.round(o.y)} r="5.5" fill="#ea580c" stroke="#fff" strokeWidth="2" />
                <text x={Math.round(o.x)} y={Math.round(o.y - 11)} textAnchor={anchor} fontSize="10.5" fill="#ea580c" fontWeight="800" fontFamily="Inter,sans-serif">
                  {fmtLakh(owed[i])}
                </text>
                <circle cx={Math.round(p.x)} cy={Math.round(p.y)} r="5.5" fill="#1e40af" stroke="#fff" strokeWidth="2" />
                <text x={Math.round(p.x)} y={blueAbove ? Math.round(p.y - 11) : Math.round(p.y + 16)} textAnchor={anchor} fontSize="10.5" fill="#1e40af" fontWeight="800" fontFamily="Inter,sans-serif">
                  {fmtLakh(paid[i])}
                </text>
                <text x={Math.round(o.x)} y={base + 16} textAnchor={anchor} fontSize="10.5" fill="rgba(42,22,6,0.4)" fontFamily="Inter,sans-serif">
                  {m}M
                </text>
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}

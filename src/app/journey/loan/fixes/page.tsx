'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { DEFAULT_LOAN_JOURNEY, fmtCompact, useJourney, type LoanJourney } from '@/lib/journey';
import { fetchOffers, type Offer } from '@/lib/applyOffer';
import { FIXES_TYPE_LABEL, analyzeLoan, fmtRate, interestSavedAtRate, isUsableLoan, payChartSeries, simulatePrepay, type PayPoint } from '@/lib/loanMath';

// Design: #loan-fixes-page (Navesta_Website_22Sep26.html ~5093–5296, JS ~8742–8944 and ~9434–9591)

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

const whiteCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  marginBottom: 14,
  boxShadow: '0 1px 4px rgba(28,8,0,0.05),0 6px 20px rgba(28,8,0,0.09)',
};

const tile: React.CSSProperties = { background: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: '14px 12px' };
const tileNum: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' };
const tileLbl: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 };
const statTile: React.CSSProperties = { background: '#F5F0EA', borderRadius: 14, padding: '14px 12px' };
const statLbl: React.CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(42,22,6,0.45)', marginBottom: 6 };

const CHIPS = [
  { label: '10%', pct: 0.1 },
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.5 },
  { label: 'Close', pct: 1, sub: 'full loan' },
];

export default function LoanFixesPage() {
  return (
    <JourneyGate intent="debt-loan">
      <LoanFixes />
    </JourneyGate>
  );
}

function LoanFixes() {
  const router = useRouter();
  const [loan, , , ready] = useJourney<LoanJourney>('loan', DEFAULT_LOAN_JOURNEY);
  const [chartOpen, setChartOpen] = useState(false);
  const [prepayOpen, setPrepayOpen] = useState(true);
  const [prepay, setPrepay] = useState('');
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);

  const usable = isUsableLoan(loan);

  // Default prepayment: 10% of outstanding (lfBuildChips)
  useEffect(() => {
    if (ready) setPrepay(String(Math.round(loan.outstanding * 0.1)));
  }, [ready, loan.outstanding]);

  // Real lenders instead of the prototype's hard-coded 9.9%
  useEffect(() => {
    if (!ready || !usable) return;
    let alive = true;
    setOffers(null);
    setOffersError(null);
    fetchOffers(loan.outstanding, loan.tenureLeft)
      .then((list) => alive && setOffers(list))
      .catch((err: Error) => alive && setOffersError(err.message || 'Could not load lender rates'));
    return () => {
      alive = false;
    };
  }, [ready, usable, loan.outstanding, loan.tenureLeft]);

  if (!ready) return null;

  const typeStr = FIXES_TYPE_LABEL[loan.loanType] ?? 'PERSONAL';
  const a = analyzeLoan(loan);
  const pp = Math.round(a.principalPct);
  const ip = 100 - pp;
  const prepayNum = parseFloat(prepay) || 0;
  const sim = simulatePrepay(loan, prepayNum);
  const activeChip = CHIPS.findIndex((c) => Math.round(loan.outstanding * c.pct) === Math.round(prepayNum));

  const best = offers && offers.length ? offers[0] : null;
  const better = best && best.offeredRatePercent < loan.rate ? best : null;
  const btSave = better ? interestSavedAtRate(loan, better.offeredRatePercent) : 0;

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/journey/loan/analysis" />

      <div style={{ padding: '28px 20px 4px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(196,96,16,0.08)', border: '1px solid rgba(196,96,16,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#C96010', textTransform: 'uppercase' }}>{typeStr} · LOAN FIXES</span>
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px,5.5vw,30px)', fontWeight: 900, lineHeight: 1.2, color: '#2A1606', marginBottom: 6 }}>Your Loan Fixes</h1>
        <p style={{ fontSize: 14, color: 'rgba(42,22,6,0.55)', marginBottom: 0 }}>Refinance · prepay · restructure · foreclose</p>
      </div>

      <div style={{ padding: '16px 16px 60px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        {!usable ? (
          <div style={{ ...whiteCard, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#7A5E44', marginBottom: 16 }}>We need your outstanding amount, tenure left and interest rate first.</p>
            <Link href="/journey/loan" style={{ color: '#0D9488', fontWeight: 700 }}>
              Enter loan details →
            </Link>
          </div>
        ) : (
          <>
            {/* LOAN SNAPSHOT dark card */}
            <div style={{ background: 'linear-gradient(145deg,#0D2B3E 0%,#0A1E2E 100%)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#0D9488', marginBottom: 14 }}>{typeStr} · LOAN SNAPSHOT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={tile}>
                  <div style={tileNum}>₹{fmt(loan.outstanding)}</div>
                  <div style={tileLbl}>Outstanding</div>
                </div>
                <div style={tile}>
                  <div style={tileNum}>{fmtRate(loan.rate)}% yearly</div>
                  <div style={tileLbl}>Interest rate</div>
                </div>
                <div style={tile}>
                  <div style={tileNum}>₹{fmt(a.emi)}/mo</div>
                  <div style={tileLbl}>Monthly EMI</div>
                </div>
                <div style={tile}>
                  <div style={tileNum}>{loan.tenureLeft} months</div>
                  <div style={tileLbl}>Remaining tenure</div>
                </div>
              </div>
              <div style={{ display: 'flex', height: 8, borderRadius: 8, overflow: 'hidden', marginBottom: 7 }} role="img" aria-label={`Principal ${pp}%, interest ${ip}%`}>
                <div style={{ background: '#10B981', transition: 'width .5s', width: `${pp}%` }} />
                <div style={{ background: '#F87171', flex: 1 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Principal {pp}%</div>
                <div style={{ fontSize: 13, color: '#F87171', fontWeight: 600 }}>
                  Interest {ip}% = ₹{fmt(a.totalInterest)}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>Of every rupee you repay from here, {ip}¢ goes to interest. The tools below help cut that.</div>
            </div>

            {/* WHAT YOU'LL HAND OVER chart (accordion) */}
            <div style={{ ...whiteCard, overflow: 'hidden' }}>
              <button
                type="button"
                aria-expanded={chartOpen}
                onClick={() => setChartOpen((o) => !o)}
                style={{ width: '100%', padding: '18px 20px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, userSelect: 'none', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'var(--sans)' }}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#DC2626', textTransform: 'uppercase', marginBottom: 3 }}>Keep Paying the EMI</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 700, color: '#2A1606', lineHeight: 1.2 }}>What you&apos;ll hand over</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF5EC', border: '1.5px solid rgba(201,96,16,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.25s', transform: chartOpen ? 'rotate(180deg)' : undefined }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C96010" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </button>
              {chartOpen && (
                <div style={{ padding: '0 20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginBottom: 14 }}>Cumulative paid vs balance remaining, month by month.</div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                    <Legend color="#1e40af" label="Paid to Bank" />
                    <Legend color="#ea580c" label="Still Owed" />
                  </div>
                  <PayChart points={payChartSeries(loan)} />
                </div>
              )}
            </div>

            {/* PART-PREPAYMENT */}
            <div style={{ ...whiteCard, padding: 20 }}>
              <div onClick={() => setPrepayOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#0F766E,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }} aria-hidden>
                  💰
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2A1606' }}>Part-prepayment</div>
                  <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lump sum → cuts principal &amp; interest</div>
                </div>
                <button
                  type="button"
                  aria-expanded={prepayOpen}
                  aria-controls="lf-prepay-body"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrepayOpen((o) => !o);
                  }}
                  style={{ padding: '7px 14px', background: 'transparent', border: '1.5px solid #0D9488', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#0D9488', cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}
                >
                  Simulate
                </button>
                <span style={{ fontSize: 16, color: '#0D9488', transition: 'transform .25s', flexShrink: 0, transform: prepayOpen ? 'rotate(180deg)' : undefined }} aria-hidden>
                  ▾
                </span>
              </div>

              {prepayOpen && (
                <div id="lf-prepay-body" style={{ marginTop: 18, borderTop: '1px solid rgba(196,168,130,0.2)', paddingTop: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#0D9488', marginBottom: 8 }}>PREPAYMENT SIMULATOR</div>
                  <p style={{ fontSize: 13, color: 'rgba(42,22,6,0.6)', lineHeight: 1.55, marginBottom: 16 }}>A lump-sum goes straight to your principal — shrinks interest and ends the loan sooner. Try any amount.</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FDFAF5', border: '2px solid #0D9488', borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#0D9488' }} aria-hidden>
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      aria-label="Prepayment amount in rupees"
                      placeholder="0"
                      value={prepay}
                      onChange={(e) => setPrepay(e.target.value)}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 26, fontWeight: 700, color: '#2A1606', background: 'transparent', fontFamily: 'var(--sans)', minWidth: 0 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
                    {CHIPS.map((c, i) => {
                      const amt = Math.round(loan.outstanding * c.pct);
                      const active = i === activeChip;
                      return (
                        <button
                          type="button"
                          key={c.label}
                          aria-pressed={active}
                          onClick={() => setPrepay(String(amt))}
                          style={{ background: active ? '#0D9488' : '#F5F0EA', borderRadius: 12, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', border: 'none', fontFamily: 'var(--sans)', minWidth: 0 }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 800, color: active ? '#fff' : '#2A1606' }}>{c.label}</div>
                          <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.8)' : 'rgba(42,22,6,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sub || fmtCompact(amt)}</div>
                        </button>
                      );
                    })}
                  </div>

                  {sim && (
                    <>
                      <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid rgba(13,148,136,0.2)', borderRadius: 16, padding: 18, textAlign: 'center', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#065F46', marginBottom: 6 }}>YOU SAVE</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 900, color: '#0D9488', lineHeight: 1, marginBottom: 6 }}>₹{fmt(sim.saved)}</div>
                        <div style={{ fontSize: 13, color: 'rgba(6,95,70,0.7)' }}>in interest · loan closes {sim.monthsFreed} months sooner</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div style={statTile}>
                          <div style={statLbl}>NEW TENURE</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#0D9488' }}>{sim.newTenure} months</div>
                        </div>
                        <div style={statTile}>
                          <div style={statLbl}>MONTHS FREED</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#2A1606' }}>{sim.monthsFreed} months</div>
                        </div>
                        <div style={statTile}>
                          <div style={statLbl}>INTEREST BEFORE</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#2A1606' }}>₹{fmt(a.totalInterest)}</div>
                        </div>
                        <div style={statTile}>
                          <div style={statLbl}>INTEREST AFTER</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#0D9488' }}>₹{fmt(sim.newInterest)}</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', width: 38, flexShrink: 0 }}>Before</div>
                          <div style={{ flex: 1, height: 8, borderRadius: 6, background: '#F87171' }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#F87171', whiteSpace: 'nowrap' }}>₹{fmt(a.totalInterest)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', width: 38, flexShrink: 0 }}>After</div>
                          <div style={{ flex: 1, display: 'flex' }}>
                            <div style={{ height: 8, borderRadius: 6, background: '#10B981', transition: 'width .5s', width: `${sim.afterPct}%` }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', whiteSpace: 'nowrap' }}>₹{fmt(sim.newInterest)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', textAlign: 'center', paddingTop: 4 }}>
                          A {sim.prepayPct}% prepayment eliminates {sim.savePct}% of remaining interest
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* BALANCE TRANSFER card */}
            <div style={{ ...whiteCard, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#1E40AF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }} aria-hidden>
                  🔄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2A1606' }}>Balance transfer</div>
                  <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginTop: 2 }}>
                    {better
                      ? `Move ${fmtRate(loan.rate)}% → ${fmtRate(better.offeredRatePercent)}% · save on interest`
                      : offers && !better
                        ? 'Your rate is already competitive — no better offers found.'
                        : 'Move to a lower-rate lender · save on interest'}
                  </div>
                </div>
                {better && (
                  <div style={{ padding: '5px 12px', background: 'rgba(37,99,235,0.1)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>Save ₹{fmt(btSave)}</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#F5F0EA', borderRadius: 14, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(42,22,6,0.45)', marginBottom: 5 }}>YOUR RATE NOW</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#2A1606' }}>{fmtRate(loan.rate)}%</div>
                </div>
                <div style={{ fontSize: 18, color: 'rgba(42,22,6,0.4)' }} aria-hidden>
                  →
                </div>
                <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid rgba(13,148,136,0.2)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 5 }}>BEST AVAILABLE</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#0D9488' }}>{best ? `${fmtRate(best.offeredRatePercent)}%` : offersError || (offers && !best) ? '—' : '…'}</div>
                </div>
              </div>
              {offersError && (
                <div role="alert" style={{ fontSize: 12, color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>
                  {offersError}
                </div>
              )}
              <button
                type="button"
                onClick={() => router.push('/journey/loan/balance-transfer')}
                style={{ width: '100%', background: 'linear-gradient(135deg,#2563EB 0%,#1E40AF 100%)', border: 'none', borderRadius: 14, padding: '15px 24px', fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: 0.2, boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}
              >
                Check Eligibility for Balance Transfer →
              </button>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => router.push('/journey/loan')}
          style={{ width: '100%', background: 'transparent', border: '1.5px solid rgba(196,168,130,0.5)', borderRadius: 14, padding: 15, fontSize: 14, fontWeight: 700, color: 'rgba(42,22,6,0.6)', cursor: 'pointer', fontFamily: 'var(--sans)', marginTop: 4 }}
        >
          ← Edit loan details
        </button>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <svg width="24" height="6" style={{ flexShrink: 0 }} aria-hidden>
        <line x1="0" y1="3" x2="24" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="3" r="3" fill={color} />
      </svg>
      <span style={{ fontSize: 11, color: 'rgba(42,22,6,0.6)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/** Paid-to-bank vs still-owed line chart (lfRenderPayChart). */
function PayChart({ points }: { points: PayPoint[] }) {
  if (points.length < 2) return null;
  const W = 320;
  const H = 210;
  const padL = 14;
  const padR = 14;
  const padT = 34;
  const padB = 26;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const N = points.length;
  const maxV = Math.max(...points.map((p) => Math.max(p.owed, p.paid))) * 1.25;
  if (!maxV) return null;
  const xAt = (i: number) => padL + (i / (N - 1)) * cW;
  const yAt = (v: number) => padT + cH - (v / maxV) * cH;
  const fmtV = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : `₹${Math.round(v).toLocaleString('en-IN')}`);
  const oPts = points.map((p, i) => ({ x: Math.round(xAt(i)), y: Math.round(yAt(p.owed)) }));
  const pPts = points.map((p, i) => ({ x: Math.round(xAt(i)), y: Math.round(yAt(p.paid)) }));
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const fill = (pts: { x: number; y: number }[]) => `${line(pts)} L${pts[N - 1].x},${padT + cH} L${pts[0].x},${padT + cH} Z`;
  const base = padT + cH;
  const font = 'Inter,sans-serif';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', maxWidth: '100%', overflow: 'hidden' }}
      shapeRendering="geometricPrecision"
      textRendering="optimizeLegibility"
      role="img"
      aria-label={`Over ${points[N - 1].month} months you pay ${fmtV(points[N - 1].paid)} to the bank; ${fmtV(points[N - 1].owed)} is still owed.`}
    >
      <defs>
        <linearGradient id="lfOGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lfPGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e40af" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {points.map((_, i) => (
        <line key={`g${i}`} x1={xAt(i).toFixed(1)} y1={padT} x2={xAt(i).toFixed(1)} y2={base} stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3,3" />
      ))}
      <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <path d={fill(oPts)} fill="url(#lfOGrad)" />
      <path d={fill(pPts)} fill="url(#lfPGrad)" />
      <path d={line(oPts)} fill="none" stroke="#ea580c" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line(pPts)} fill="none" stroke="#1e40af" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        const anchor = i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle';
        const o = oPts[i];
        const b = pPts[i];
        const blueAbove = b.y < o.y;
        return (
          <g key={`d${i}`}>
            <circle cx={o.x} cy={o.y} r="5.5" fill="#ea580c" stroke="#fff" strokeWidth="2" />
            <text x={o.x} y={o.y - 11} textAnchor={anchor} fontSize="10.5" fill="#ea580c" fontWeight="800" fontFamily={font}>
              {fmtV(p.owed)}
            </text>
            <circle cx={b.x} cy={b.y} r="5.5" fill="#1e40af" stroke="#fff" strokeWidth="2" />
            <text x={b.x} y={blueAbove ? b.y - 11 : b.y + 16} textAnchor={anchor} fontSize="10.5" fill="#1e40af" fontWeight="800" fontFamily={font}>
              {fmtV(p.paid)}
            </text>
            <text x={o.x} y={base + 16} textAnchor={anchor} fontSize="10.5" fill="rgba(42,22,6,0.4)" fontFamily={font}>
              {p.month}M
            </text>
          </g>
        );
      })}
    </svg>
  );
}

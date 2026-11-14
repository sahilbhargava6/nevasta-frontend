'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useJourney } from '@/lib/journey';
import { fetchOffers } from '@/lib/applyOffer';
import { EMPTY_CC_JOURNEY, hasCardDetails, minOnlyPayoff, weightedCard } from '@/lib/ccMath';

// Design: #cc-solutions-page "Your Way Out." (Navesta_Website_22Sep26.html ~5807–6036),
// showCCSolutionsPage / toggleFix1–4 / calcMinOnlyPayoff (~7714–7895).

const BG = 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)';

export default function CCFixesPage() {
  return (
    <JourneyGate intent="debt-cc">
      <Fixes />
    </JourneyGate>
  );
}

type FixId = 1 | 2 | 3 | 4;

function Fixes() {
  const router = useRouter();
  const [journey, , , ready] = useJourney('cc', EMPTY_CC_JOURNEY);
  const [open, setOpen] = useState<Record<FixId, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const [loanRate, setLoanRate] = useState<number | null | undefined>(undefined);
  const filled = hasCardDetails(journey);
  const d = weightedCard(journey.cards);

  useEffect(() => {
    if (ready && !filled) router.replace('/journey/credit-card');
  }, [ready, filled, router]);

  // Lowest real personal-loan rate on offer for this amount (replaces the design's fixed "10.75%")
  useEffect(() => {
    if (!ready || !filled || d.outstanding <= 0) return;
    let live = true;
    fetchOffers(d.outstanding, 24)
      .then((offers) => {
        if (!live) return;
        const rates = offers.map((o) => o.offeredRatePercent).filter((r) => r > 0);
        setLoanRate(rates.length ? Math.min(...rates) : null);
      })
      .catch(() => live && setLoanRate(null));
    return () => {
      live = false;
    };
  }, [ready, filled, d.outstanding]);

  if (!ready || !filled) return <div className="nv" style={{ minHeight: '100vh', background: BG }} />;

  const rate = d.rate || 42;
  const minResult = minOnlyPayoff(d.outstanding, rate, d.minDue);
  const yrs = Math.floor(minResult.months / 12);
  const payoffTime = yrs >= 1 ? `> ${yrs} yr${yrs > 1 ? 's' : ''}` : `> ${minResult.months % 12} months`;
  const ti = minResult.totalInterest;
  const interestStr = ti >= 100000 ? `> ₹${Math.floor(ti / 100000)}L` : ti >= 1000 ? `> ₹${Math.floor(ti / 1000)}k` : `> ₹${(Math.floor(ti / 10) * 10).toLocaleString('en-IN')}`;

  const toggle = (id: FixId) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const go = (path: string) => router.push(path);

  return (
    <div className="nv" style={{ minHeight: '100vh', background: BG, fontFamily: 'var(--sans)', overflowX: 'hidden', width: '100%' }}>
      <JourneyHeader backHref="/journey/credit-card/analysis" />

      <div style={{ padding: '28px 24px 120px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(20,99,197,0.08)', border: '1px solid rgba(20,99,197,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 10 }} aria-hidden>
              🤖
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#1463C5', textTransform: 'uppercase' }}>AI-Ranked Fixes</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,6vw,34px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', marginBottom: 6 }}>
            Your Way <span style={{ color: '#1463C5', fontStyle: 'italic' }}>Out.</span>
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.5)', lineHeight: 1.5 }}>4 fixes, AI-ranked</div>
        </div>

        {/* Fix #1 */}
        <FixCard
          id={1}
          open={open[1]}
          onToggle={toggle}
          bar="linear-gradient(180deg,#10B981,#059669)"
          iconBg="linear-gradient(135deg,#D1FAE5,#A7F3D0)"
          icon="↑"
          kicker="Fastest win"
          kickerColor="#059669"
          title="Pay more than the minimum"
          rank={{ bg: '#F0FDF4', border: '#86EFAC', color: '#15803D' }}
          body="Cuts the interest bleed the fastest. Even a small extra payment each month rewrites your payoff timeline dramatically."
        >
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#991B1B' }}>⚠️ Minimum only path</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#DC2626' }}>{payoffTime}</span>
            </div>
            <div style={{ width: '100%', height: 7, background: '#FCA5A5', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg,#DC2626,#EF4444)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#7F1D1D', fontWeight: 700 }}>
                Total interest: <span style={{ color: '#DC2626' }}>{interestStr}</span>
              </span>
              <span style={{ fontSize: 10, color: 'rgba(127,29,29,0.6)', fontWeight: 600 }}>if you only pay minimums</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.55)', lineHeight: 1.6, marginBottom: 14 }}>Pay more and you finish faster — set your own amount in the plan builder below.</div>
          <CTA onClick={() => go('/journey/credit-card/plan')} bg="linear-gradient(135deg,#10B981,#059669)" glow="0 4px 14px rgba(16,185,129,0.4)">
            Build my plan →
          </CTA>
        </FixCard>

        {/* Fix #2 */}
        <FixCard
          id={2}
          open={open[2]}
          onToggle={toggle}
          bar="linear-gradient(180deg,#3B82F6,#2563EB)"
          iconBg="linear-gradient(135deg,#DBEAFE,#BFDBFE)"
          icon="🔗"
          kicker="Simplify debt"
          kickerColor="#2563EB"
          title="Merge 2+ cards into one"
          rank={{ bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' }}
          body="One due date, one rate, faster payoff. Balance-transfer offers (sometimes 0% for 3–6 months) can let you pay principal directly — no interest bleeding."
        >
          <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', marginBottom: 8 }}>💡 How balance transfer works</div>
            <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.65)', lineHeight: 1.6, marginBottom: 10 }}>
              Move balances from high-rate cards to a single card with a lower rate (or 0% intro offer). You pay one EMI instead of many, and every rupee goes to principal.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['1️⃣', 'List all cards with their outstanding balance & interest rate'],
                ['2️⃣', 'Apply for a BT offer — many banks offer 0% for 3–6 months with a 1–2% fee'],
                ['3️⃣', 'Transfer the highest-rate balances first, then pay aggressively during the 0% window'],
              ].map(([n, t]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 13 }} aria-hidden>
                    {n}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(26,46,63,0.7)', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <CTA onClick={() => go('/journey/credit-card/switch-to-loan')} bg="linear-gradient(135deg,#3B82F6,#2563EB)" glow="0 4px 14px rgba(59,130,246,0.4)">
            Explore balance transfer →
          </CTA>
        </FixCard>

        {/* Fix #3 */}
        <FixCard
          id={3}
          open={open[3]}
          onToggle={toggle}
          bar="linear-gradient(180deg,#8B5CF6,#6D28D9)"
          iconBg="linear-gradient(135deg,#EDE9FE,#DDD6FE)"
          icon="🏦"
          kicker="Biggest saving"
          kickerColor="#6D28D9"
          title="Switch to a loan"
          rank={{ bg: '#F5F3FF', border: '#C4B5FD', color: '#5B21B6' }}
          body={`That ~${rate.toFixed(0)}% card interest is taking a toll on your income. A personal loan at 12–18% halves the bleed — same debt, half the cost.`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: '#FFF0F0', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: 14, textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', color: '#991B1B', textTransform: 'uppercase', marginBottom: 6 }}>CARDS NOW</div>
              <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.5)', marginBottom: 4 }}>avg. rate</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 900, color: '#EF4444', lineHeight: 1 }}>{Math.round(rate)}%</div>
              <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.45)', marginTop: 4 }}>per year</div>
              <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.45)' }}>no end date</div>
            </div>
            <div style={{ fontSize: 20, color: 'rgba(26,46,63,0.35)', flexShrink: 0 }} aria-hidden>
              →
            </div>
            <div style={{ flex: 1, background: '#F0FDF4', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: 14, padding: 14, textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', color: '#065F46', textTransform: 'uppercase', marginBottom: 6 }}>PERSONAL LOAN</div>
              <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.5)', marginBottom: 4 }}>Starts @</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                {loanRate === undefined ? '…' : loanRate === null ? '—' : `${+loanRate.toFixed(2)}%`}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.45)', marginTop: 4 }}>per year</div>
              <div style={{ fontSize: 10, color: 'rgba(26,46,63,0.45)' }}>fixed end date</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.55)', lineHeight: 1.5, marginBottom: 14 }}>Fixed rate, fixed end date — far less interest than your card.</div>
          <CTA onClick={() => go('/journey/credit-card/switch-to-loan')} bg="linear-gradient(135deg,#1463C5,#0D4FA0)" glow="0 4px 14px rgba(20,99,197,0.35)">
            See how much I&apos;d save →
          </CTA>
        </FixCard>

        {/* Fix #4 */}
        <FixCard
          id={4}
          open={open[4]}
          onToggle={toggle}
          bar="linear-gradient(180deg,#F97316,#EA580C)"
          iconBg="linear-gradient(135deg,#FFEDD5,#FED7AA)"
          icon="🔔"
          kicker="Protect score"
          kickerColor="#EA580C"
          title="Monthly card utilisation alerts"
          rank={{ bg: '#FFF7ED', border: '#FDBA74', color: '#C2410C' }}
          body="Know before the bank charges — protect your score. Staying under 30% utilisation can improve your CIBIL by 50–80 points over 6 months."
          highlight
        >
          <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#C2410C', marginBottom: 8 }}>📊 How utilisation affects your CIBIL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: '<30%', lc: '#C2410C', track: '#D1FAE5', w: '70%', fill: 'linear-gradient(90deg,#10B981,#059669)', t: 'Ideal ✓', tc: '#059669' },
                { l: '30–60%', lc: '#D97706', track: '#FEF3C7', w: '50%', fill: 'linear-gradient(90deg,#F59E0B,#D97706)', t: 'Watch out', tc: '#D97706' },
                { l: '>60%', lc: '#DC2626', track: '#FEE2E2', w: '100%', fill: 'linear-gradient(90deg,#EF4444,#DC2626)', t: 'Hurts score', tc: '#DC2626' },
              ].map((r) => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 56, fontSize: 11, fontWeight: 700, color: r.lc, textAlign: 'right', flexShrink: 0 }}>{r.l}</div>
                  <div style={{ flex: 1, height: 10, background: r.track, borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: r.w, height: '100%', background: r.fill, borderRadius: 5 }} />
                  </div>
                  <div style={{ fontSize: 11, color: r.tc, fontWeight: 700, width: 70, flexShrink: 0 }}>{r.t}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(26,46,63,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
            Set up an alert when utilisation crosses 25% — gives you time to pay down before the statement date, which is what banks report to CIBIL.
          </div>
          <CTA onClick={() => go('/settings')} bg="linear-gradient(135deg,#F97316,#EA580C)" glow="0 4px 14px rgba(249,115,22,0.4)">
            Set up utilisation alert →
          </CTA>
        </FixCard>

        {/* IF MONEY IS SHORT */}
        <div style={{ marginBottom: 8, marginTop: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#B45309', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(180,83,9,0.2)' }} />
            IF MONEY IS SHORT
            <div style={{ flex: 1, height: 1, background: 'rgba(180,83,9,0.2)' }} />
          </div>
          <div style={{ background: '#fff', border: '1.5px solid rgba(180,83,9,0.18)', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: '#1A2E3F', marginBottom: 10, lineHeight: 1.25 }}>Can&apos;t pay this month?</h2>
            <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.6, marginBottom: 18 }}>
              A missed payment triggers a penalty (₹500–2,500), a late fee, and a CIBIL hit. Before that happens, your bank likely has options — a hardship hold, minimum reduction, or short deferral.
            </div>
            <button
              type="button"
              onClick={() => go('/journey/hard-month')}
              style={{ width: '100%', background: 'linear-gradient(135deg,#B45309,#92400E)', border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: '.2px', boxShadow: '0 3px 10px rgba(180,83,9,0.28)' }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = '')}
            >
              See my options →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CTA({ onClick, bg, glow, children }: { onClick: () => void; bg: string; glow: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: '100%', background: bg, border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: '.2px', boxShadow: glow }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = '')}
    >
      {children}
    </button>
  );
}

type FixCardProps = {
  id: FixId;
  open: boolean;
  onToggle: (id: FixId) => void;
  bar: string;
  iconBg: string;
  icon: string;
  kicker: string;
  kickerColor: string;
  title: string;
  rank: { bg: string; border: string; color: string };
  body: string;
  highlight?: boolean;
  children: React.ReactNode;
};

/** Expandable fix card (design: #ccs-fixN-card + toggleFixN). */
function FixCard({ id, open, onToggle, bar, iconBg, icon, kicker, kickerColor, title, rank, body, highlight, children }: FixCardProps) {
  const panelId = `ccs-fix${id}-expanded`;
  return (
    <div
      onClick={() => onToggle(id)}
      style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s', ...(highlight ? { border: '1.5px solid rgba(249,115,22,0.3)' } : {}) }}
      onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)')}
      onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)')}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: bar, borderRadius: '4px 0 0 4px' }} />
      <div style={{ paddingLeft: 12 }}>
        {/* Header is the keyboard-accessible toggle; its click bubbles to the card */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div aria-hidden style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: kickerColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{kicker}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2E3F', lineHeight: 1.2 }}>{title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ background: rank.bg, border: `1.5px solid ${rank.border}`, borderRadius: 10, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: rank.color, letterSpacing: '.5px' }}>#{id}</div>
            </div>
            <div aria-hidden style={{ fontSize: 14, color: kickerColor, transition: 'transform .3s' }}>
              {open ? '▲' : '▼'}
            </div>
          </div>
        </button>
        <div style={{ fontSize: 13, color: 'rgba(26,46,63,0.6)', lineHeight: 1.55 }}>{body}</div>

        {open && (
          <div id={panelId} onClick={(e) => e.stopPropagation()} style={{ marginTop: 14, cursor: 'default' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

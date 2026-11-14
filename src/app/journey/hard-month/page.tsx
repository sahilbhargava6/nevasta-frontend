'use client';

import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';

// Design: #hard-month-page "Having a Hard Month?" (Navesta_Website_22Sep26.html ~11225–11290, JS ~9594–9621)

const OPTIONS = [
  {
    href: '/journey/cant-pay',
    color: '#DC2626',
    tint: '#FEF2F2',
    icon: '😢',
    title: "I can't pay this month",
    body: "This happens, and it's fixable — but only if you act before the due date, not after.",
  },
  {
    // The design's button did nothing: send the customer to an advisor
    href: '/contact',
    color: '#D97706',
    tint: '#FFFBEB',
    icon: '🕐',
    title: "I've already missed a payment",
    body: 'One missed payment is recoverable. The damage comes from letting it become three.',
    note: 'Talk to a Navesta advisor',
  },
  {
    href: '/contact',
    color: '#0D9488',
    tint: '#F0FDFA',
    icon: '🛡️',
    title: "I'm being harassed over a debt",
    body: "Recovery agents operate under RBI rules. Most people don't know these rights — and that's exactly what's exploited.",
    note: 'Talk to a Navesta advisor',
  },
];

export default function HardMonthPage() {
  return (
    <JourneyGate intent="debt-cc">
      <HardMonth />
    </JourneyGate>
  );
}

function HardMonth() {
  const router = useRouter();
  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden', width: '100%' }}>
      <JourneyHeader backHref="/journey/credit-card/fixes" minimal />

      <div className="acc-page">
        <div className="acc-left">
          <div className="acc-label">😔 Having a Hard Month?</div>
          <h1 className="acc-h1">
            You&apos;re <span>not stuck.</span>
          </h1>
          <div className="acc-sub">This is the part most apps skip. Whatever&apos;s happening, there&apos;s a next step — and options you may not know you have.</div>

          {OPTIONS.map((o, i) => (
            <button
              key={o.title}
              type="button"
              onClick={() => router.push(o.href)}
              style={{ width: '100%', textAlign: 'left', background: '#fff', border: 'none', borderRadius: 16, padding: 0, cursor: 'pointer', boxShadow: '0 2px 14px rgba(26,46,63,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'stretch', marginBottom: i === OPTIONS.length - 1 ? 24 : 10, transition: 'transform .15s', fontFamily: 'inherit' }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = '')}
            >
              <div style={{ width: 5, background: o.color, flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 16px', flex: 1 }}>
                <div aria-hidden style={{ width: 46, height: 46, borderRadius: 12, background: o.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {o.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A2E', marginBottom: 4 }}>{o.title}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{o.body}</div>
                  {o.note && <div style={{ fontSize: 12, fontWeight: 700, color: o.color, marginTop: 6 }}>{o.note} →</div>}
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0B0A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}

          <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>Nothing here is judged or recorded against you.</div>
        </div>
      </div>
    </div>
  );
}

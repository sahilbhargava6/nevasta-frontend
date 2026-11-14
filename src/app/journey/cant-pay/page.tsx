'use client';

import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';

// Design: #cant-pay-page "I can't pay this month" (Navesta_Website_22Sep26.html ~11291–11397)

const STEPS: { title: React.ReactNode; body: string }[] = [
  {
    title: (
      <>
        Call the bank first — <span style={{ color: '#DC2626' }}>today</span>
      </>
    ),
    body: 'Ask for their hardship or relief option. Banks would rather restructure than chase you. Do it before you miss, not after: your record still looks clean.',
  },
  {
    title: 'Ask to convert the balance to EMI',
    body: 'Most card issuers will convert a large outstanding into a fixed monthly instalment at a far lower rate than the 42% card rate. Ask specifically for this.',
  },
  {
    title: 'Pay something, even if small',
    body: 'A partial payment is not a missed payment in the same way — it reduces late-fee exposure and shows intent. Never pay nothing without calling.',
  },
  {
    title: 'Protect the essentials first',
    body: "Rent, food, utilities, school fees — these come before your card minimum. Your bank can wait a few days. Your landlord and your children's school cannot.",
  },
  {
    title: "Don't ignore it — it compounds",
    body: 'Silence costs more than a call. A ₹30,000 unpaid balance at 3.5%/month becomes ₹36,000 in 6 months just from interest. One call today can stop that clock.',
  },
];

const DONTS: [string, string][] = [
  ["Don't take a new personal loan", ' to pay your card — unless the rate is significantly lower (below 18%).'],
  ["Don't use another credit card", ' to pay the minimum — this just spins the cycle.'],
  ["Don't disappear", ' — banks escalate faster on silent accounts than on accounts that communicate.'],
];

export default function CantPayPage() {
  return (
    <JourneyGate intent="debt-cc">
      <CantPay />
    </JourneyGate>
  );
}

function CantPay() {
  const router = useRouter();
  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden', width: '100%' }}>
      <JourneyHeader backHref="/journey/hard-month" minimal />

      <div className="acc-page">
        <div className="acc-left">
          <div className="acc-label">😢 I can&apos;t pay this month</div>
          <h1 className="acc-h1">
            Do these, <span>in this order.</span>
          </h1>
          <div className="acc-sub">This happens, and it&apos;s fixable — but only if you act before the due date, not after.</div>

          {/* Step-by-step */}
          <div className="acc-card" style={{ marginBottom: 14, padding: '22px 20px' }}>
            <h2 style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'rgba(26,46,63,0.35)', textTransform: 'uppercase', marginBottom: 16 }}>Step by Step</h2>
            <ol style={{ position: 'relative', listStyle: 'none' }}>
              <div aria-hidden style={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, background: 'linear-gradient(180deg,#DC2626 0%,rgba(220,38,38,0.08) 100%)' }} />
              {STEPS.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 14, marginBottom: i === STEPS.length - 1 ? 0 : 20 }}>
                  <div aria-hidden style={{ width: 34, height: 34, borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0, zIndex: 1, boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, paddingTop: 5 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1A1A2E', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.55 }}>{s.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* What not to do */}
          <div className="acc-card" style={{ background: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', border: '1.5px solid rgba(220,38,38,0.12)', marginBottom: 14, padding: 20 }}>
            <h2 style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#991B1B', textTransform: 'uppercase', marginBottom: 12 }}>⚠️ What Not To Do</h2>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none' }}>
              {DONTS.map(([strong, rest]) => (
                <li key={strong} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ color: '#DC2626', fontWeight: 900, flexShrink: 0, fontSize: 15, marginTop: 1 }}>
                    ✕
                  </span>
                  <span style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.55 }}>
                    <strong>{strong}</strong>
                    {rest}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Refinance CTA */}
          <div className="acc-card" style={{ border: '1.5px solid rgba(5,150,105,0.2)', padding: 20, marginBottom: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#065F46', marginBottom: 5 }}>Need a lower-rate loan to clear this?</div>
            <div className="acc-sub" style={{ marginBottom: 14 }}>
              Navesta can match you with NBFC personal loans at 14–18% — far below your card&apos;s 36–42%. Takes 2 minutes to check.
            </div>
            <button
              type="button"
              className="acc-cta"
              onClick={() => router.push('/journey/credit-card/switch-to-loan')}
              style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 3px 12px rgba(5,150,105,0.3)', marginBottom: 0 }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = '')}
            >
              Check my refinance options →
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', padding: '6px 0 4px', lineHeight: 1.6 }}>Nothing here is judged or recorded against you.</div>
        </div>
      </div>
    </div>
  );
}

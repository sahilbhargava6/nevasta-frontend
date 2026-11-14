'use client';

import Navbar from '@/components/Navbar';

/** Who We Are (design #about-page). */

const divider: React.CSSProperties = { height: 1, background: 'linear-gradient(90deg,rgba(201,96,16,0.3),transparent)', marginBottom: 40 };
const eyebrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,96,16,0.1)', border: '1px solid rgba(201,96,16,0.2)', borderRadius: 20, padding: '6px 16px' };
const eyebrowText: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#7C3200', textTransform: 'uppercase' };
const storyCard: React.CSSProperties = { background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(196,168,130,0.3)', borderRadius: 20, padding: 'clamp(22px,5vw,32px)', backdropFilter: 'blur(8px)' };
const iconTile = (bg: string): React.CSSProperties => ({ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 });
const bodyText: React.CSSProperties = { fontSize: 15, lineHeight: 1.8, color: 'rgba(42,22,6,0.75)', margin: 0 };
const strong: React.CSSProperties = { color: '#2A1606' };

const DIFFERENTIATORS = [
  { icon: '🤖', title: 'AI-Powered', desc: 'Recommendations that learn from your financial behaviour and evolve with your goals.' },
  { icon: '🇮🇳', title: 'Built for India', desc: 'Designed around the unique financial realities and aspirations of Indian consumers.' },
  { icon: '👤', title: 'Truly Personal', desc: 'No generic advice. Every plan is built around your income, goals, debts, and life stage.' },
];

export default function AboutPage() {
  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 5% 100px' }}>
        <div style={{ ...eyebrow, marginBottom: 28 }}>
          <span style={{ fontSize: 13 }} aria-hidden>🏢</span>
          <span style={eyebrowText}>Who We Are</span>
        </div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(30px,6vw,46px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', margin: '0 0 20px' }}>
          Your <span style={{ color: '#C96010' }}>Companion</span>
          <br />
          for Smarter Money
        </h1>

        <p style={{ fontSize: 'clamp(16px,2.5vw,19px)', lineHeight: 1.8, color: 'rgba(42,22,6,0.75)', margin: '0 0 40px' }}>
          Navesta is a <strong style={strong}>Personal Finance &amp; Wealth Management platform</strong> built to solve the finance and wealth management challenges of everyday consumers. We are working to close a gap that millions of Indians experience daily — the absence of a trusted, intelligent, personalised guide for their financial life.
        </p>

        <div style={divider} />

        {/* Origin story */}
        <section style={{ ...storyCard, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={iconTile('linear-gradient(135deg,#FDE8D0,#F5C89A)')} aria-hidden>💡</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#2A1606', margin: 0 }}>How the Idea Was Born</h2>
              <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.5)' }}>A real problem. A real conversation.</div>
            </div>
          </div>
          <p style={bodyText}>
            This idea emerged from a conversation with friends — a moment of realisation that <strong style={strong}>financial confusion is a known, widespread problem for Indian consumers</strong>. Whether it is choosing the right credit card, managing debt, planning for a life event, or simply knowing where to put savings — most people navigate these decisions alone, without expert guidance or a personalised plan.
          </p>
        </section>

        {/* Problem */}
        <section style={{ ...storyCard, marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={iconTile('linear-gradient(135deg,#E8F5FF,#B3D9F5)')} aria-hidden>🎯</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#2A1606', margin: 0 }}>The Problem We Are Solving</h2>
              <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.5)' }}>A known gap. No platform has filled it — yet.</div>
            </div>
          </div>
          <p style={bodyText}>
            There is no common platform or trusted source available to Indian consumers that delivers <strong style={strong}>personalised, AI-powered, data-driven financial recommendations</strong> based on individual needs. Generic advice, one-size-fits-all products, and fragmented tools leave people underserved. Navesta exists to change that.
          </p>
        </section>

        <div style={divider} />

        {/* Mission & Vision */}
        <div style={{ ...eyebrow, marginBottom: 24 }}>
          <span style={{ fontSize: 13 }} aria-hidden>🧭</span>
          <span style={eyebrowText}>Purpose &amp; Direction</span>
        </div>

        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: '#2A1606', margin: '0 0 24px' }}>Our Mission &amp; Vision</h2>

        <section style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.85),rgba(255,240,224,0.7))', border: '1.5px solid rgba(201,96,16,0.25)', borderRadius: 20, padding: 'clamp(22px,5vw,32px)', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(201,96,16,0.07)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' }}>
            <div style={{ ...iconTile('linear-gradient(135deg,#C96010,#EA8820)'), fontSize: 20, boxShadow: '0 4px 14px rgba(201,96,16,0.35)' }} aria-hidden>🎯</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.4px', color: '#C96010', textTransform: 'uppercase', marginBottom: 2 }}>Our Mission</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#2A1606', margin: 0 }}>What We Set Out to Do</h3>
            </div>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.85, color: 'rgba(42,22,6,0.8)', margin: 0, fontStyle: 'italic', position: 'relative' }}>
            &quot;To give every Indian the clarity, tools, and personalised guidance to take control of their financial life — <strong style={{ color: '#C96010', fontStyle: 'normal' }}>one decision at a time.</strong>&quot;
          </p>
        </section>

        <section style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.85),rgba(224,245,235,0.7))', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: 20, padding: 'clamp(22px,5vw,32px)', marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(5,150,105,0.07)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' }}>
            <div style={{ ...iconTile('linear-gradient(135deg,#059669,#10B981)'), fontSize: 20, boxShadow: '0 4px 14px rgba(5,150,105,0.3)' }} aria-hidden>🌅</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.4px', color: '#047857', textTransform: 'uppercase', marginBottom: 2 }}>Our Vision</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#2A1606', margin: 0 }}>Where We Are Headed</h3>
            </div>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.85, color: 'rgba(42,22,6,0.8)', margin: 0, fontStyle: 'italic', position: 'relative' }}>
            &quot;A future where no Indian faces a financial crossroads alone — where every person has access to the kind of intelligent, empathetic financial guidance that was once available only to the privileged few.&quot;
          </p>
        </section>

        <div style={divider} />

        {/* Differentiators */}
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#2A1606', margin: '0 0 20px' }}>What Makes Navesta Different</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(196,168,130,0.25)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }} aria-hidden>{d.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2A1606', margin: '0 0 6px' }}>{d.title}</h3>
              <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.6)', lineHeight: 1.6 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

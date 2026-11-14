'use client';

import Link from 'next/link';
import JourneyHeader from '@/components/design/JourneyHeader';
import { LIFE_EVENTS, LIFE_EVENT_KEYS } from './events';

/** Life-Event Planning (design #life-event-page): pick an occasion. */
export default function LifeEventsPage() {
  return (
    <div className="nv" style={{ minHeight: '100vh', background: '#F5EFE8', fontFamily: 'var(--sans)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <JourneyHeader backHref="/" />

      <div style={{ padding: '28px 20px 100px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 36 }} aria-hidden>🎊</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,5vw,28px)', fontWeight: 900, color: '#2A1606', lineHeight: 1.15 }}>Life-Event Planning</h1>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(42,22,6,0.62)', lineHeight: 1.7, marginBottom: 28 }}>
          Big moments deserve smart funding. Pick your occasion — Navesta builds a personal loan plan around your income and savings in seconds.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {LIFE_EVENT_KEYS.map((key) => {
            const ev = LIFE_EVENTS[key];
            return (
              <Link
                key={key}
                href={`/life-events/${key}`}
                style={{ display: 'block', textDecoration: 'none', background: '#fff', borderRadius: 20, padding: '22px 16px 18px', cursor: 'pointer', position: 'relative', border: '1.5px solid rgba(196,168,130,0.25)', boxShadow: '0 2px 12px rgba(42,22,6,0.06)', transition: 'transform .18s,box-shadow .18s', textAlign: 'center' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(42,22,6,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,22,6,0.06)';
                }}
              >
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 12, color: 'rgba(42,22,6,0.3)' }} aria-hidden>›</div>
                <div style={{ fontSize: 38, marginBottom: 10 }} aria-hidden>{ev.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1035', marginBottom: 8 }}>{ev.title}</div>
                <div style={{ display: 'inline-block', background: 'rgba(109,40,217,0.1)', color: '#5B21B6', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{ev.range}</div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: 'rgba(42,22,6,0.4)', lineHeight: 1.6 }}>
          ⚡ Navesta builds your plan in seconds using RBI-approved loan benchmarks.<br />No impact on your credit score.
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmtINR } from '@/lib/journey';
import { initialsOf, type SessionUser } from './SessionProvider';

/**
 * Profile overlay from the design (#profile-modal), with the customer's real
 * account and debt figures, plus links to the account pages.
 */

type Profile = { phone: string | null; email: string; createdAt: string; creditScore: number | null };
type Summary = {
  totalOutstandingRupees: number;
  totalMonthlyObligationsRupees: number;
  activeCreditCardsCount: number;
  activeLoansCount: number;
};

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F5E8D8' }}>
    <span style={{ color: '#8A7058' }}>{k}</span>
    <span style={{ fontWeight: 600, color: '#3A2310', textAlign: 'right' }}>{v}</span>
  </div>
);

const sectionTitle = { fontSize: 13, fontWeight: 600, color: '#8A7058', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 };

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/loans', label: 'Loans & EMIs' },
  { href: '/credit-cards', label: 'Credit cards' },
  { href: '/balance-transfer', label: 'My applications' },
  { href: '/statements', label: 'Statement vault' },
  { href: '/settings', label: 'Settings & privacy' },
];

export default function ProfileModal({ user, onClose, onSignOut }: { user: SessionUser; onClose: () => void; onSignOut: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get('/users/me').then((r: any) => setProfile(r.data)).catch(() => undefined);
    api.get('/dashboard/summary').then((r: any) => setSummary(r.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Phone-first accounts have a placeholder email; show the phone instead
  const realEmail = user.email && !user.email.endsWith('@phone.navesta.in') ? user.email : null;
  const contact = [profile?.phone ?? user.phone, realEmail].filter(Boolean).join(' · ') || '—';
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—';
  const score = profile?.creditScore ?? null;

  return (
    <div className="nv">
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Your profile" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-header" style={{ textAlign: 'center', padding: '32px 28px 24px' }}>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1A5C5A,#0D3D3B)', border: '3px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 700, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', letterSpacing: 1 }}>
              {initialsOf(user.name)}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{user.name}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4, color: '#fff' }}>{contact}</div>
          </div>
          <div className="modal-body">
            <div style={{ borderBottom: '1px solid #EDD8C4', paddingBottom: 16, marginBottom: 16 }}>
              <div style={sectionTitle}>Account Details</div>
              <Row k="Name" v={user.name} />
              <Row k="Email / Phone" v={contact} />
              <Row k="Member Since" v={memberSince} />
            </div>
            <div style={{ borderBottom: '1px solid #EDD8C4', paddingBottom: 16, marginBottom: 16 }}>
              <div style={sectionTitle}>Financial Summary</div>
              <Row k="Total Debt" v={summary ? fmtINR(summary.totalOutstandingRupees) : '—'} />
              <Row k="Monthly EMI" v={summary ? fmtINR(summary.totalMonthlyObligationsRupees) : '—'} />
              <Row k="Active Loans" v={summary ? `${summary.activeLoansCount} loans · ${summary.activeCreditCardsCount} cards` : '—'} />
              <Row k="CIBIL Score" v={score ? `${score} · ${score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor'}` : 'Not on file'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {ACCOUNT_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={onClose} style={{ padding: '10px 12px', borderRadius: 10, background: '#FFF6EC', border: '1px solid #F0DCC4', color: '#3A2310', fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <Link href="/dashboard" onClick={onClose} style={{ display: 'block', textAlign: 'center', width: '100%', padding: 13, borderRadius: 12, border: '1.5px solid #E07C10', background: 'transparent', color: '#E07C10', fontWeight: 700, fontSize: 15, marginBottom: 10, textDecoration: 'none' }}>
              View Full Profile →
            </Link>
            <button onClick={onSignOut} style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: '#FEE2E2', color: '#991B1B', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

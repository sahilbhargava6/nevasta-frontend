'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LogOut, X } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtINR } from '@/lib/journey';
import { initialsOf, type SessionUser } from './SessionProvider';

/**
 * Profile panel (original Navesta look) with the customer's real account and
 * debt figures, plus links to the account pages.
 */

type Profile = { phone: string | null; email: string; createdAt: string; creditScore: number | null };
type Summary = {
  totalOutstandingRupees: number;
  totalMonthlyObligationsRupees: number;
  activeCreditCardsCount: number;
  activeLoansCount: number;
};

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 text-sm border-b border-slate-100 last:border-0">
    <span className="text-slate-500">{k}</span>
    <span className="font-semibold text-slate-900 text-right">{v}</span>
  </div>
);

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/debt-management', label: 'Debt plan' },
  { href: '/loans', label: 'Loans & EMIs' },
  { href: '/credit-cards', label: 'Credit cards' },
  { href: '/balance-transfer', label: 'My applications' },
  { href: '/statements', label: 'Statement vault' },
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Your profile"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden my-auto">
        <div className="relative px-6 pt-8 pb-6 bg-slate-900 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 ring-4 ring-white/10">{initialsOf(user.name)}</div>
          <div className="text-lg font-bold">{user.name}</div>
          <div className="text-xs text-slate-400 mt-1">{contact}</div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account details</div>
            <Row k="Name" v={user.name} />
            <Row k="Email / Phone" v={contact} />
            <Row k="Member since" v={memberSince} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Financial summary</div>
            <Row k="Total debt" v={summary ? fmtINR(summary.totalOutstandingRupees) : '—'} />
            <Row k="Monthly EMI" v={summary ? fmtINR(summary.totalMonthlyObligationsRupees) : '—'} />
            <Row k="Active accounts" v={summary ? `${summary.activeLoansCount} loans · ${summary.activeCreditCardsCount} cards` : '—'} />
            <Row k="Credit score" v={score ? `${score} · ${score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor'}` : 'Not on file'} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={onClose} className="px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 text-center transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/settings" onClick={onClose} className="btn-secondary flex-1 text-xs">
              Settings &amp; privacy <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
            <button type="button" onClick={onSignOut} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

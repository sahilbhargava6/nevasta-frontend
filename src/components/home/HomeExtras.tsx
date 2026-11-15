'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Compass,
  Heart,
  Plane,
  Home,
  GraduationCap,
  Stethoscope,
  PartyPopper,
  Phone,
  Loader2,
  CalendarHeart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSession } from '@/components/session/SessionProvider';

/**
 * Home page sections that carry the newer journeys in the original look:
 * a welcome panel for signed-in customers, the Life Events entry and the
 * personal-loan callback (filed as a lead for the advisory team).
 */

/** Signed-in customers: straight back into their plan. */
export function WelcomeBack() {
  const router = useRouter();
  const { user, ready } = useSession();
  if (!ready || !user) return null;
  const first = (user.name || '').trim().split(/\s+/)[0] || 'there';

  return (
    <section className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Welcome back</div>
          <h2 className="text-2xl font-bold tracking-tight">Hello, {first}! What would you like to work on?</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => router.push('/debt-management')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer">
            <Compass className="w-4 h-4" /> Start Debt Journey <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => router.push('/life-events')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer">
            <CalendarHeart className="w-4 h-4" /> Plan Life Events
          </button>
        </div>
      </div>
    </section>
  );
}

const EVENTS = [
  { key: 'wedding', label: 'Wedding', icon: Heart },
  { key: 'travel', label: 'Travel / Holiday', icon: Plane },
  { key: 'renovation', label: 'Home Renovation', icon: Home },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'medical', label: 'Medical', icon: Stethoscope },
  { key: 'anniversary', label: 'Celebrations', icon: PartyPopper },
];

/** Entry to the Life Events Planner (public, no sign-in needed). */
export function LifeEventsStrip() {
  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <span className="badge-blue mb-3">Life Events Planner</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Planning a big expense? Know your EMI before you borrow.</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">Pick an event, enter your income and the amount you need, and see what you can comfortably afford and the best rates from our lending partners.</p>
          </div>
          <Link href="/life-events" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            See all 10 events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {EVENTS.map((e) => {
            const Icon = e.icon;
            return (
              <Link key={e.key} href={`/life-events/${e.key}`} className="card-fintech-interactive p-4 flex flex-col items-center text-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-slate-800">{e.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** "Apply for a Personal Loan": a phone number becomes a callback lead (admin → Leads & messages). */
export function QuickLoanApply() {
  const { user } = useSession();
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    const digits = phone.trim();
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setMsg({ ok: false, text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    if (!consent) {
      setMsg({ ok: false, text: 'Please agree to the Terms & Conditions to proceed.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      // The phone number is enough; signed-in visitors also send their name and real email
      const realEmail = user?.email && !user.email.endsWith('@phone.navesta.in') ? user.email : undefined;
      await api.post('/inquiries', {
        name: user?.name?.trim() || undefined,
        email: realEmail,
        phone: '+91' + digits,
        inquiryType: 'Personal Loan Callback',
        message: `Personal loan quick apply from the home page. Please call back on +91 ${digits}.`,
      });
      setMsg({ ok: true, text: 'Great! Our advisor will call you within 10 minutes.' });
      setPhone('');
      setConsent(false);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-fintech p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            <Phone className="w-4 h-4" /> Quick apply
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Apply for a Personal Loan</h2>
          <p className="text-sm text-slate-600 mt-1">Leave your number and a Navesta advisor will call you back with your best options.</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="quick-loan-phone" className="sr-only">Mobile number</label>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">+91</span>
                <input
                  id="quick-loan-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
              <button type="submit" disabled={busy} className="btn-accent w-full sm:w-auto cursor-pointer">
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                {busy ? 'Submitting…' : 'Apply Now'}
                {!busy && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30 mt-0.5" />
              <span>I agree to the Terms &amp; Conditions and Privacy Policy, and allow Navesta to call me about my loan request.</span>
            </label>
            {msg && (
              <div role="status" aria-live="polite" className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium ${msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                {msg.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {msg.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

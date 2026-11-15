'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useSession } from '@/components/session/SessionProvider';
import { api } from '@/lib/api';
import { trackStep } from '@/lib/track';
import { AlertTriangle, ArrowRight, ChevronRight, CreditCard, Landmark, Layers, Lock, Wallet, type LucideIcon } from 'lucide-react';

type DebtType = 'cc' | 'loan' | 'multiple';

const OPTIONS: { type: DebtType; title: string; body: string; Icon: LucideIcon; tint: string }[] = [
  {
    type: 'cc',
    title: 'Credit card debt',
    body: 'Paying only the minimum? Bleeding interest every month? Break the cycle.',
    Icon: CreditCard,
    tint: 'bg-rose-50 text-rose-600',
  },
  {
    type: 'loan',
    title: 'Loan',
    body: 'Have a personal, home, car or education loan? Cut the rate, the EMI or the tenure.',
    Icon: Landmark,
    tint: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'multiple',
    title: 'Multiple debts',
    body: 'Juggling several cards or loans? We will simplify into one clear plan.',
    Icon: Layers,
    tint: 'bg-violet-50 text-violet-600',
  },
];

const LABELS: Record<DebtType, string> = { cc: 'Credit card debt', loan: 'Loan', multiple: 'Multiple debts' };
const ROUTES: Record<DebtType, string> = { cc: '/journey/credit-card', loan: '/journey/loan', multiple: '/journey/multiple' };

export default function DebtManagementPage() {
  return (
    <JourneyGate intent="debt-management">
      <DebtManagement />
    </JourneyGate>
  );
}

function DebtManagement() {
  const router = useRouter();
  const { user } = useSession();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  const [selected, setSelected] = useState<DebtType | null>(null);
  const [sheetIn, setSheetIn] = useState(false);
  // DPDP Act: consents are never pre-ticked
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [showErr, setShowErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const timers = useRef<number[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const selectDebtType = (type: DebtType) => {
    setSelected(type);
    setC1(false);
    setC2(false);
    setC3(false);
    setShowErr(false);
    setSaveErr('');
    later(() => {
      setSheetIn(true);
      sheetRef.current?.focus();
    }, 10);
  };

  const closeConsent = () => {
    setSheetIn(false);
    later(() => setSelected(null), 300);
  };

  const proceedDebtType = async () => {
    if (!c1 || !c2) {
      setShowErr(true);
      return;
    }
    setShowErr(false);
    setSaveErr('');
    setSaving(true);
    try {
      await api.post('/users/me/consents', { purpose: 'debt_guidance', granted: true });
      await api.post('/users/me/consents', { purpose: 'marketing', granted: c3 });
    } catch (err: any) {
      setSaveErr(err?.response?.data?.message || err?.message || 'Could not save your consent. Please try again.');
      setSaving(false);
      return;
    }
    setSaving(false);
    const type = selected;
    if (type) trackStep('debt_management', 'consent_given', type);
    setSheetIn(false);
    later(() => {
      if (type) router.push(ROUTES[type]);
    }, 280);
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConsent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const checkbox = 'w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30 mt-0.5 shrink-0 cursor-pointer';

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            <Wallet className="w-4 h-4" aria-hidden /> Debt Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {firstName}, you are in the <span className="text-blue-600">right place.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-3">
            Feeling stuck in debt is exhausting — but there is always a way out, and it is closer than you think. Tell us what is weighing on you and we will build your personal escape plan in minutes.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-900 mb-3" id="dm-question">
            What do you need help with?
          </div>
          <div role="group" aria-labelledby="dm-question" className="space-y-3">
            {OPTIONS.map((o) => (
              <button key={o.type} type="button" onClick={() => selectDebtType(o.type)} className="card-fintech-interactive w-full text-left p-4 sm:p-5 flex items-center gap-4">
                <div aria-hidden className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${o.tint}`}>
                  <o.Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{o.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed mt-0.5">{o.body}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 flex gap-2 items-start">
          <Lock className="w-4 h-4 shrink-0" aria-hidden />
          <span>Your information is fully encrypted and never shared. Navesta is RBI-compliant and NBFC registered.</span>
        </div>
      </main>

      {selected && (
        <div
          onClick={closeConsent}
          className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6 transition-opacity duration-200 ${sheetIn ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dm-consent-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 p-5 sm:p-6 max-h-[90vh] overflow-y-auto outline-none transition-transform duration-300 ${sheetIn ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div id="dm-consent-title" className="text-lg font-bold text-slate-900">
              Before we continue
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mt-1 mb-4">
              To build your personalised {LABELS[selected]} escape plan, we need your agreement on the following.
            </p>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-4">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">What we collect &amp; why</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your card outstanding, minimum due, payment history and — if you upload one — statement details. Used only to calculate your interest cost and build your payoff plan. Nothing else.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-slate-200 p-3">
                <input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} required className={checkbox} />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I <strong>consent</strong> to Navesta collecting and processing my financial data to generate personalised debt guidance. <span className="text-rose-600 font-bold">*</span>
                </span>
              </label>
              <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-slate-200 p-3">
                <input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} required className={checkbox} />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I understand my data is <strong>encrypted</strong>, used only for this purpose, <strong>never sold</strong>, and that I can <strong>withdraw consent anytime</strong>.{' '}
                  <span className="text-rose-600 font-bold">*</span>
                </span>
              </label>
              <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-slate-200 p-3">
                <input type="checkbox" checked={c3} onChange={(e) => setC3(e.target.checked)} className={checkbox} />
                <span className="text-xs text-slate-700 leading-relaxed">
                  Send me money tips &amp; product updates from Navesta <span className="text-slate-400 italic">(optional)</span>.
                </span>
              </label>
            </div>

            {showErr && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 flex gap-2 items-start mb-3">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                <span>Please accept the required consents to continue.</span>
              </div>
            )}
            {saveErr && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 flex gap-2 items-start mb-3">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                <span>{saveErr}</span>
              </div>
            )}

            <button type="button" onClick={proceedDebtType} disabled={saving} aria-busy={saving} className="btn-accent w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? (
                'Saving…'
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
                </>
              )}
            </button>
            <button type="button" onClick={closeConsent} disabled={saving} className="btn-secondary w-full mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

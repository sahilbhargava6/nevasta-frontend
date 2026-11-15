'use client';

import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { ChevronRight, Clock, Frown, ShieldCheck, type LucideIcon } from 'lucide-react';

const OPTIONS: { href: string; Icon: LucideIcon; tint: string; accent: string; title: string; body: string; note?: string }[] = [
  {
    href: '/journey/cant-pay',
    Icon: Frown,
    tint: 'bg-rose-50 text-rose-600',
    accent: 'text-rose-600',
    title: "I can't pay this month",
    body: "This happens, and it's fixable — but only if you act before the due date, not after.",
  },
  {
    // The design's button did nothing: send the customer to an advisor
    href: '/contact',
    Icon: Clock,
    tint: 'bg-amber-50 text-amber-600',
    accent: 'text-amber-600',
    title: "I've already missed a payment",
    body: 'One missed payment is recoverable. The damage comes from letting it become three.',
    note: 'Talk to a Navesta advisor',
  },
  {
    href: '/contact',
    Icon: ShieldCheck,
    tint: 'bg-emerald-50 text-emerald-600',
    accent: 'text-emerald-600',
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
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/credit-card/fixes" minimal />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            <Frown className="w-4 h-4" aria-hidden /> Having a Hard Month?
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            You&apos;re <span className="text-blue-600">not stuck.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-3">This is the part most apps skip. Whatever&apos;s happening, there&apos;s a next step — and options you may not know you have.</p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map((o) => (
            <button key={o.title} type="button" onClick={() => router.push(o.href)} className="card-fintech-interactive w-full text-left p-4 sm:p-5 flex items-center gap-4">
              <div aria-hidden className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${o.tint}`}>
                <o.Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900">{o.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed mt-0.5">{o.body}</div>
                {o.note && <div className={`text-xs font-semibold mt-1.5 ${o.accent}`}>{o.note} →</div>}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 leading-relaxed">Nothing here is judged or recorded against you.</p>
      </main>
    </div>
  );
}

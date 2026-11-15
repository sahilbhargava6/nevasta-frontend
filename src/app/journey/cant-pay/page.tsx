'use client';

import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { AlertTriangle, ArrowRight, Frown, X } from 'lucide-react';

const STEPS: { title: React.ReactNode; body: string }[] = [
  {
    title: (
      <>
        Call the bank first — <span className="text-blue-600">today</span>
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
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/hard-month" minimal />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            <Frown className="w-4 h-4" aria-hidden /> I can&apos;t pay this month
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Do these, <span className="text-blue-600">in this order.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-3">This happens, and it&apos;s fixable — but only if you act before the due date, not after.</p>
        </div>

        {/* Step-by-step */}
        <section className="card-fintech p-5 sm:p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Step by Step</h2>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={i} className="flex gap-3">
                <div aria-hidden className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                  <div className="text-xs text-slate-600 leading-relaxed mt-1">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What not to do */}
        <section className="rounded-lg bg-rose-50 border border-rose-200 p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-wider mb-3">
            <AlertTriangle className="w-4 h-4" aria-hidden /> What Not To Do
          </h2>
          <ul className="space-y-3">
            {DONTS.map(([strong, rest]) => (
              <li key={strong} className="flex gap-2.5 items-start">
                <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden />
                <span className="text-xs text-rose-800 leading-relaxed">
                  <strong>{strong}</strong>
                  {rest}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Refinance CTA */}
        <section className="card-fintech p-5 sm:p-6">
          <div className="text-sm font-semibold text-slate-900">Need a lower-rate loan to clear this?</div>
          <p className="text-sm text-slate-600 leading-relaxed mt-1 mb-4">
            Navesta can match you with NBFC personal loans at 14–18% — far below your card&apos;s 36–42%. Takes 2 minutes to check.
          </p>
          <button type="button" className="btn-accent w-full sm:w-auto" onClick={() => router.push('/journey/credit-card/switch-to-loan')}>
            Check my refinance options <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
          </button>
        </section>

        <p className="text-center text-xs text-slate-500 leading-relaxed">Nothing here is judged or recorded against you.</p>
      </main>
    </div>
  );
}

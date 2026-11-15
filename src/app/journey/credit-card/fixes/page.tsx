'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JourneyGate from '@/components/design/JourneyGate';
import JourneyHeader from '@/components/design/JourneyHeader';
import { useJourney } from '@/lib/journey';
import { fetchOffers } from '@/lib/applyOffer';
import { EMPTY_CC_JOURNEY, hasCardDetails, minOnlyPayoff, weightedCard } from '@/lib/ccMath';
import { AlertTriangle, ArrowRight, Bell, ChevronDown, Info, Landmark, Layers, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';

export default function CCFixesPage() {
  return (
    <JourneyGate intent="debt-cc">
      <Fixes />
    </JourneyGate>
  );
}

type FixId = 1 | 2 | 3 | 4;

function Fixes() {
  const router = useRouter();
  const [journey, , , ready] = useJourney('cc', EMPTY_CC_JOURNEY);
  const [open, setOpen] = useState<Record<FixId, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const [loanRate, setLoanRate] = useState<number | null | undefined>(undefined);
  const filled = hasCardDetails(journey);
  const d = weightedCard(journey.cards);

  useEffect(() => {
    if (ready && !filled) router.replace('/journey/credit-card');
  }, [ready, filled, router]);

  // Lowest real personal-loan rate on offer for this amount (replaces the design's fixed "10.75%")
  useEffect(() => {
    if (!ready || !filled || d.outstanding <= 0) return;
    let live = true;
    fetchOffers(d.outstanding, 24)
      .then((offers) => {
        if (!live) return;
        const rates = offers.map((o) => o.offeredRatePercent).filter((r) => r > 0);
        setLoanRate(rates.length ? Math.min(...rates) : null);
      })
      .catch(() => live && setLoanRate(null));
    return () => {
      live = false;
    };
  }, [ready, filled, d.outstanding]);

  if (!ready || !filled) return <div className="min-h-screen bg-slate-50" />;

  const rate = d.rate || 42;
  const minResult = minOnlyPayoff(d.outstanding, rate, d.minDue);
  const yrs = Math.floor(minResult.months / 12);
  const payoffTime = yrs >= 1 ? `> ${yrs} yr${yrs > 1 ? 's' : ''}` : `> ${minResult.months % 12} months`;
  const ti = minResult.totalInterest;
  const interestStr = ti >= 100000 ? `> ₹${Math.floor(ti / 100000)}L` : ti >= 1000 ? `> ₹${Math.floor(ti / 1000)}k` : `> ₹${(Math.floor(ti / 10) * 10).toLocaleString('en-IN')}`;

  const toggle = (id: FixId) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const go = (path: string) => router.push(path);

  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/journey/credit-card/analysis" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" aria-hidden /> AI-Ranked Fixes
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your Way <span className="text-blue-600">Out.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">4 fixes, AI-ranked</p>
        </div>

        <div className="space-y-4">
          {/* Fix #1 */}
          <FixCard id={1} open={open[1]} onToggle={toggle} Icon={TrendingUp} tint="bg-emerald-50 text-emerald-600" kicker="Fastest win" title="Pay more than the minimum" body="Cuts the interest bleed the fastest. Even a small extra payment each month rewrites your payoff timeline dramatically.">
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <AlertTriangle className="w-4 h-4" aria-hidden /> Minimum only path
                </span>
                <span className="text-sm font-bold text-rose-600">{payoffTime}</span>
              </div>
              <div className="w-full h-2 bg-rose-200 rounded-full overflow-hidden mb-2.5">
                <div className="w-full h-full bg-rose-500 rounded-full" />
              </div>
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-rose-800">
                  Total interest: <span className="text-rose-600">{interestStr}</span>
                </span>
                <span className="text-[11px] text-rose-700">if you only pay minimums</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">Pay more and you finish faster — set your own amount in the plan builder below.</p>
            <CTA onClick={() => go('/journey/credit-card/plan')}>Build my plan</CTA>
          </FixCard>

          {/* Fix #2 */}
          <FixCard id={2} open={open[2]} onToggle={toggle} Icon={Layers} tint="bg-blue-50 text-blue-600" kicker="Simplify debt" title="Merge 2+ cards into one" body="One due date, one rate, faster payoff. Balance-transfer offers (sometimes 0% for 3–6 months) can let you pay principal directly — no interest bleeding.">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-2">
                <Info className="w-4 h-4" aria-hidden /> How balance transfer works
              </div>
              <p className="text-xs text-blue-800 leading-relaxed mb-2.5">
                Move balances from high-rate cards to a single card with a lower rate (or 0% intro offer). You pay one EMI instead of many, and every rupee goes to principal.
              </p>
              <ol className="space-y-2">
                {[
                  'List all cards with their outstanding balance & interest rate',
                  'Apply for a BT offer — many banks offer 0% for 3–6 months with a 1–2% fee',
                  'Transfer the highest-rate balances first, then pay aggressively during the 0% window',
                ].map((t, i) => (
                  <li key={t} className="flex items-start gap-2">
                    <span aria-hidden className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-blue-800 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ol>
            </div>
            <CTA onClick={() => go('/journey/credit-card/switch-to-loan')}>Explore balance transfer</CTA>
          </FixCard>

          {/* Fix #3 */}
          <FixCard
            id={3}
            open={open[3]}
            onToggle={toggle}
            Icon={Landmark}
            tint="bg-violet-50 text-violet-600"
            kicker="Biggest saving"
            title="Switch to a loan"
            body={`That ~${rate.toFixed(0)}% card interest is taking a toll on your income. A personal loan at 12–18% halves the bleed — same debt, half the cost.`}
          >
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="flex-1 min-w-0 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-center">
                <div className="text-[10px] font-semibold tracking-wider text-rose-800 uppercase mb-1.5">CARDS NOW</div>
                <div className="text-[11px] text-slate-500 mb-1">avg. rate</div>
                <div className="text-2xl font-bold text-rose-600 leading-none tabular-nums">{Math.round(rate)}%</div>
                <div className="text-[11px] text-slate-500 mt-1">per year</div>
                <div className="text-[11px] text-slate-500">no end date</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
              <div className="flex-1 min-w-0 rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-center">
                <div className="text-[10px] font-semibold tracking-wider text-emerald-800 uppercase mb-1.5">PERSONAL LOAN</div>
                <div className="text-[11px] text-slate-500 mb-1">Starts @</div>
                <div className="text-2xl font-bold text-emerald-600 leading-none tabular-nums">{loanRate === undefined ? '…' : loanRate === null ? '—' : `${+loanRate.toFixed(2)}%`}</div>
                <div className="text-[11px] text-slate-500 mt-1">per year</div>
                <div className="text-[11px] text-slate-500">fixed end date</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">Fixed rate, fixed end date — far less interest than your card.</p>
            <CTA onClick={() => go('/journey/credit-card/switch-to-loan')}>See how much I&apos;d save</CTA>
          </FixCard>

          {/* Fix #4 */}
          <FixCard
            id={4}
            open={open[4]}
            onToggle={toggle}
            Icon={Bell}
            tint="bg-amber-50 text-amber-600"
            kicker="Protect score"
            title="Monthly card utilisation alerts"
            body="Know before the bank charges — protect your score. Staying under 30% utilisation can improve your CIBIL by 50–80 points over 6 months."
          >
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 mb-3">
              <div className="text-xs font-semibold text-slate-900 mb-2.5">How utilisation affects your CIBIL</div>
              <div className="space-y-2.5">
                {[
                  { l: '<30%', w: '70%', bar: 'bg-emerald-500', t: 'Ideal ✓', tc: 'text-emerald-600' },
                  { l: '30–60%', w: '50%', bar: 'bg-amber-500', t: 'Watch out', tc: 'text-amber-600' },
                  { l: '>60%', w: '100%', bar: 'bg-rose-500', t: 'Hurts score', tc: 'text-rose-600' },
                ].map((r) => (
                  <div key={r.l} className="flex items-center gap-2.5">
                    <div className="w-14 text-[11px] font-semibold text-slate-700 text-right shrink-0">{r.l}</div>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.bar}`} style={{ width: r.w }} />
                    </div>
                    <div className={`text-[11px] font-semibold w-[70px] shrink-0 ${r.tc}`}>{r.t}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">
              Set up an alert when utilisation crosses 25% — gives you time to pay down before the statement date, which is what banks report to CIBIL.
            </p>
            <CTA onClick={() => go('/settings')}>Set up utilisation alert</CTA>
          </FixCard>
        </div>

        {/* IF MONEY IS SHORT */}
        <section>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            IF MONEY IS SHORT
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="card-fintech p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Can&apos;t pay this month?</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              A missed payment triggers a penalty (₹500–2,500), a late fee, and a CIBIL hit. Before that happens, your bank likely has options — a hardship hold, minimum reduction, or short deferral.
            </p>
            <button type="button" onClick={() => go('/journey/hard-month')} className="btn-secondary w-full sm:w-auto">
              See my options <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function CTA({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="btn-accent w-full sm:w-auto">
      {children} <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden />
    </button>
  );
}

type FixCardProps = {
  id: FixId;
  open: boolean;
  onToggle: (id: FixId) => void;
  Icon: LucideIcon;
  tint: string;
  kicker: string;
  title: string;
  body: string;
  children: React.ReactNode;
};

/** Expandable fix card (design: #ccs-fixN-card + toggleFixN). */
function FixCard({ id, open, onToggle, Icon, tint, kicker, title, body, children }: FixCardProps) {
  const panelId = `ccs-fix${id}-expanded`;
  return (
    <div onClick={() => onToggle(id)} className="card-fintech-interactive p-5 cursor-pointer">
      {/* Header is the keyboard-accessible toggle; its click bubbles to the card */}
      <button type="button" aria-expanded={open} aria-controls={panelId} className="flex w-full items-start justify-between gap-2 text-left mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div aria-hidden className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">{kicker}</div>
            <div className="font-semibold text-slate-900 leading-tight">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="badge-slate">#{id}</span>
          <ChevronDown aria-hidden className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <p className="text-xs text-slate-600 leading-relaxed">{body}</p>

      {open && (
        <div id={panelId} onClick={(e) => e.stopPropagation()} className="mt-3.5 cursor-default">
          {children}
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ChevronRight, PartyPopper, Zap } from 'lucide-react';
import JourneyHeader from '@/components/design/JourneyHeader';
import { LIFE_EVENTS, LIFE_EVENT_KEYS } from './events';

/** Life-Event Planning (design #life-event-page): pick an occasion. */
export default function LifeEventsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <JourneyHeader backHref="/" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <PartyPopper className="w-4 h-4" aria-hidden /> Life events
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Life-Event Planning</h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Big moments deserve smart funding. Pick your occasion — Navesta builds a personal loan plan around your income and savings in seconds.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {LIFE_EVENT_KEYS.map((key) => {
            const ev = LIFE_EVENTS[key];
            return (
              <Link key={key} href={`/life-events/${key}`} className="card-fintech-interactive relative block p-4 sm:p-5 text-center">
                <ChevronRight className="w-4 h-4 text-slate-300 absolute top-3 right-3" aria-hidden />
                <div className="text-4xl mb-2" aria-hidden>
                  {ev.emoji}
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-2">{ev.title}</div>
                <span className="badge-blue">{ev.range}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-start justify-center gap-2 text-xs text-slate-500 leading-relaxed text-center">
          <Zap className="w-4 h-4 shrink-0 text-blue-600" aria-hidden />
          <span>
            Navesta builds your plan in seconds using RBI-approved loan benchmarks. No impact on your credit score.
          </span>
        </div>
      </main>
    </div>
  );
}

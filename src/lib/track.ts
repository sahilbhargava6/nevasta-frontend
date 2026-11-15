import { api, ensureCsrf } from '@/lib/api';

/**
 * Journey tracking: reports which journey step a visitor or customer
 * reached (backend: POST /journey-events, steps listed in
 * App\Support\JourneyCatalog). Only the journey and step are sent: never
 * amounts, names or anything typed into a form. Each step is sent once per
 * browser session, batched, and failures are ignored: tracking never gets
 * in the customer's way.
 */

export type TrackJourney = 'signup' | 'debt_management' | 'credit_card' | 'loan' | 'multiple' | 'life_events';

type TrackEvent = { journey: TrackJourney; step: string; detail?: string };

const queue: TrackEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/** Random id for this browser, so visitors can be counted without knowing who they are. */
function visitorId(): string | null {
  try {
    let id = localStorage.getItem('navesta_vid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('navesta_vid', id);
    }
    return id;
  } catch {
    return null;
  }
}

/** True the first time a step is seen in this browser session (refreshes don't count again). */
function firstTime(key: string): boolean {
  try {
    const seen: string[] = JSON.parse(sessionStorage.getItem('navesta_tracked') || '[]');
    if (seen.includes(key)) return false;
    sessionStorage.setItem('navesta_tracked', JSON.stringify([...seen, key].slice(-200)));
    return true;
  } catch {
    return true;
  }
}

async function flush() {
  timer = null;
  const events = queue.splice(0, 20);
  if (!events.length) return;
  try {
    // The API checks a CSRF cookie on every write; first-time visitors don't have one yet
    if (!document.cookie.includes('XSRF-TOKEN=')) await ensureCsrf();
    await api.post('/journey-events', { visitorId: visitorId(), events });
  } catch {
    // Never interrupt the customer over analytics
  }
  if (queue.length) timer = setTimeout(flush, 300);
}

/** Short readable key for a detail, e.g. "HDFC Bank" → "hdfc-bank". */
export function detailKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Record that a journey step was reached, e.g. trackStep('credit_card', 'offers_shown'). */
export function trackStep(journey: TrackJourney, step: string, detail?: string) {
  if (typeof window === 'undefined') return;
  if (!firstTime(`${journey}.${step}.${detail ?? ''}`)) return;
  queue.push(detail ? { journey, step, detail } : { journey, step });
  if (!timer) timer = setTimeout(flush, 300);
}

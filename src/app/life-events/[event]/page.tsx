import { notFound } from 'next/navigation';
import { LIFE_EVENT_KEYS, isLifeEventKey } from '../events';
import EventPlanner from './EventPlanner';

export function generateStaticParams() {
  return LIFE_EVENT_KEYS.map((event) => ({ event }));
}

/** Event loan plan (design #elp-page) for one life event, e.g. /life-events/wedding. */
export default async function LifeEventPlanPage({ params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  if (!isLifeEventKey(event)) notFound();
  return <EventPlanner key={event} eventKey={event} />;
}

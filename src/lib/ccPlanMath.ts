import type { CardEntry } from '@/lib/journey';

/**
 * Maths for the credit-card "Pay More, Save More" plan, the Pay-More
 * Simulator and the "Switch to a Loan" screens, ported from the design
 * prototype (updatePlanPage, calcMinOnlyPayoff, pmsCalcMonths, cclPMT,
 * cclCalcMinOnly). All cards in the journey are combined into one balance.
 */

export type CombinedCards = {
  outstanding: number;
  minDue: number;
  limit: number;
  /** Outstanding-weighted average yearly rate (%) */
  rate: number;
  count: number;
  /** Display name: the bank for one card, "Your N cards" for several */
  name: string;
};

export function combineCards(cards: CardEntry[]): CombinedCards {
  const list = (cards ?? []).filter(Boolean);
  const outstanding = list.reduce((s, c) => s + Math.max(0, Number(c.outstanding) || 0), 0);
  const minDue = list.reduce((s, c) => s + Math.max(0, Number(c.minDue) || 0), 0);
  const limit = list.reduce((s, c) => s + Math.max(0, Number(c.limit) || 0), 0);
  let rate: number;
  if (outstanding > 0) {
    rate = list.reduce((s, c) => s + (Number(c.rate) || 0) * Math.max(0, Number(c.outstanding) || 0), 0) / outstanding;
  } else {
    const rated = list.filter((c) => Number(c.rate) > 0);
    rate = rated.length ? rated.reduce((s, c) => s + Number(c.rate), 0) / rated.length : 0;
  }
  const withBalance = list.filter((c) => (Number(c.outstanding) || 0) > 0);
  const name =
    withBalance.length === 1
      ? withBalance[0].bank?.trim() || 'Your Card'
      : withBalance.length > 1
        ? `Your ${withBalance.length} cards`
        : 'Your Card';
  return { outstanding, minDue, limit, rate, count: withBalance.length, name };
}

/** Monthly card rate including 18% GST on interest (design: rate/1200 × 1.18). */
export function cardMonthlyRate(annualRatePercent: number): number {
  return (annualRatePercent / 100 / 12) * 1.18;
}

/** Monthly payment for principal p at monthly rate r over n months. */
export function pmtMonthly(p: number, r: number, n: number): number {
  if (p <= 0 || n <= 0) return 0;
  if (r === 0) return p / n;
  const f = Math.pow(1 + r, n);
  return (p * r * f) / (f - 1);
}

/** Months to clear `outstanding` paying `amount` each month (null if it only covers interest). */
export function monthsForAmount(outstanding: number, r: number, amount: number): number | null {
  if (!amount || amount <= 0) return null;
  if (r === 0) return Math.max(1, Math.min(360, Math.ceil(outstanding / amount)));
  if (amount <= outstanding * r) return null;
  const months = Math.ceil(-Math.log(1 - (outstanding * r) / amount) / Math.log(1 + r));
  return Math.max(1, Math.min(months, 360));
}

/** The design's fixed "minimum only" payment: min due, else 5% of the balance (at least ₹200). */
export function fixedMinPayment(outstanding: number, minDue: number): number {
  return minDue > 0 ? minDue : Math.max(200, outstanding * 0.05);
}

/** Paying a fixed minimum every month (design: calcMinOnlyPayoff). */
export function calcMinOnlyPayoff(outstanding: number, annualRate: number, minDue: number) {
  const fixedPayment = fixedMinPayment(outstanding, minDue);
  const r = cardMonthlyRate(annualRate);
  const maxMonths = 600;
  let bal = outstanding;
  let cumPaid = 0;
  let month = 0;
  while (bal > 0.5 && month < maxMonths) {
    bal = bal * (1 + r) - fixedPayment;
    if (bal < 0) bal = 0;
    cumPaid += fixedPayment;
    month++;
    if (month > 12 && bal >= outstanding) {
      month = maxMonths;
      break;
    }
  }
  const totalInterest = Math.max(0, cumPaid - outstanding);
  const neverClears = month >= maxMonths;
  return { months: month, totalInterest, neverClears };
}

/** Months and total interest paying `payment` each month at monthly rate r (design: pmsCalcMonths). */
export function payoffWith(outstanding: number, r: number, payment: number) {
  let bal = outstanding;
  let totalInterest = 0;
  let months = 0;
  while (bal > 0.01 && months < 720) {
    const interest = bal * r;
    const pay = Math.min(payment, bal + interest);
    totalInterest += interest;
    bal = bal + interest - pay;
    months++;
  }
  return { months, totalInterest, neverClears: bal > 0.01 };
}

/** Card interest when paying 5% of the starting balance (min ₹200) each month (design: cclCalcMinOnly). */
export function cardMinOnlyInterest(outstanding: number, annualRate: number): number {
  const r = cardMonthlyRate(annualRate);
  const minPay = Math.max(outstanding * 0.05, 200);
  let bal = outstanding;
  let total = 0;
  let m = 0;
  while (bal > 0.01 && m < 720) {
    const interest = bal * r;
    const pay = Math.min(minPay, bal + interest);
    total += interest;
    bal = bal + interest - pay;
    m++;
  }
  return total;
}

/** "1 yr 3 mo" / "8 months" */
export function fmtDuration(months: number): string {
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  return yrs > 0 ? `${yrs} yr${yrs > 1 ? 's' : ''}${mo > 0 ? ` ${mo} mo` : ''}` : `${months} months`;
}

/** Axis label: ₹1.5L / ₹45k / ₹2.5k / ₹0 (design: drawPlanChart). */
export function fmtAxis(v: number): string {
  const n = Math.round(v);
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1).replace('.0', '') + 'L';
  if (n >= 10000) return '₹' + Math.round(n / 1000) + 'k';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return '₹' + n;
}

/** Smooth Catmull-Rom style path through points (design: chartPath). */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let path = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  const n = pts.length;
  for (let k = 0; k < n - 1; k++) {
    const p0 = pts[Math.max(0, k - 1)];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[Math.min(n - 1, k + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

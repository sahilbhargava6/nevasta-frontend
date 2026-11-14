import type { CardEntry, CreditCardJourney } from '@/lib/journey';

/**
 * Credit-card journey maths, ported from the design prototype
 * (submitCCDetails, calcMinOnlyPayoff in Navesta_Website_22Sep26.html).
 * Shared by /journey/credit-card/* screens.
 */

/**
 * Empty starting point for the card journey. Use this as the `useJourney('cc', …)`
 * fallback so a customer who has not entered anything never sees demo figures:
 * `hasCardDetails(journey)` is false until the "Add your card" form is submitted.
 */
export const EMPTY_CC_JOURNEY: CreditCardJourney = { method: 'upload', cards: [], income: 0 };

/** True once the "Add your card" screen has been submitted with usable figures. */
export function hasCardDetails(j: CreditCardJourney | null | undefined): boolean {
  return !!j && j.income > 0 && j.cards.some((c) => c.outstanding > 0);
}

export type CardTotals = {
  /** Sum of outstanding across cards (₹). */
  outstanding: number;
  /** Sum of minimum dues (₹/month). */
  minDue: number;
  /** Sum of credit limits (₹); 0 when no limits were entered. */
  limit: number;
  /** Annual rate %, weighted by outstanding (simple average if nothing is owed). */
  rate: number;
  /** Bank / card name: the single card's name, or the names joined. */
  bank: string;
  /** Number of cards with an outstanding balance. */
  count: number;
};

/** Combine every card into one "virtual" card for the analysis (the prototype only used card 1). */
export function weightedCard(cards: CardEntry[]): CardTotals {
  const used = cards.filter((c) => c.outstanding > 0);
  const outstanding = used.reduce((s, c) => s + c.outstanding, 0);
  const minDue = used.reduce((s, c) => s + (c.minDue || 0), 0);
  const limit = used.reduce((s, c) => s + (c.limit || 0), 0);
  const rate =
    outstanding > 0
      ? used.reduce((s, c) => s + c.rate * c.outstanding, 0) / outstanding
      : used.length
        ? used.reduce((s, c) => s + c.rate, 0) / used.length
        : 0;
  const names = used.map((c) => c.bank.trim()).filter(Boolean);
  const bank = names.length === 0 ? 'Your Card' : names.length === 1 ? names[0] : names.join(', ');
  return { outstanding, minDue, limit, rate, bank, count: used.length };
}

export type MonthlySplit = {
  /** Monthly interest = outstanding × rate / 1200 (rounded). */
  interest: number;
  /** 18% GST on the interest (rounded). */
  gst: number;
  interestGST: number;
  /** Part of the minimum due that actually reduces the debt: max(0, minDue − (interest + GST)). */
  cleared: number;
  /** Share of the payment eaten by interest + GST (0–100). */
  intPct: number;
  clearedPct: number;
  /** What is still owed after three more minimum payments: outstanding − cleared × 3. */
  owe3m: number;
};

/** Where this month's minimum payment goes (design: submitCCDetails). */
export function monthlySplit(outstanding: number, annualRate: number, minDue: number): MonthlySplit {
  const interest = Math.round((outstanding * annualRate) / 1200);
  const gst = Math.round(interest * 0.18);
  const interestGST = interest + gst;
  const cleared = Math.max(0, minDue - interestGST);
  const intPct = minDue > 0 ? Math.min(100, Math.max(0, Math.round((interestGST / minDue) * 100))) : 100;
  return {
    interest,
    gst,
    interestGST,
    cleared,
    intPct,
    clearedPct: 100 - intPct,
    owe3m: Math.round(outstanding - cleared * 3),
  };
}

export type MinOnlyPayoff = {
  months: number;
  /** "3 yrs 4m", "8 months" or "50+ yrs" (never paid off). */
  timeStr: string;
  totalInterest: number;
  /** The minimum never covers the interest + GST. */
  never: boolean;
};

const MAX_MONTHS = 600;

/**
 * Paying only the minimum due as a fixed monthly amount (design: calcMinOnlyPayoff).
 * Interest carries 18% GST. Falls back to 5% of outstanding (min ₹200) if no minimum is known.
 * The last month pays only what is left, so the total interest is not overstated.
 */
export function minOnlyPayoff(outstanding: number, annualRate: number, minDue: number): MinOnlyPayoff {
  const payment = minDue > 0 ? minDue : Math.max(200, outstanding * 0.05);
  const r = (annualRate / 100 / 12) * 1.18;
  let bal = outstanding;
  let paid = 0;
  let month = 0;
  let never = false;
  while (bal > 0.5 && month < MAX_MONTHS) {
    const due = bal * (1 + r);
    const pay = Math.min(payment, due);
    bal = due - pay;
    paid += pay;
    month++;
    if (month > 12 && bal >= outstanding) {
      never = true;
      month = MAX_MONTHS;
      break;
    }
  }
  if (month >= MAX_MONTHS) never = true;
  let timeStr: string;
  if (never) timeStr = '50+ yrs';
  else {
    const yrs = Math.floor(month / 12);
    const mo = month % 12;
    timeStr = yrs > 0 ? `${yrs} yr${yrs > 1 ? 's' : ''}${mo > 0 ? ` ${mo}m` : ''}` : `${mo} months`;
  }
  return { months: month, timeStr, totalInterest: Math.max(0, paid - outstanding), never };
}

export const MINPAY_MILESTONES = [3, 6, 12, 18, 24];

/**
 * "Keep paying the minimum" chart data (design: submitCCDetails chart IIFE).
 * The minimum is the same % of the balance the customer pays today (clamped 2–25%,
 * ₹200 floor), recomputed each month on balance + interest + 18% GST.
 */
export function minPayProjection(outstanding: number, annualRate: number, minDue: number, milestones = MINPAY_MILESTONES) {
  const monthlyRate = annualRate / 12 / 100;
  let minDueRate = outstanding > 0 && minDue > 0 ? minDue / outstanding : 0.05;
  minDueRate = Math.max(0.02, Math.min(0.25, minDueRate));
  const owed: number[] = [];
  const paid: number[] = [];
  let bal = outstanding;
  let cum = 0;
  let idx = 0;
  const last = milestones[milestones.length - 1] ?? 24;
  for (let m = 1; m <= last && idx < milestones.length; m++) {
    const int = bal * monthlyRate;
    const newBal = bal + int + int * 0.18;
    const pay = Math.min(Math.max(200, minDueRate * newBal), newBal);
    bal = Math.max(0, newBal - pay);
    cum += pay;
    if (m === milestones[idx]) {
      owed.push(Math.round(bal));
      paid.push(Math.round(cum));
      idx++;
    }
  }
  return { milestones, owed, paid };
}

/** ₹X.XXL above a lakh, else ₹X,XXX (design: fmtLakh / fmtV). */
export function fmtLakh(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  return '₹' + Math.round(v).toLocaleString('en-IN');
}

/** Parse "₹1,20,000" / "42.5" style input; NaN-safe (returns 0). */
export function parseAmount(raw: string): number {
  const n = parseFloat(String(raw).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

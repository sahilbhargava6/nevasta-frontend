import { pmt, type DebtEntry } from '@/lib/journey';

/**
 * Debt-consolidation maths, ported from the design prototype
 * (mdAnalyse, dcShowSummary, dcCalcSavings, dcRenderBreakdown).
 */

/** Months left on a debt; the design falls back to 36 when it was left blank. */
export const debtMonths = (d: DebtEntry) => (d.months > 0 ? d.months : 36);

/** EMI on a debt; when left blank, the design derives it from amount, rate and months left. */
export const debtEmi = (d: DebtEntry) => (d.emi > 0 ? d.emi : pmt(d.amount, d.rate, debtMonths(d)));

/** Only rows with an outstanding amount count (as in mdAnalyse). */
export const activeDebts = (debts: DebtEntry[]) => debts.filter((d) => d.amount > 0);

export const DEBT_TYPE_LABEL: Record<DebtEntry['type'], string> = {
  personal_loan: 'Personal Loan',
  credit_card: 'Credit Card',
};

export function portfolioStats(all: DebtEntry[]) {
  const debts = activeDebts(all);
  const totalOutstanding = debts.reduce((s, d) => s + d.amount, 0);
  const totalEmi = debts.reduce((s, d) => s + debtEmi(d), 0);
  const blendedRate = totalOutstanding > 0 ? debts.reduce((s, d) => s + d.rate * d.amount, 0) / totalOutstanding : 0;

  let highest: DebtEntry | null = null;
  for (const d of debts) if (d.rate > 0 && (!highest || d.rate > highest.rate)) highest = d;

  // Total interest if unchanged = Σ(emi × months − amount), positive parts only
  const totalInterest = debts.reduce((s, d) => s + Math.max(0, debtEmi(d) * debtMonths(d) - d.amount), 0);
  // What the customer will pay in total if nothing changes
  const totalPayable = debts.reduce((s, d) => s + debtEmi(d) * debtMonths(d), 0);

  return { debts, totalOutstanding, totalEmi, blendedRate, highest, totalInterest, totalPayable };
}

/** savings(t) = Σ(emi_i × months_i) − newEMI × t, never below zero (dcCalcSavings). */
export function consolidationSavings(all: DebtEntry[], ratePercent: number, tenureMonths: number, newEmi?: number) {
  const { totalOutstanding, totalPayable } = portfolioStats(all);
  const emi = newEmi ?? pmt(totalOutstanding, ratePercent, tenureMonths);
  return Math.max(0, totalPayable - emi * tenureMonths);
}

/** The design's compact money format: ₹4.4L, ₹85k, ₹1.2Cr (dcFmtCompact). */
export function fmtDcCompact(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${Math.round(n)}`;
}

/** "3 yrs", "1 yr 6 mo", "6 months" (tenure chip). */
export function tenureLabel(months: number): string {
  const yr = Math.floor(months / 12);
  const mo = months % 12;
  return yr > 0 ? `${yr} yr${yr > 1 ? 's' : ''}${mo > 0 ? ` ${mo} mo` : ''}` : `${mo} months`;
}

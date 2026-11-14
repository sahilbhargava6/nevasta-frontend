import { pmt, type LoanJourney } from '@/lib/journey';

/**
 * Loan-journey maths, ported from the design prototype
 * (Navesta_Website_22Sep26.html: submitLoanDetails, lfNewTenure, lfCalcPrepay,
 * lfRenderPayChart, showLoanAnalysisPage, lfbt* helpers).
 */

export type LoanType = LoanJourney['loanType'];

/** Loan-type select of #loan-page (the design's "car" is our "auto"). */
export const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: 'personal', label: '💵  Personal loan' },
  { value: 'home', label: '🏠  Home loan' },
  { value: 'auto', label: '🚗  Car loan' },
  { value: 'education', label: '📚  Education loan' },
  { value: 'business', label: '💼  Business loan' },
  { value: 'other', label: '📋  Other loan' },
];

/** "PERSONAL LOAN · ANALYSIS" label (showLoanAnalysisPage typeMap). */
export const ANALYSIS_TYPE_LABEL: Record<LoanType, string> = {
  personal: 'PERSONAL LOAN',
  home: 'HOME LOAN',
  auto: 'CAR LOAN',
  education: 'EDUCATION LOAN',
  business: 'BUSINESS LOAN',
  other: 'LOAN',
};

/** "PERSONAL · LOAN SNAPSHOT" label (showLoanFixesPage typeMap). */
export const FIXES_TYPE_LABEL: Record<LoanType, string> = {
  personal: 'PERSONAL',
  home: 'HOME LOAN',
  auto: 'CAR LOAN',
  education: 'EDUCATION',
  business: 'BUSINESS',
  other: 'LOAN',
};

export type LoanAnalysis = {
  emi: number;
  totalPay: number;
  totalInterest: number;
  interestPct: number;
  principalPct: number;
  monthInterest: number;
  monthPrincipal: number;
};

/** EMI, total interest and split for the remaining loan (submitLoanDetails). */
export function analyzeLoan(loan: Pick<LoanJourney, 'outstanding' | 'rate' | 'tenureLeft'>): LoanAnalysis {
  const emi = loan.rate > 0 ? pmt(loan.outstanding, loan.rate, loan.tenureLeft) : 0;
  const totalPay = emi * loan.tenureLeft;
  const totalInterest = Math.max(0, totalPay - loan.outstanding);
  const interestPct = totalPay > 0 ? (totalInterest / totalPay) * 100 : 0;
  const monthInterest = loan.outstanding * (loan.rate / 1200);
  return {
    emi,
    totalPay,
    totalInterest,
    interestPct,
    principalPct: 100 - interestPct,
    monthInterest,
    monthPrincipal: emi - monthInterest,
  };
}

/** Months to repay `newPrincipal` at the same EMI (lfNewTenure). */
export function tenureAtEmi(newPrincipal: number, emi: number, annualRatePercent: number): number {
  if (newPrincipal <= 0) return 0;
  if (emi <= 0) return 0;
  if (!annualRatePercent) return Math.ceil(newPrincipal / emi);
  const r = annualRatePercent / 1200;
  const inside = 1 - (newPrincipal * r) / emi;
  if (inside <= 0) return 0;
  return Math.ceil(-Math.log(inside) / Math.log(1 + r));
}

export type PrepayResult = {
  newOutstanding: number;
  newTenure: number;
  newInterest: number;
  saved: number;
  monthsFreed: number;
  afterPct: number;
  savePct: number;
  prepayPct: number;
};

/** Part-prepayment simulator (lfCalcPrepay): same EMI, shorter tenure. */
export function simulatePrepay(loan: Pick<LoanJourney, 'outstanding' | 'rate' | 'tenureLeft'>, prepay: number): PrepayResult | null {
  if (!prepay || prepay <= 0 || !loan.outstanding) return null;
  const a = analyzeLoan(loan);
  const newOutstanding = Math.max(0, loan.outstanding - prepay);
  const newTenure = newOutstanding <= 0 ? 0 : tenureAtEmi(newOutstanding, a.emi, loan.rate);
  const newInterest = newOutstanding <= 0 ? 0 : Math.max(0, a.emi * newTenure - newOutstanding);
  const saved = Math.max(0, a.totalInterest - newInterest);
  const afterPct = a.totalInterest > 0 ? Math.round((newInterest / a.totalInterest) * 100) : 0;
  return {
    newOutstanding,
    newTenure,
    newInterest,
    saved,
    monthsFreed: Math.max(0, loan.tenureLeft - newTenure),
    afterPct,
    savePct: 100 - afterPct,
    prepayPct: loan.outstanding > 0 ? Math.round((prepay / loan.outstanding) * 100) : 0,
  };
}

/** Total interest if the remaining loan moved to `newRate` over the same tenure (showLoanFixesPage btSave). */
export function interestSavedAtRate(loan: Pick<LoanJourney, 'outstanding' | 'rate' | 'tenureLeft'>, newRate: number): number {
  const before = analyzeLoan(loan).totalInterest;
  const after = Math.max(0, pmt(loan.outstanding, newRate, loan.tenureLeft) * loan.tenureLeft - loan.outstanding);
  return Math.max(0, before - after);
}

/** BT saving on the eligibility results: (EMI now − EMI at best rate) × months (lfbtShowResults). */
export function btSaving(outstanding: number, curRate: number, bestRate: number, months: number): number {
  const emi1 = pmt(outstanding, curRate, months);
  const emi2 = pmt(outstanding, bestRate, months);
  return Math.max(0, (emi1 - emi2) * months);
}

export type PayPoint = { month: number; owed: number; paid: number };

/** Up to 5 milestones of cumulative paid vs balance owed (lfRenderPayChart). */
export function payChartSeries(loan: Pick<LoanJourney, 'outstanding' | 'rate' | 'tenureLeft'>): PayPoint[] {
  const { emi } = analyzeLoan(loan);
  const r = loan.rate / 1200;
  if (!loan.outstanding || !emi || !r || !loan.tenureLeft) return [];
  const totalM = Math.min(loan.tenureLeft, 60);
  const raw = [0.2, 0.4, 0.6, 0.8].map((f) => Math.round(totalM * f)).concat(totalM).filter((m) => m > 0);
  const milestones = raw.filter((m, i) => raw.indexOf(m) === i);
  const out: PayPoint[] = [];
  let bal = loan.outstanding;
  let cumPaid = 0;
  let idx = 0;
  for (let m = 1; m <= totalM && idx < milestones.length; m++) {
    const interest = bal * r;
    const principal = Math.max(0, Math.min(emi - interest, bal));
    bal = Math.max(0, bal - principal);
    cumPaid += emi;
    if (m === milestones[idx]) {
      out.push({ month: m, owed: Math.round(bal), paid: Math.round(cumPaid) });
      idx++;
    }
  }
  return out.length >= 2 ? out : [];
}

/** "80.0k" / "1.4 L" / "1.2 Cr" (lfFmtLa). */
export function fmtLa(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + ' L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toString();
}

/** "₹1.4L" / "₹45k" (lfbtFmtINR). */
export function fmtShortK(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + Math.round(n / 1000) + 'k';
  return '₹' + Math.round(n);
}

/** "2 yrs 6 mo" / "8 months" (lfbtShowResults tenureStr). */
export function fmtTenure(months: number): string {
  const yr = Math.floor(months / 12);
  const mo = months % 12;
  return yr > 0 ? `${yr} yr${yr > 1 ? 's' : ''}${mo > 0 ? ` ${mo} mo` : ''}` : `${mo} months`;
}

/** Rate as typed: 14 → "14", 10.75 → "10.75". */
export function fmtRate(rate: number): string {
  return String(Math.round(rate * 100) / 100);
}

export type LoanField = 'originalAmount' | 'originalTenure' | 'outstanding' | 'tenureLeft' | 'rate';

/** Required-field and sanity checks for #loan-page. Returns a message per invalid field. */
export function validateLoan(v: Record<LoanField, string>): Partial<Record<LoanField, string>> {
  const errors: Partial<Record<LoanField, string>> = {};
  const num = (k: LoanField) => Number(v[k]);
  (Object.keys(v) as LoanField[]).forEach((k) => {
    if (!v[k].trim()) errors[k] = 'Required';
    else if (!Number.isFinite(num(k)) || num(k) <= 0) errors[k] = 'Enter a number above 0';
  });
  if (!errors.originalTenure && !Number.isInteger(num('originalTenure'))) errors.originalTenure = 'Enter whole months';
  if (!errors.tenureLeft && !Number.isInteger(num('tenureLeft'))) errors.tenureLeft = 'Enter whole months';
  if (!errors.originalTenure && num('originalTenure') > 600) errors.originalTenure = 'Tenure can be at most 600 months';
  if (!errors.outstanding && !errors.originalAmount && num('outstanding') > num('originalAmount'))
    errors.outstanding = 'Outstanding can’t be more than the original loan amount';
  if (!errors.tenureLeft && !errors.originalTenure && num('tenureLeft') > num('originalTenure'))
    errors.tenureLeft = 'Tenure left can’t be more than the original tenure';
  if (!errors.rate && (num('rate') < 1 || num('rate') > 60)) errors.rate = 'Enter a yearly rate between 1% and 60%';
  return errors;
}

/** A loan the analysis/fixes screens can work with. */
export function isUsableLoan(loan: LoanJourney): boolean {
  return loan.outstanding > 0 && loan.tenureLeft > 0 && loan.rate > 0;
}

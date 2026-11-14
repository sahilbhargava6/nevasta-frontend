'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * State carried through the design journeys (credit card, loan, multiple
 * debts, eligibility wizard). Kept in sessionStorage so a refresh mid-journey
 * keeps the customer's entries, and cleared when the tab closes.
 */

export type CardEntry = {
  bank: string;
  outstanding: number;
  rate: number; // % per year
  minDue: number;
  limit: number;
  payDue: string; // e.g. "2026-10-01"
};

export type CreditCardJourney = {
  method: 'upload' | 'manual';
  cards: CardEntry[];
  income: number; // monthly
};

export type LoanJourney = {
  loanType: 'personal' | 'home' | 'auto' | 'education' | 'business' | 'other';
  originalAmount: number;
  originalTenure: number; // months
  outstanding: number;
  tenureLeft: number; // months
  rate: number; // % per year
};

export type DebtEntry = {
  type: 'personal_loan' | 'credit_card';
  amount: number;
  rate: number;
  emi: number;
  months: number;
};

export type MultiDebtJourney = { debts: DebtEntry[]; tenure: number };

/** Answers from the 2-step eligibility wizards (shared by all journeys). */
export type EligibilityProfile = {
  housing: 'own' | 'rent' | null;
  rent: number | null;
  address: string;
  pincode: string;
  city: string;
  state: string;
  education: string;
  sector: 'salaried' | 'self' | null;
  income: number | null;
  loanNeed: 'balance' | 'more' | null;
  extraAmount: number;
};

export const DEFAULT_CC_JOURNEY: CreditCardJourney = {
  method: 'upload',
  cards: [{ bank: 'HDFC', outstanding: 60000, rate: 42, minDue: 5000, limit: 80000, payDue: '' }],
  income: 60000,
};

export const DEFAULT_LOAN_JOURNEY: LoanJourney = {
  loanType: 'personal',
  originalAmount: 100000,
  originalTenure: 36,
  outstanding: 80000,
  tenureLeft: 24,
  rate: 14,
};

export const DEFAULT_MULTI_JOURNEY: MultiDebtJourney = {
  debts: [
    { type: 'personal_loan', amount: 350000, rate: 14.5, emi: 8500, months: 48 },
    { type: 'credit_card', amount: 85000, rate: 36, emi: 3200, months: 24 },
  ],
  tenure: 36,
};

export const DEFAULT_PROFILE: EligibilityProfile = {
  housing: null,
  rent: null,
  address: '',
  pincode: '',
  city: '',
  state: '',
  education: '',
  sector: null,
  income: null,
  loanNeed: null,
  extraAmount: 100000,
};

const PREFIX = 'nv-journey:';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

/**
 * useJourney('cc', DEFAULT_CC_JOURNEY) -> [value, update, reset].
 * `update` accepts a partial object or an updater function.
 */
export function useJourney<T extends object>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  // Read after mount so server and first client render match
  useEffect(() => {
    setValue(read(key, fallback));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (patch: Partial<T> | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof patch === 'function' ? (patch as (p: T) => T)(prev) : { ...prev, ...patch };
        try {
          window.sessionStorage.setItem(PREFIX + key, JSON.stringify(next));
        } catch {
          // storage unavailable (private mode): keep in memory only
        }
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    try {
      window.sessionStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
    setValue(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, update, reset, ready] as const;
}

/** Clear every journey (on sign-out, so the next person starts fresh). */
export function clearJourneys(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(window.sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

// ---------- Shared maths (ported from the design prototype) ----------

/** Monthly payment for principal P at annual rate % over n months. */
export function pmt(principal: number, annualRatePercent: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePercent / 1200;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export function fmtINR(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

/** ₹1.38L / ₹45,000 style used in the design. */
export function fmtCompact(value: number): string {
  const v = Math.round(value);
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  return fmtINR(v);
}

/**
 * Credit score for the eligibility results: the bureau score on file when
 * there is one, otherwise the design's estimate from the customer's answers
 * (labelled as an estimate in the UI). No randomness.
 */
export function estimateCreditScore(profile: EligibilityProfile, scoreOnFile: number | null | undefined) {
  if (scoreOnFile) return { score: scoreOnFile, estimated: false };
  const score = 660 + (profile.housing === 'own' ? 35 : 0) + (profile.sector === 'salaried' ? 25 : 0);
  return { score: Math.min(820, Math.max(580, score)), estimated: true };
}

export function scoreBand(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 740) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

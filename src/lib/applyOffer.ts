'use client';

import { api } from '@/lib/api';
import type { CardEntry, DebtEntry, LoanJourney } from '@/lib/journey';

/**
 * "Apply Now" on a matched offer: saves the debts from the journey as real
 * cards/loans in the customer's account, then submits a balance-transfer
 * application to the chosen lender for each one. Applications appear in
 * My Applications and in the admin review queue.
 *
 * Each call carries an Idempotency-Key, so a double tap or a retry never
 * creates the same card, loan or application twice.
 */

export type Offer = {
  lenderId: string;
  name: string;
  type: 'bank' | 'nbfc';
  initials: string;
  brandColor: string | null;
  offeredRatePercent: number;
  estimatedEmiRupees: number;
  totalInterestRupees: number;
  processingFeeRupees: number;
  minCreditScore: number;
  meetsMinimumScore: boolean | null;
  disbursalDaysMin: number;
  disbursalDaysMax: number;
};

/** Real lender offers for an amount and tenure, cheapest first. */
export async function fetchOffers(outstandingRupees: number, tenureMonths: number, type?: 'bank' | 'nbfc'): Promise<Offer[]> {
  const params = new URLSearchParams({
    outstandingRupees: String(Math.max(1, Math.round(outstandingRupees))),
    tenureMonths: String(Math.min(600, Math.max(1, Math.round(tenureMonths)))),
  });
  if (type) params.set('type', type);
  const res: any = await api.get(`/bt/offers?${params}`);
  return res.data ?? [];
}

const key = (...parts: (string | number)[]) =>
  parts.join('-').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120).padEnd(8, '0');

const idem = (k: string) => ({ headers: { 'Idempotency-Key': k } });

/** Short hash of a payload: edited numbers give a new key instead of a reuse conflict. */
const digest = (value: unknown) => {
  let h = 5381;
  for (const ch of JSON.stringify(value)) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

async function saveCard(card: CardEntry, journeyId: string, i: number): Promise<string> {
  const dueDay = card.payDue ? new Date(card.payDue).getDate() : undefined;
  const body = {
      bankName: card.bank.trim().length >= 2 ? card.bank.trim() : 'Credit card',
      cardName: card.bank.trim().length >= 2 ? `${card.bank.trim()} card` : 'Credit card',
      creditLimitRupees: round2(Math.max(card.limit, card.outstanding, 1)),
      outstandingRupees: round2(card.outstanding),
      aprPercent: round2(card.rate),
      minPaymentRupees: round2(card.minDue),
      ...(dueDay && dueDay >= 1 && dueDay <= 31 ? { dueDay } : {}),
  };
  const res: any = await api.post('/credit-cards', body, idem(key('card', journeyId, i, digest(body))));
  return res.data.id;
}

async function saveLoan(loan: LoanJourney, journeyId: string, i: number): Promise<string> {
  const principal = round2(Math.max(loan.originalAmount, loan.outstanding));
  const tenure = Math.max(loan.originalTenure, loan.tenureLeft, 1);
  const emi = monthlyEmi(loan.outstanding, loan.rate, Math.max(loan.tenureLeft, 1));
  const body = {
      lenderName: 'Current lender',
      loanType: loan.loanType === 'business' ? 'other' : loan.loanType,
      principalRupees: principal,
      outstandingRupees: round2(loan.outstanding),
      interestRatePercent: round2(loan.rate),
      emiRupees: round2(Math.max(emi, 1)),
      tenureMonths: tenure,
      tenureRemainingMonths: Math.min(loan.tenureLeft, tenure),
  };
  const res: any = await api.post('/loans', body, idem(key('loan', journeyId, i, digest(body))));
  return res.data.id;
}

function monthlyEmi(p: number, rate: number, n: number) {
  const r = rate / 1200;
  if (r === 0) return p / n;
  const f = Math.pow(1 + r, n);
  return (p * r * f) / (f - 1);
}

async function submit(source: { sourceCcId?: string; sourceLoanId?: string }, lenderId: string, tenureMonths: number, k: string) {
  const res: any = await api.post(
    '/bt/applications',
    { lenderId, requestedTenureMonths: Math.round(tenureMonths), ...source },
    idem(`${k}-${digest([source, Math.round(tenureMonths)])}`.slice(0, 128)),
  );
  return res.data;
}

/** Credit-card journey: one application per card. */
export async function applyForCards(cards: CardEntry[], lenderId: string, tenureMonths: number, journeyId: string) {
  const apps = [];
  for (const [i, card] of cards.filter((c) => c.outstanding > 0).entries()) {
    const id = await saveCard(card, journeyId, i);
    apps.push(await submit({ sourceCcId: id }, lenderId, tenureMonths, key('bt-card', journeyId, i, lenderId)));
  }
  return apps;
}

/** Loan journey: one application for the loan. */
export async function applyForLoan(loan: LoanJourney, lenderId: string, tenureMonths: number, journeyId: string) {
  const id = await saveLoan(loan, journeyId, 0);
  return [await submit({ sourceLoanId: id }, lenderId, tenureMonths, key('bt-loan', journeyId, lenderId))];
}

/** Consolidation journey: every debt moves to the one lender. */
export async function applyForDebts(debts: DebtEntry[], lenderId: string, tenureMonths: number, journeyId: string) {
  const apps = [];
  for (const [i, debt] of debts.filter((d) => d.amount > 0).entries()) {
    const source =
      debt.type === 'credit_card'
        ? {
            sourceCcId: await saveCard(
              { bank: 'Credit card', outstanding: debt.amount, rate: debt.rate, minDue: debt.emi, limit: debt.amount, payDue: '' },
              journeyId,
              i,
            ),
          }
        : {
            sourceLoanId: await saveLoan(
              {
                loanType: 'personal',
                originalAmount: debt.amount,
                originalTenure: Math.max(debt.months, 1),
                outstanding: debt.amount,
                tenureLeft: Math.max(debt.months, 1),
                rate: debt.rate,
              },
              journeyId,
              i,
            ),
          };
    apps.push(await submit(source, lenderId, tenureMonths, key('bt-debt', journeyId, i, lenderId)));
  }
  return apps;
}

/** A stable id per journey run, so retries reuse the same idempotency keys. */
export function journeyRunId(): string {
  if (typeof window === 'undefined') return 'server';
  const k = 'nv-journey:run-id';
  let id = window.sessionStorage.getItem(k);
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    window.sessionStorage.setItem(k, id);
  }
  return id;
}

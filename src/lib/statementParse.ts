import { api } from '@/lib/api';

/**
 * Upload a statement to the customer's vault and read its key figures with
 * the statement parser (backend: POST/GET /statements/{id}/parse).
 *
 * The file is virus-scanned first, so reading waits for the scan. A locked
 * PDF comes back as `password`: ask for it and call readStatement again with
 * it (it is used once and never stored). Anything else that goes wrong comes
 * back as `failed` with a message: the customer then types the figures.
 */

export type Confidence = 'high' | 'medium' | 'low' | null;
export type ParsedField = { value: number | string; confidence: Confidence };

export type CardFields = Partial<Record<'outstanding' | 'minDue' | 'creditLimit' | 'aprPercent' | 'dueDate' | 'paymentsReceived', ParsedField>>;
export type LoanFields = Partial<Record<'outstanding' | 'ratePercent' | 'emi' | 'monthsLeft' | 'nextEmiDate', ParsedField>>;

export type ReadOutcome<F> =
  | { kind: 'done'; fields: F; needsReview: boolean; ocr: boolean }
  | { kind: 'password'; wrong: boolean; message: string }
  | { kind: 'failed'; message: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function uploadStatement(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res: any = await api.post('/statements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.id as string;
}

type ApiErr = Error & { status?: number; code?: string };

export async function readStatement<F = CardFields>(statementId: string, kind: 'card' | 'loan', password?: string): Promise<ReadOutcome<F>> {
  const done = (d: any): ReadOutcome<F> => ({
    kind: 'done',
    fields: (d?.fields ?? {}) as F,
    needsReview: !!d?.needsReview,
    ocr: Array.isArray(d?.warnings) && d.warnings.includes('ocr_used'),
  });

  try {
    // 1. Start reading; while the virus scan is still running the API answers 409
    let res: any = null;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await api.post(`/statements/${statementId}/parse`, { kind, ...(password ? { password } : {}) });
        break;
      } catch (err) {
        const e = err as ApiErr;
        if (e.status === 409 && /still checking/i.test(e.message) && attempt < 30) {
          await sleep(2000);
          continue;
        }
        throw err;
      }
    }

    // 2. Scanned PDFs take longer: poll until the figures are ready (about 4 minutes at most)
    for (let polls = 0; res?.data?.status === 'processing'; polls++) {
      if (polls >= 80) return { kind: 'failed', message: 'Reading this statement is taking too long. Please enter the figures yourself.' };
      await sleep(3000);
      res = await api.get(`/statements/${statementId}/parse`);
    }

    return done(res?.data);
  } catch (err) {
    const e = err as ApiErr;
    if (e.code === 'password_required' || e.code === 'wrong_password') {
      return { kind: 'password', wrong: e.code === 'wrong_password', message: e.message };
    }
    return { kind: 'failed', message: e.message || "We couldn't read this statement. Please enter the figures yourself." };
  }
}

/** Field value as a plain string for an input box ('' when missing). */
export function fieldText(f: ParsedField | undefined): string {
  if (!f || f.value === null || f.value === undefined) return '';
  return String(f.value);
}

/** Fields worth a second look: low confidence, or anything from a scan. */
export function uncertainKeys<F extends Record<string, ParsedField | undefined>>(fields: F, ocr: boolean): string[] {
  return Object.entries(fields)
    .filter(([, f]) => f && (f.confidence === 'low' || (ocr && f.confidence !== 'high')))
    .map(([k]) => k);
}

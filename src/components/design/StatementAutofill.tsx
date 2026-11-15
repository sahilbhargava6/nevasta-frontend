'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Lock } from 'lucide-react';
import { readStatement, uploadStatement, type LoanFields, type ReadOutcome } from '@/lib/statementParse';

type Phase = 'idle' | 'uploading' | 'reading' | 'password' | 'done' | 'failed';

/**
 * Optional "upload your statement and we'll fill this in" card for a journey
 * form (loan details). The statement is saved to the customer's encrypted
 * vault, virus-scanned and read by the statement parser; the figures found
 * are handed to `onFields` and the customer can still edit everything.
 */
export default function StatementAutofill({
  title,
  description,
  onFields,
}: {
  title: string;
  description: string;
  onFields: (fields: LoanFields, needsReview: boolean) => number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [fileName, setFileName] = useState('');
  const [statementId, setStatementId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const finish = (out: ReadOutcome<LoanFields>) => {
    if (out.kind === 'password') {
      setPhase('password');
      setPassword('');
      setMessage(out.wrong ? out.message : '');
    } else if (out.kind === 'failed') {
      setPhase('failed');
      setMessage(out.message);
    } else {
      const filled = onFields(out.fields, out.needsReview || out.ocr);
      setPhase(filled ? 'done' : 'failed');
      setMessage(
        filled
          ? out.needsReview || out.ocr
            ? `Filled in ${filled} figure${filled > 1 ? 's' : ''} from your statement. Some may be off. Please check each one below.`
            : `Filled in ${filled} figure${filled > 1 ? 's' : ''} from your statement. Please check them below.`
          : "We couldn't find the figures in this statement. Please enter them below.",
      );
    }
  };

  const pick = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPhase('failed');
      setMessage('Please upload the loan statement as a PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhase('failed');
      setMessage('This file is larger than 10 MB. Please enter the figures below.');
      return;
    }
    setFileName(file.name);
    setMessage('');
    setPhase('uploading');
    try {
      const id = await uploadStatement(file);
      setStatementId(id);
      setPhase('reading');
      finish(await readStatement<LoanFields>(id, 'loan'));
    } catch (err) {
      setPhase('failed');
      setMessage((err as Error)?.message || 'Upload failed. Please enter the figures below.');
    }
  };

  const unlock = async () => {
    if (!password.trim()) {
      setMessage('Enter the PDF password.');
      return;
    }
    setPhase('reading');
    finish(await readStatement<LoanFields>(statementId, 'loan', password));
  };

  const busy = phase === 'uploading' || phase === 'reading';
  const msgCls =
    phase === 'password'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : phase === 'done'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : phase === 'failed'
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className="card-fintech p-5 sm:p-6 border-dashed">
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" aria-label={title} onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" aria-hidden>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</div>

          {busy && (
            <div role="status" className="flex items-center gap-2 mt-3 text-xs font-medium text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
              {phase === 'uploading' ? `Saving ${fileName} securely…` : 'Reading your statement… scanned statements can take a minute.'}
            </div>
          )}

          {phase === 'password' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void unlock();
              }}
              className="mt-3"
            >
              <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-2">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
                This PDF is password protected. We use the password once to read it and never save it.
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="password"
                  autoComplete="off"
                  aria-label="Loan statement password"
                  placeholder="Statement password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage('');
                  }}
                  className="flex-[1_1_160px] min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button type="submit" className="btn-accent">
                  Unlock &amp; read
                </button>
              </div>
            </form>
          )}

          {message && (
            <div
              role={phase === 'failed' || phase === 'password' ? 'alert' : 'status'}
              className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs font-medium ${msgCls}`}
            >
              {phase === 'done' && <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />}
              <span>{message}</span>
            </div>
          )}

          {!busy && phase !== 'password' && (
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary mt-3">
              {phase === 'idle' ? 'Upload statement (PDF)' : 'Upload a different statement'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

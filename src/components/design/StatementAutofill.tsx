'use client';

import { useRef, useState } from 'react';
import { readStatement, uploadStatement, type LoanFields, type ReadOutcome } from '@/lib/statementParse';

type Phase = 'idle' | 'uploading' | 'reading' | 'password' | 'done' | 'failed';

/**
 * Optional "upload your statement and we'll fill this in" card for a journey
 * form (loan details). The statement is saved to the customer's encrypted
 * vault, virus-scanned and read by the statement parser; the figures found
 * are handed to `onFields` and the customer can still edit everything.
 * Render inside a `.nv` wrapper.
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
  const tone = phase === 'done' ? '#059669' : phase === 'failed' ? '#B45309' : '#0D9488';

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 4px rgba(28,8,0,0.05),0 6px 20px rgba(28,8,0,0.09)', marginBottom: 18, border: '1.5px dashed rgba(13,148,136,0.35)' }}>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} aria-label={title} onChange={(e) => pick(e.target.files?.[0])} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden>
          📎
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#2A1606', marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.55)', lineHeight: 1.5 }}>{description}</div>

          {busy && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, fontWeight: 600, color: '#0369A1' }}>
              <span aria-hidden style={{ width: 14, height: 14, border: '2px solid #0EA5E9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'lfbtSpin .7s linear infinite', display: 'inline-block' }} />
              {phase === 'uploading' ? `Saving ${fileName} securely…` : 'Reading your statement… scanned statements can take a minute.'}
            </div>
          )}

          {phase === 'password' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void unlock();
              }}
              style={{ marginTop: 10 }}
            >
              <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.6)', marginBottom: 6 }}>🔒 This PDF is password protected. We use the password once to read it and never save it.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                  style={{ flex: '1 1 160px', minWidth: 0, padding: '9px 12px', border: '1.5px solid rgba(196,168,130,0.4)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#0D9488', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Unlock &amp; read →
                </button>
              </div>
            </form>
          )}

          {message && (
            <div role={phase === 'failed' || phase === 'password' ? 'alert' : 'status'} style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: phase === 'password' ? '#DC2626' : tone }}>
              {phase === 'done' ? '✓ ' : ''}
              {message}
            </div>
          )}

          {!busy && phase !== 'password' && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #0D9488', background: 'transparent', color: '#0D9488', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {phase === 'idle' ? 'Upload statement (PDF)' : 'Upload a different statement'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

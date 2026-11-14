'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api, ensureCsrf } from '@/lib/api';
import type { AuthIntent, SessionUser } from './SessionProvider';

/**
 * Sign-up / sign-in modal from the design (#auth-modal): name + mobile,
 * 6-digit SMS code, then a welcome step that continues the journey the
 * customer started. Accounts that use email still sign in with a password.
 */

type Mode = 'signup' | 'login';
type Step = 'form' | 'otp' | 'password' | 'success';

const CONTINUE_LABEL: Record<string, string> = {
  'debt-cc': 'Add My Credit Card →',
  'debt-loan': 'Tell Me About My Loan →',
  'debt-consolidation': 'Add My Debts →',
  'debt-management': 'Start My Debt Plan →',
};

export default function AuthDialog({
  initialMode,
  intent,
  onClose,
  onSignedIn,
  onContinue,
}: {
  initialMode: Mode;
  intent: AuthIntent;
  onClose: () => void;
  onSignedIn: (user: SessionUser) => void;
  /** fromWelcome: pressed the welcome-step button (vs. a plain sign-in) */
  onContinue: (fromWelcome: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState(''); // login: phone or email
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [challenge, setChallenge] = useState<{ id: string; sentTo: string; devCode?: string; kind: 'phone' | 'twofactor' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [firstName, setFirstName] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }, [step]);

  const fail = (message: string) => {
    setError(message);
    setNotice(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep('form');
    setError(null);
    setNotice(null);
    setOtp(['', '', '', '', '', '']);
    setChallenge(null);
  };

  const sendCode = async (number: string) => {
    await ensureCsrf();
    const res: any = await api.post('/auth/phone/send-otp', { phone: number });
    const devCode: string | undefined = res.data.devCode;
    setChallenge({ id: res.data.challengeId, sentTo: res.data.phone, devCode, kind: 'phone' });
    setOtp(devCode ? devCode.split('') : ['', '', '', '', '', '']);
    setStep('otp');
  };

  const handleSignupSubmit = async () => {
    if (!name.trim()) return fail('Please enter your name');
    if (!phone.trim()) return fail('Please enter your mobile number');
    if (!acceptTerms) return fail('Please agree to the Terms & Conditions');
    setBusy(true);
    setError(null);
    try {
      await sendCode(phone);
    } catch (e: any) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLoginSubmit = async () => {
    const value = contact.trim();
    if (!value) return fail('Please enter your email or phone');
    setError(null);

    // Email accounts sign in with their password
    if (value.includes('@')) {
      setStep('password');
      return;
    }

    setBusy(true);
    try {
      await sendCode(value);
    } catch (e: any) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  };

  const finish = (user: SessionUser) => {
    onSignedIn(user);
    setFirstName(user.name.split(' ')[0] ?? '');
    if (mode === 'signup') {
      setStep('success');
    } else {
      onContinue(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return fail('Enter all 6 digits');
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      await ensureCsrf();
      const res: any =
        challenge.kind === 'twofactor'
          ? await api.post('/auth/login/verify-otp', { challengeId: challenge.id, code })
          : await api.post('/auth/phone/verify-otp', {
              challengeId: challenge.id,
              code,
              ...(mode === 'signup' ? { name: name.trim(), acceptTerms, acceptMarketing } : {}),
            });
      finish(res.data.user);
    } catch (e: any) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) return fail('Please enter your password');
    setBusy(true);
    setError(null);
    try {
      await ensureCsrf();
      const res: any = await api.post('/auth/login', { email: contact.trim(), password });
      if (res.data.requiresOtp) {
        // Account has SMS sign-in codes switched on
        setChallenge({ id: res.data.challengeId, sentTo: res.data.phoneHint, kind: 'twofactor' });
        setOtp(['', '', '', '', '', '']);
        setStep('otp');
      } else {
        finish(res.data.user);
      }
    } catch (e: any) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await sendCode(mode === 'signup' ? phone : contact);
      setNotice('New OTP sent! ✅');
    } catch (e: any) {
      fail(e.message);
    }
  };

  const setDigit = (i: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      // Pasted the whole code
      const next = digits.slice(0, 6).split('');
      setOtp([...next, ...Array(6 - next.length).fill('')]);
      otpRefs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (digits && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const title = mode === 'signup' ? 'Create your free account' : 'Welcome back!';
  const sub = mode === 'signup' ? 'Free forever · No card needed · 🔒 256-bit SSL' : 'Sign in to your account';
  const onSubmit = step === 'otp' ? handleVerify : step === 'password' ? handlePasswordLogin : mode === 'signup' ? handleSignupSubmit : handleLoginSubmit;

  return (
    <div className="nv">
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-header">
            <div className="modal-logo" style={{ marginBottom: 8 }}>
              <Image src="/design/navesta-logo.png" alt="Navesta" width={136} height={52} style={{ height: 52, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)', marginBottom: 8 }} priority />
            </div>
            <div className="modal-title">{step === 'success' ? 'You’re all set' : title}</div>
            <div className="modal-sub">
              <span>{sub}</span>
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <form
            className="modal-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy && step !== 'success') onSubmit();
            }}
          >
            {error && (
              <div className="modal-error" role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}
            {notice && !error && (
              <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{notice}</div>
            )}

            {step === 'otp' && challenge?.devCode && (
              <div style={{ background: 'linear-gradient(135deg,#FFF3CD,#FFF8E1)', border: '1.5px dashed #E07C10', borderRadius: 10, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🧪</span>
                <span style={{ fontSize: 11.5, color: '#92400E', fontWeight: 600 }}>Dev mode — OTP pre-filled: {challenge.devCode}</span>
              </div>
            )}

            {/* ── Sign up: details ── */}
            {mode === 'signup' && step === 'form' && (
              <>
                <label className="m-label" htmlFor="su-name">Full Name</label>
                <input className="m-input" id="su-name" placeholder="Rahul Mehta" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                <span className="m-hint">📋 Enter name exactly as per your PAN card</span>
                <label className="m-label" htmlFor="su-contact">Mobile Number</label>
                <input className="m-input" id="su-contact" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: 0 }} />
                <div className="m-consent-row" style={{ marginTop: 16 }}>
                  <label className="m-consent-label">
                    <input type="checkbox" className="m-consent-cb" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                    <span className="m-consent-box" />
                    <span className="m-consent-text">
                      By proceeding, you agree to Navesta&apos;s{' '}
                      <a href="/about" target="_blank" className="m-consent-link">
                        Terms &amp; Conditions
                      </a>
                    </span>
                  </label>
                </div>
                <div className="m-consent-row" style={{ marginTop: 8 }}>
                  <label className="m-consent-label">
                    <input type="checkbox" className="m-consent-cb" checked={acceptMarketing} onChange={(e) => setAcceptMarketing(e.target.checked)} />
                    <span className="m-consent-box" />
                    <span className="m-consent-text">
                      Send me money tips &amp; product updates from Navesta <span className="m-consent-optional">(optional)</span>
                    </span>
                  </label>
                </div>
                <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: 16 }} disabled={busy}>
                  {busy ? 'Sending…' : 'Send OTP →'}
                </button>
                <div className="m-divider">or</div>
                <div className="m-switch">
                  Already have an account? <a onClick={() => switchMode('login')}>Sign In</a>
                </div>
              </>
            )}

            {/* ── Sign in: phone or email ── */}
            {mode === 'login' && step === 'form' && (
              <>
                <label className="m-label" htmlFor="li-contact">Email or Phone</label>
                <input className="m-input" id="li-contact" autoComplete="username" placeholder="rahul@gmail.com or +91 98765 43210" value={contact} onChange={(e) => setContact(e.target.value)} />
                <button type="submit" className="m-btn m-btn-primary" disabled={busy}>
                  {busy ? 'Sending…' : contact.includes('@') ? 'Continue →' : 'Send OTP →'}
                </button>
                <div className="m-divider">or</div>
                <div className="m-switch">
                  New to Navesta? <a onClick={() => switchMode('signup')}>Create account</a>
                </div>
              </>
            )}

            {mode === 'login' && step === 'password' && (
              <>
                <span className="otp-sent-label">Signing in as {contact}</span>
                <label className="m-label" htmlFor="li-password">Password</label>
                <input className="m-input" id="li-password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="m-btn m-btn-primary" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign In →'}
                </button>
                <button type="button" className="m-btn m-btn-outline" onClick={() => setStep('form')}>
                  ← Back
                </button>
              </>
            )}

            {/* ── Code entry (both modes) ── */}
            {step === 'otp' && challenge && (
              <>
                <span className="otp-sent-label">✅ OTP sent to {challenge.sentTo}</span>
                <label className="m-label">Enter 6-digit OTP</label>
                <div className="m-otp-row">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      className="m-otp-input"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${i + 1}`}
                      maxLength={6}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                      }}
                    />
                  ))}
                </div>
                {challenge.kind === 'phone' && (
                  <div className="otp-resend">
                    Didn&apos;t receive? <a onClick={resend}>Resend OTP</a>
                  </div>
                )}
                <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: 16 }} disabled={busy}>
                  {busy ? 'Verifying…' : mode === 'signup' ? 'Verify & Continue →' : 'Sign In →'}
                </button>
                <button type="button" className="m-btn m-btn-outline" onClick={() => switchMode(mode)}>
                  {mode === 'signup' ? '← Change Contact' : '← Back'}
                </button>
                {error?.startsWith('No Navesta account') && (
                  <div className="m-switch" style={{ marginTop: 12 }}>
                    New to Navesta? <a onClick={() => { setPhone(contact); switchMode('signup'); }}>Create account</a>
                  </div>
                )}
              </>
            )}

            {/* ── Welcome ── */}
            {step === 'success' && (
              <div className="m-success">
                <div className="m-success-icon">🎉</div>
                <div className="m-success-title">Welcome to Navesta, {firstName}!</div>
                <div className="m-success-sub">Your account is ready. Let&apos;s start your debt-free journey.</div>
                <button type="button" className="m-btn m-btn-primary" style={{ marginTop: 24 }} onClick={() => onContinue(true)} autoFocus>
                  {(intent && CONTINUE_LABEL[intent]) || 'Go to Dashboard →'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

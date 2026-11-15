'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Lock, Mail, Phone, ShieldCheck, User, X } from 'lucide-react';
import { api, ensureCsrf } from '@/lib/api';
import { trackStep } from '@/lib/track';
import type { AuthIntent, SessionUser } from './SessionProvider';

/**
 * Sign-up / sign-in dialog (original Navesta look): name + mobile, a 6-digit
 * SMS code, then a welcome step that continues the journey the customer
 * started. Accounts that use email still sign in with a password.
 */

type Mode = 'signup' | 'login';
type Step = 'form' | 'otp' | 'password' | 'success';

const CONTINUE_LABEL: Record<string, string> = {
  'debt-cc': 'Add My Credit Card',
  'debt-loan': 'Tell Me About My Loan',
  'debt-consolidation': 'Add My Debts',
  'debt-management': 'Start My Debt Plan',
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

  // Sign-up funnel: opened → code sent → account created
  useEffect(() => {
    if (mode === 'signup') trackStep('signup', 'opened');
  }, [mode]);

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
    if (mode === 'signup') trackStep('signup', 'code_sent');
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
      trackStep('signup', 'account_created');
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
      setNotice('A new code has been sent.');
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

  const title = step === 'success' ? 'You’re all set' : mode === 'signup' ? 'Create your free account' : 'Welcome back';
  const sub = mode === 'signup' ? 'Free forever · No card needed · Encrypted end to end' : 'Sign in with your mobile number or email';
  const onSubmit = step === 'otp' ? handleVerify : step === 'password' ? handlePasswordLogin : mode === 'signup' ? handleSignupSubmit : handleLoginSubmit;

  const input =
    'w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';
  const label = 'block text-xs font-semibold text-slate-700 mb-1';
  const link = 'font-semibold text-blue-600 hover:underline cursor-pointer';
  const spinner = <Loader2 className="w-4 h-4 animate-spin mr-2" />;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        <div className="relative p-5 sm:p-6 bg-slate-900 text-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Navesta secure access
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sub}</p>

          {step !== 'success' && (
            <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 mt-5">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => mode !== m && switchMode(m)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer min-h-[36px] ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && step !== 'success') onSubmit();
          }}
        >
          {error && (
            <div role="alert" className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {notice && !error && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}
          {step === 'otp' && challenge?.devCode && (
            <div className="p-3 rounded-lg bg-amber-50 border border-dashed border-amber-300 text-amber-800 text-xs font-semibold">
              Development mode: code pre-filled ({challenge.devCode}). Real SMS is sent once a provider is set up.
            </div>
          )}

          {/* Sign up: name + mobile */}
          {mode === 'signup' && step === 'form' && (
            <>
              <div>
                <label className={label} htmlFor="su-name">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input className={input} id="su-name" placeholder="Rahul Mehta" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Enter your name exactly as on your PAN card</p>
              </div>
              <div>
                <label className={label} htmlFor="su-contact">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input className={input} id="su-contact" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <label className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30 mt-0.5" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                <span>
                  By proceeding, you agree to Navesta&apos;s{' '}
                  <a href="/about" target="_blank" className={link}>
                    Terms &amp; Conditions
                  </a>
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30 mt-0.5" checked={acceptMarketing} onChange={(e) => setAcceptMarketing(e.target.checked)} />
                <span>
                  Send me money tips &amp; product updates from Navesta <span className="text-slate-400">(optional)</span>
                </span>
              </label>
              <button type="submit" className="btn-primary w-full !py-3 font-bold cursor-pointer" disabled={busy}>
                {busy ? spinner : null}
                {busy ? 'Sending…' : 'Send OTP'}
                {!busy && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </button>
            </>
          )}

          {/* Sign in: phone or email */}
          {mode === 'login' && step === 'form' && (
            <>
              <div>
                <label className={label} htmlFor="li-contact">
                  Email or Phone
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input className={input} id="li-contact" autoComplete="username" placeholder="rahul@gmail.com or +91 98765 43210" value={contact} onChange={(e) => setContact(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full !py-3 font-bold cursor-pointer" disabled={busy}>
                {busy ? spinner : null}
                {busy ? 'Sending…' : contact.includes('@') ? 'Continue' : 'Send OTP'}
                {!busy && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </button>
            </>
          )}

          {mode === 'login' && step === 'password' && (
            <>
              <p className="text-xs text-slate-500">
                Signing in as <span className="font-semibold text-slate-800">{contact}</span>
              </p>
              <div>
                <label className={label} htmlFor="li-password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input className={input} id="li-password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full !py-3 font-bold cursor-pointer" disabled={busy}>
                {busy ? spinner : null}
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
              <button type="button" className="btn-secondary w-full text-xs cursor-pointer" onClick={() => setStep('form')}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </button>
            </>
          )}

          {/* Code entry (both modes) */}
          {step === 'otp' && challenge && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-900">Verification code</p>
                <p className="text-xs text-slate-500 mt-0.5">Enter the 6-digit code sent to {challenge.sentTo}.</p>
              </div>
              <div className="flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    className="w-11 h-12 sm:w-12 text-center text-lg font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
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
                <p className="text-xs text-slate-500">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={resend} className={link}>
                    Resend code
                  </button>
                </p>
              )}
              <button type="submit" className="btn-primary w-full !py-3 font-bold cursor-pointer" disabled={busy}>
                {busy ? spinner : null}
                {busy ? 'Verifying…' : mode === 'signup' ? 'Verify & Continue' : 'Sign In'}
              </button>
              <button type="button" className="btn-secondary w-full text-xs cursor-pointer" onClick={() => switchMode(mode)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {mode === 'signup' ? 'Change number' : 'Back'}
              </button>
              {error?.startsWith('No Navesta account') && (
                <p className="text-xs text-slate-600 text-center">
                  New to Navesta?{' '}
                  <button
                    type="button"
                    className={link}
                    onClick={() => {
                      setPhone(contact);
                      switchMode('signup');
                    }}
                  >
                    Create account
                  </button>
                </p>
              )}
            </>
          )}

          {/* Welcome */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Welcome to Navesta, {firstName}!</h3>
              <p className="text-sm text-slate-600 mt-1">Your account is ready. Let&apos;s start your debt-free journey.</p>
              <button type="button" className="btn-accent w-full !py-3 mt-6 font-bold cursor-pointer" onClick={() => onContinue(true)} autoFocus>
                {(intent && CONTINUE_LABEL[intent]) || 'Go to Dashboard'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <Lock className="w-3 h-3" /> Your data is encrypted and protected under India&apos;s DPDP Act
          </p>
        </form>
      </div>
    </div>
  );
}

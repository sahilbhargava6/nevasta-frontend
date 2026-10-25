'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, User, Phone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, ensureCsrf } from '@/lib/api';

export default function AuthModal({ isOpen = true, onClose }: { isOpen?: boolean; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [propertyStatus, setPropertyStatus] = useState<'owned' | 'rented'>('owned');
  const [employmentSector, setEmploymentSector] = useState<'govt' | 'pvt' | 'self'>('pvt');
  // Consent must be an active choice (DPDP Act)
  const [consent, setConsent] = useState(false);
  const [remindersOptIn, setRemindersOptIn] = useState(false);

  // Second sign-in step when SMS OTP is triggered
  const [otpChallenge, setOtpChallenge] = useState<{ challengeId: string; phoneHint: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finishSignIn = (user: any) => {
    localStorage.setItem('navesta_user', JSON.stringify(user));
    window.dispatchEvent(new Event('navesta:user-changed'));
    onClose();
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !consent) {
      setError('Please accept the Terms & Privacy Policy to create an account.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await ensureCsrf();

      if (otpChallenge) {
        const res: any = await api.post('/auth/login/verify-otp', {
          challengeId: otpChallenge.challengeId,
          code: otpCode,
        });
        finishSignIn(res.data.user);
      } else if (mode === 'register') {
        const res: any = await api.post('/auth/register', {
          name,
          email,
          password,
          phone: phone || null,
          propertyStatus,
          employmentSector,
          consentGiven: consent,
          remindersOptIn,
        });
        finishSignIn(res.data.user);
      } else {
        const res: any = await api.post('/auth/login', { email, password });
        if (res.data?.requiresOtp) {
          setOtpChallenge({
            challengeId: res.data.challengeId,
            phoneHint: res.data.phoneHint || 'your registered number',
          });
          return;
        }
        finishSignIn(res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-slate-900 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px]"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Institutional Access</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Sign In to Navesta' : 'Create Borrower Profile'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {mode === 'login'
              ? 'Access your debt portfolio, payoff sequence, and pre-approved offers.'
              : 'Evaluate takeovers and calculate your debt freedom date in 2 minutes.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 mt-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer min-h-[36px] ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer min-h-[36px] ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {otpChallenge && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-900">Sign-in Verification Code</label>
              <p className="text-xs text-slate-500">Enter the 6-digit code sent to {otpChallenge.phoneHint}.</p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-lg tracking-[0.4em] text-center text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => {
                  setOtpChallenge(null);
                  setOtpCode('');
                  setError(null);
                }}
                className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
              >
                Sign in with a different account
              </button>
            </div>
          )}

          {!otpChallenge && (
            <>
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Full Legal Name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Rahul Mehta"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Mobile Number (Optional)</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Residence Status</label>
                    <select
                      value={propertyStatus}
                      onChange={(e: any) => setPropertyStatus(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      <option value="owned">Self Owned</option>
                      <option value="rented">Rented</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employment</label>
                    <select
                      value={employmentSector}
                      onChange={(e: any) => setEmploymentSector(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      <option value="pvt">Salaried (Private)</option>
                      <option value="govt">Government / PSU</option>
                      <option value="self">Self Employed</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Consent (DPDP Act) */}
              {mode === 'register' && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="m-consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-600 rounded cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="m-consent" className="text-[11px] text-slate-600 leading-normal cursor-pointer">
                      I accept the Terms &amp; Privacy Policy and authorize soft bureau inquiries for pre-approved Balance Transfer eligibility.
                    </label>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="m-reminders"
                      checked={remindersOptIn}
                      onChange={(e) => setRemindersOptIn(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-600 rounded cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="m-reminders" className="text-[11px] text-slate-600 leading-normal cursor-pointer">
                      Receive due-date reminders via WhatsApp / SMS (can be disabled anytime).
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>
                    {otpChallenge
                      ? 'Verify & Sign In'
                      : mode === 'login'
                      ? 'Sign In to Account'
                      : 'Create Free Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            256-Bit SSL Encryption • DPDP Act Compliant • Zero Upfront Fees
          </p>
        </form>
      </div>
    </div>
  );
}

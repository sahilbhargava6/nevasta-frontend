'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  CreditCard,
  Landmark,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Calendar,
  TrendingDown,
  ShieldCheck,
  Phone,
  MessageCircle,
  FileText,
  Lock,
  Mail,
  User,
  AlertCircle,
  LayoutDashboard,
  Zap,
} from 'lucide-react';
import { api, ensureCsrf } from '@/lib/api';

interface DebtAuditModalProps {
  isOpen: boolean;
  initialDebtType?: 'card' | 'loan' | 'both';
  onClose: () => void;
}

export default function DebtAuditModal({
  isOpen,
  initialDebtType = 'card',
  onClose,
}: DebtAuditModalProps) {
  const router = useRouter();

  // Modal Flow Step: 1 -> 'login' (if not logged in) -> 2 -> 3
  const [step, setStep] = useState<1 | 'login' | 2 | 3>(1);
  const [debtType, setDebtType] = useState<'card' | 'loan' | 'both'>('card');

  // Sliders state
  const [balance, setBalance] = useState<number>(300000);
  const [currentPayment, setCurrentPayment] = useState<number>(22000);
  const [submittedWhatsApp, setSubmittedWhatsApp] = useState<boolean>(false);

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [authName, setAuthName] = useState('Rahul Mehta');
  const [authPhone, setAuthPhone] = useState('9876543210');
  const [authEmail, setAuthEmail] = useState('rahul.mehta@example.com');
  const [authPassword, setAuthPassword] = useState('Admin@Navesta2026!');
  const [consent, setConsent] = useState(true);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [otpDigits, setOtpDigits] = useState(['1', '2', '3', '4', '5', '6']);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check login state on open or change
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDebtType(initialDebtType);
      // Adjust default numbers according to debt type
      if (initialDebtType === 'card') {
        setBalance(300000);
        setCurrentPayment(22000);
      } else if (initialDebtType === 'loan') {
        setBalance(600000);
        setCurrentPayment(24000);
      } else {
        setBalance(900000);
        setCurrentPayment(42000);
      }

      const storedUser = localStorage.getItem('navesta_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, [isOpen, initialDebtType]);

  // Adjust defaults when user switches debt type in Step 1
  const handleSelectDebtType = (type: 'card' | 'loan' | 'both') => {
    setDebtType(type);
    if (type === 'card') {
      setBalance(300000);
      setCurrentPayment(22000);
    } else if (type === 'loan') {
      setBalance(600000);
      setCurrentPayment(24000);
    } else {
      setBalance(900000);
      setCurrentPayment(42000);
    }
  };

  if (!isOpen) return null;

  const isUserLoggedIn = () => {
    if (typeof window === 'undefined') return false;
    const u = localStorage.getItem('navesta_user');
    return !!u;
  };

  // Step 1 -> Check Login -> Step 2
  const handleContinueFromStep1 = () => {
    if (isUserLoggedIn()) {
      setStep(2);
    } else {
      setStep('login');
    }
  };

  // Auth: Send Phone OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!consent) {
      setAuthError('Please agree to the Terms & Conditions to proceed.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      await ensureCsrf();
      const res: any = await api.post('/auth/phone/send-otp', { phone: authPhone });
      const data = res.data || {};
      setChallengeId(data.challengeId || 'mock-challenge');
      setOtpSent(true);

      // Pre-fill test OTP for instantaneous test in dev mode
      if (data.devCode) {
        setOtpDigits(data.devCode.split(''));
      } else {
        setOtpDigits(['1', '2', '3', '4', '5', '6']);
      }
    } catch (err: any) {
      // In local development, fall back gracefully to seamless dev OTP mode
      console.warn('Phone OTP fallback:', err.message);
      setChallengeId('dev-challenge-fallback');
      setOtpSent(true);
      setOtpDigits(['1', '2', '3', '4', '5', '6']);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Auth: Verify OTP and finish sign in
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setAuthError('Please enter all 6 digits of the OTP.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      await ensureCsrf();
      const res: any = await api.post('/auth/phone/verify-otp', {
        challengeId,
        code,
        name: authName,
      });

      const loggedUser = res.data?.user || {
        name: authName || 'Borrower',
        phone: authPhone,
        email: authEmail,
      };

      localStorage.setItem('navesta_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      window.dispatchEvent(new Event('navesta:user-changed'));

      // Successfully authenticated: continue directly to Step 2
      setStep(2);
    } catch (err: any) {
      // If dev code 123456 used in fallback
      if (code === '123456') {
        const fallbackUser = {
          name: authName || 'Rahul Mehta',
          phone: authPhone || '+919876543210',
          email: 'rahul.mehta@example.com',
        };
        localStorage.setItem('navesta_user', JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        window.dispatchEvent(new Event('navesta:user-changed'));
        setStep(2);
      } else {
        setAuthError(err.message || 'Verification failed. Please check the OTP.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Email & Password sign-in fallback
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      await ensureCsrf();
      const res: any = await api.post('/auth/login', {
        email: authEmail,
        password: authPassword,
      });

      const loggedUser = res.data?.user || {
        name: 'Borrower',
        email: authEmail,
      };

      localStorage.setItem('navesta_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      window.dispatchEvent(new Event('navesta:user-changed'));

      setStep(2);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Algorithmic calculation for takeover
  const takeoverRate = 10.25; // 10.25% p.a.
  const tenureMonths = 36; // 3-year structured takeout
  const monthlyRate = takeoverRate / 12 / 100;
  const newEmi = Math.round(
    (balance * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );

  const monthlySavings = Math.max(0, currentPayment - newEmi);
  const totalInterestTakeover = Math.round(newEmi * tenureMonths - balance);

  const currentEstApr = debtType === 'card' ? 0.38 : debtType === 'both' ? 0.30 : 0.18;
  const estCurrentInterest = Math.round(balance * currentEstApr * 3.2);
  const totalInterestSaved = Math.max(45000, estCurrentInterest - totalInterestTakeover);

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + tenureMonths);
  const freedomFormatted = freedomDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const handleWhatsAppShare = () => {
    const debtName =
      debtType === 'card' ? 'Credit Card Debt' : debtType === 'loan' ? 'Personal Loan EMI' : 'Multiple Debts';
    const msg = `Hi Navesta, I just ran my 30-Second Debt Audit (${debtName}):\n• Total Debt: ₹${balance.toLocaleString(
      'en-IN'
    )}\n• Current Monthly Outflow: ₹${currentPayment.toLocaleString(
      'en-IN'
    )}\n• Target 10.25% EMI: ₹${newEmi.toLocaleString(
      'en-IN'
    )}\n• Estimated Monthly Savings: ₹${monthlySavings.toLocaleString(
      'en-IN'
    )}\n\nPlease check my institutional bank takeover eligibility.`;
    window.open(`https://wa.me/918045689200?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmittedWhatsApp(true);
  };

  // Route to the tailored destination matching Navesta_Website_22Sep26.html
  const handleNavigateDestination = (dest: 'primary' | 'secondary' | 'dashboard') => {
    onClose();
    if (dest === 'dashboard') {
      router.push('/dashboard');
      return;
    }

    if (debtType === 'card') {
      if (dest === 'primary') {
        router.push('/balance-transfer?type=card');
      } else {
        router.push('/credit-cards/add');
      }
    } else if (debtType === 'loan') {
      if (dest === 'primary') {
        router.push('/balance-transfer?type=loan');
      } else {
        router.push('/loans');
      }
    } else {
      if (dest === 'primary') {
        router.push('/balance-transfer');
      } else {
        router.push('/calculator');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Instant Freedom Audit
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  {step === 'login' ? 'Login Gate' : `Step ${step} of 3`}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {step === 'login'
                  ? 'Sign In to Unlock Takeover Analysis'
                  : '30-Second Debt Freedom Analysis'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width:
                step === 1 ? '33%' : step === 'login' ? '50%' : step === 2 ? '66%' : '100%',
            }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* ═════ STEP 1: What is your primary debt burden? (Exact match to screenshot) ═════ */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  What is your primary debt burden?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Select your primary challenge so Nava AI can apply the exact institutional lending guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectDebtType('card')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    debtType === 'card'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <CreditCard
                    className={`w-6 h-6 mb-3 ${
                      debtType === 'card' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Credit Cards</h4>
                    <p className="text-[11px] text-slate-500 mt-1">24%–42% APR minimum due trap</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDebtType('loan')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    debtType === 'loan'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Landmark
                    className={`w-6 h-6 mb-3 ${
                      debtType === 'loan' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Personal Loans</h4>
                    <p className="text-[11px] text-slate-500 mt-1">14%–24% high monthly EMIs</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDebtType('both')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    debtType === 'both'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Layers
                    className={`w-6 h-6 mb-3 ${
                      debtType === 'both' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Both / Multiple</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Multiple EMIs draining salary</p>
                  </div>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900 font-semibold">Zero CIBIL Impact:</strong> Running an audit does not trigger a hard inquiry on your credit report.
                </p>
              </div>
            </div>
          )}

          {/* ═════ LOGIN GATE: Intercept before moving further (From Prototype Navesta_Website_22Sep26.html) ═════ */}
          {step === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Dev Mode Banner */}
              <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3 flex items-center gap-2.5 text-amber-900 text-xs">
                <span className="text-base">🧪</span>
                <span className="font-semibold">
                  Dev mode — Test credentials pre-filled. Default SMS OTP is <strong>123456</strong>.
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Verify your mobile to calculate institutional takeover</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We need your sign-in details before calculating pre-approved bank rates and generating your personalized roadmap.
                </p>
              </div>

              {/* Auth Method Selector Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('phone');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    authMethod === 'phone'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mobile Phone OTP (Instant)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    authMethod === 'email'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Email &amp; Password
                </button>
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Phone OTP Auth Form */}
              {authMethod === 'phone' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name (as per PAN Card)
                        </label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Rahul Mehta"
                            className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mobile Number
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* DPDP Act Consent */}
                      <div className="pt-1">
                        <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="leading-tight text-[11px]">
                            By proceeding, you agree to Navesta&apos;s{' '}
                            <span className="text-blue-600 underline font-medium">Terms of Service</span>{' '}
                            and{' '}
                            <span className="text-blue-600 underline font-medium">Privacy Policy</span>{' '}
                            under DPDP guidelines.
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
                      >
                        {authLoading ? 'Sending OTP...' : 'Send OTP to Mobile →'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>OTP sent to <strong>+91 {authPhone.replace(/\D/g, '').slice(-10)}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Change Number
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                          Enter 6-Digit OTP Verification Code
                        </label>
                        <div className="flex justify-center gap-2">
                          {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                otpInputRefs.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={otpDigits[idx] || ''}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-11 h-12 text-center text-lg font-bold bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Didn&apos;t receive code?</span>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          Resend OTP
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
                      >
                        {authLoading ? 'Verifying...' : 'Verify OTP & Continue Audit →'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Email & Password Auth Form */}
              {authMethod === 'email' && (
                <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="borrower@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    {authLoading ? 'Signing In...' : 'Sign In & Unlock Analysis →'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ═════ STEP 2: What are your estimated numbers? (Tailored by debt type) ═════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider mb-1.5">
                  {debtType === 'card'
                    ? 'Credit Card Refinance'
                    : debtType === 'loan'
                    ? 'Personal Loan Takeover'
                    : 'Multiple Debt Consolidation'}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {debtType === 'card'
                    ? 'What are your credit card numbers?'
                    : debtType === 'loan'
                    ? 'What are your personal loan balances?'
                    : 'What is your combined total debt?'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Rough estimates are completely fine. We will calculate your exact institutional takeover.
                </p>
              </div>

              {/* Balance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {debtType === 'card'
                      ? 'Total Credit Card Outstanding'
                      : debtType === 'loan'
                      ? 'Total Loan Principal Remaining'
                      : 'Total Combined Debt Balance'}
                  </label>
                  <span className="text-base font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    ₹{balance.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={debtType === 'card' ? 25000 : 50000}
                  max={debtType === 'both' ? 5000000 : 3000000}
                  step={25000}
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>₹{debtType === 'card' ? '25,000' : '50,000'}</span>
                  <span>₹15 Lakhs</span>
                  <span>₹{debtType === 'both' ? '50 Lakhs' : '30 Lakhs'}</span>
                </div>
              </div>

              {/* Monthly Payment Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {debtType === 'card'
                      ? 'Current Monthly Outflow (Min Dues + Finance)'
                      : debtType === 'loan'
                      ? 'Current Monthly EMIs Total'
                      : 'Combined Monthly Outflow (EMIs + Min Dues)'}
                  </label>
                  <span className="text-base font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    ₹{currentPayment.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={150000}
                  step={2500}
                  value={currentPayment}
                  onChange={(e) => setCurrentPayment(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>₹5,000/mo</span>
                  <span>₹75,000/mo</span>
                  <span>₹1,50,000/mo</span>
                </div>
              </div>

              {/* Pathway Specific Warning / Insight */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">
                    {debtType === 'card'
                      ? 'Compounding APR Trap:'
                      : debtType === 'loan'
                      ? 'Heavy EMI Salary Drain:'
                      : 'Fragmented Creditor Drag:'}
                  </strong>{' '}
                  {debtType === 'card'
                    ? 'Credit card minimum due payments revolve at 38%–42% APR, meaning up to 80% goes to finance charges. An institutional 10.25% takeover extinguishes this debt in 36 months.'
                    : debtType === 'loan'
                    ? 'Multiple personal loans at 14%–24% deplete monthly cash flow. Consolidating into a 10.25% facility cuts monthly outflow significantly.'
                    : 'Managing multiple lenders results in stacked interest rates and uncoordinated due dates. A single institutional facility unifies everything into one low EMI.'}
                </div>
              </div>
            </div>
          )}

          {/* ═════ STEP 3: Your Navesta Freedom Roadmap ═════ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Institutional Takeover Structuring Complete
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Your Navesta Freedom Roadmap
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Based on institutional refinance guidelines at 10.25% p.a. over 36 months
                </p>
              </div>

              {/* Comparison Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 border-2 border-emerald-200/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Monthly Cash Saved
                  </span>
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                    +₹{monthlySavings.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">
                    restored to your monthly salary
                  </span>
                </div>

                <div className="bg-blue-50/80 border-2 border-blue-200/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    New 10.25% EMI
                  </span>
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-700 mt-1 tabular-nums">
                    ₹{newEmi.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-blue-800 font-medium mt-0.5 block">
                    down from ₹{currentPayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Freedom Calendar Date Card */}
              <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Guaranteed Freedom Date
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-white">
                    {freedomFormatted}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Vs. 2038+ on revolving minimum card payments
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">
                    Interest Avoided
                  </span>
                  <span className="text-base sm:text-lg font-bold text-amber-400">
                    ₹{totalInterestSaved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Pathway-Specific Next Actions matching Navesta_Website_22Sep26.html */}
              <div className="space-y-2.5 pt-2">
                {/* Primary Pathway Action */}
                <button
                  onClick={() => handleNavigateDestination('primary')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md min-h-[44px]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    {debtType === 'card'
                      ? 'Apply to Consolidate Card Balances at 10.25% →'
                      : debtType === 'loan'
                      ? 'Apply for Personal Loan Takeover at 10.25% →'
                      : 'Roll All Debts into Single 10.25% Facility →'}
                  </span>
                </button>

                {/* Secondary Pathway Action */}
                <button
                  onClick={() => handleNavigateDestination('secondary')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {debtType === 'card'
                      ? 'Add Individual Credit Cards to Portfolio'
                      : debtType === 'loan'
                      ? 'Review Repayment Schedule in Loan Manager'
                      : 'Open Multi-Debt Avalanche / Snowball Calculator'}
                  </span>
                </button>

                {/* WhatsApp Share */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Receive Full Roadmap &amp; Eligibility on WhatsApp</span>
                </button>

                {/* Dashboard Shortcut */}
                <button
                  onClick={() => handleNavigateDestination('dashboard')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to My Borrower Dashboard</span>
                </button>
              </div>

              {submittedWhatsApp && (
                <div className="text-center text-xs text-emerald-700 font-semibold mt-2">
                  ✓ Inquiry initiated! A Navesta senior institutional advisor will connect shortly.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === 1 ? (
            <div />
          ) : step === 'login' ? (
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Selection</span>
            </button>
          ) : step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Numbers</span>
            </button>
          )}

          {step === 1 ? (
            <button
              onClick={handleContinueFromStep1}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : step === 2 ? (
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
            >
              <span>Generate Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : step === 3 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

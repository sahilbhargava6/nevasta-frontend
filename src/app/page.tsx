'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { useSession } from '@/components/session/SessionProvider';
import { api } from '@/lib/api';

/**
 * Landing page — design prototype `#land` (Navesta_Website_22Sep26.html,
 * lines ~1096–1995) plus the post-login greeting `#land-post-home`.
 */

type HoverEl = React.MouseEvent<HTMLElement>;
function hover(on: React.CSSProperties, off: React.CSSProperties) {
  return {
    onMouseOver: (e: HoverEl) => Object.assign(e.currentTarget.style, on),
    onMouseOut: (e: HoverEl) => Object.assign(e.currentTarget.style, off),
  };
}

const ArrowSmall = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const StepConnector = ({ style }: { style: React.CSSProperties }) => (
  <div className="step-connector" style={style} aria-hidden>
    <svg width="100%" height="24" viewBox="0 0 80 24">
      <line x1="4" y1="12" x2="68" y2="12" stroke="#D4760C" strokeWidth="1.5" strokeDasharray="4 3" />
      <polygon points="68,7 78,12 68,17" fill="#D4760C" />
    </svg>
  </div>
);

const TESTIMONIALS = [
  { text: '"I had 4 loans and felt completely lost. Navesta showed me the avalanche method and I\'m saving ₹8,400/month in interest. Cleared my personal loan 14 months early!"', initials: 'RS', bg: 'linear-gradient(135deg,#C86010,#7A3200)', name: 'Rahul Sharma', role: '✓ Saved ₹8,400/mo · Pune' },
  { text: '"Planning our wedding while managing a home loan seemed impossible. Navesta helped us set aside ₹15,000 monthly without touching our EMIs. Got married debt-free!"', initials: 'PM', bg: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', name: 'Priya Menon', role: '✓ Debt-free wedding · Kochi' },
  { text: '"The CIBIL advisor told me exactly what was hurting my score. Fixed my credit card usage, score went from 680 to 762 in 5 months. Refinanced my home loan at 8.4%!"', initials: 'AP', bg: 'linear-gradient(135deg,#0D9488,#065F46)', name: 'Arjun Patel', role: '✓ CIBIL 680→762 · Ahmedabad' },
  { text: '"Navesta\'s AI suggested a balance transfer that saved me ₹1.2 lakh over 3 years. The whole process took 10 minutes. This app is genuinely life-changing."', initials: 'SI', bg: 'linear-gradient(135deg,#1099CF,#075985)', name: 'Sneha Iyer', role: '✓ Saved ₹1.2L · Bengaluru' },
  { text: '"My son\'s engineering admission was coming up and I had no savings plan. Navesta\'s Education Planner showed me exactly how to build ₹8 lakhs in 18 months. We managed it without a single loan."', initials: 'VS', bg: 'linear-gradient(135deg,#F09020,#C96010)', name: 'Venkat Subramaniam', role: '✓ Built ₹8L fund · Chennai' },
  { text: '"I was paying ₹42,000/month in EMIs across 6 loans. In 8 months with Navesta, I consolidated to 3 loans and cut my monthly outflow by ₹11,000. Life-changing!"', initials: 'MK', bg: 'linear-gradient(135deg,#0D9488,#065F46)', name: 'Meena Krishnan', role: '✓ EMI cut ₹11K/mo · Hyderabad' },
  { text: '"We used Navesta to plan our Europe trip while still paying our car EMI. The AI budget split was spot-on — 12 days abroad and we didn\'t miss a single EMI payment. Incredible!"', initials: 'KR', bg: 'linear-gradient(135deg,#8B5CF6,#5B21B6)', name: 'Karan & Riya Shah', role: '✓ Europe trip, zero EMI miss · Mumbai' },
  { text: '"After my startup failed I had ₹18 lakhs in debt across credit cards and personal loans. Navesta gave me a 26-month roadmap. I\'m on month 19 and already ₹11 lakhs cleared. Hope restored."', initials: 'DP', bg: 'linear-gradient(135deg,#DC2626,#991B1B)', name: 'Dev Anand Pillai', role: '✓ ₹11L cleared in 19mo · Kochi' },
];

const FAQS = [
  { q: 'Is Navesta completely free to use?', a: 'Yes — 100% free, always. We never charge for the debt planner, EMI tracker, or life event calculator. Our model is referral-based: if you choose to transfer a loan through a partner bank, we earn a small fee from them, not from you. No hidden costs, no premium tier.' },
  { q: 'Is my financial data safe? Who can see it?', a: 'Your data is encrypted end-to-end using 256-bit SSL and stored on ISO 27001 certified infrastructure in India. Only you can see your financial details. We never sell your data to third parties. When you upload a credit card or loan statement, it is processed locally in your browser — we see only the extracted numbers, not the PDF itself.' },
  { q: 'Is Navesta RBI-compliant? Are you an NBFC?', a: "Yes. Navesta Financial Technologies Pvt. Ltd. is registered as an NBFC with the Reserve Bank of India. We operate under the RBI's Digital Lending Guidelines (2022) and the Account Aggregator framework for any data sharing you opt into. You are always in control of what you share and when." },
  { q: 'Will using Navesta affect my CIBIL score?', a: 'No. Signing up, planning your debt, or getting a payoff estimate does not trigger any credit enquiry. A hard credit pull happens only if you choose to apply for a balance transfer or a new loan through one of our partner banks — and we always tell you before that happens.' },
  { q: 'What types of loans and cards does Navesta support?', a: 'We support all major Indian debt instruments: credit cards (all banks), personal loans, home loans, car loans, education loans, business loans, and buy-now-pay-later balances. You can add them manually or upload your statement PDF for automatic extraction — supported for all major Indian bank statement formats.' },
  { q: 'How does the Avalanche planner actually save me money?', a: 'The debt avalanche method directs any extra money you have each month to the loan charging the highest interest rate first, while paying minimums on everything else. Once that loan is paid off, the freed EMI rolls into the next-highest-rate debt. Navesta automates this calculation across all your debts and shows you the exact month-by-month roadmap — typically saving users ₹1–3 lakhs in interest over their payoff journey.' },
];

const SOCIAL = [
  { title: 'LinkedIn', size: 18, d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { title: 'Instagram', size: 18, d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
  { title: 'Facebook', size: 18, d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { title: 'YouTube', size: 18, d: 'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z' },
  { title: 'Twitter / X', size: 17, d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.631 5.903-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
];

const FOOTER_SOLUTIONS: { label: string; href?: string }[] = [
  { label: 'EMI Tracker', href: '/calculator' },
  { label: 'Avalanche Planner', href: '/calculator' },
  { label: 'Balance Transfer', href: '/balance-transfer' },
  { label: 'Top-up Loan' },
  { label: 'CIBIL Advisor' },
  { label: 'Autopay Manager' },
];
const FOOTER_LIFE = ['Wedding', 'Travel / Holiday', 'Home Renovation', 'Home Shifting', 'Anniversary / Party', 'Education', 'Tax Payment', 'Medical'];
const FOOTER_COMPANY: { label: string; href?: string }[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers' },
  { label: 'Blog', href: '/blog' },
  { label: 'Press' },
  { label: 'Privacy Policy' },
  { label: 'Terms of Service' },
];

const plainFooterItem: React.CSSProperties = { fontSize: 13.5, color: 'rgba(255,255,255,0.6)' };

/* ── EMI savings calculator (design calcInterest / calcFmt / calcUpdate) ── */
function calcInterest(bal: number, rateAnnual: number, months: number) {
  const r = rateAnnual / (12 * 100);
  if (r === 0) return 0;
  const emi = (bal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return emi * months - bal;
}
function calcFmt(n: number) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const pct = (v: number, min: number, max: number) => ({ '--pct': (((clamp(v, min, max) - min) / (max - min)) * 100).toFixed(1) + '%' }) as React.CSSProperties;

/* ── Animated counter (design "STAT COUNTER ANIMATION") ── */
function CountUp({ target, prefix = '', suffix = '', comma = false, initial, run }: { target: number; prefix?: string; suffix?: string; comma?: boolean; initial: string; run: boolean }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let start: number | null = null;
    const duration = 1600;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const current = target * (1 - Math.pow(1 - progress, 3));
      const display = comma ? Math.round(current).toLocaleString('en-IN') : target % 1 !== 0 ? current.toFixed(1) : Math.round(current).toString();
      setText(prefix + display + suffix);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, target, prefix, suffix, comma]);
  return <>{text}</>;
}

export default function Home() {
  const router = useRouter();
  const { user, openAuth, requireAuth } = useSession();
  const rootRef = useRef<HTMLDivElement>(null);

  /* Scroll reveal (design IntersectionObserver adds .visible) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal:not(.visible)'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [user]);

  /* Trusted counters start once the section is on screen */
  const trustedRef = useRef<HTMLElement>(null);
  const [countersRun, setCountersRun] = useState(false);
  useEffect(() => {
    const el = trustedRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setCountersRun(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Video placeholder */
  const [videoClicked, setVideoClicked] = useState(false);

  /* Testimonials carousel */
  const testiRef = useRef<HTMLDivElement>(null);
  const [testiIdx, setTestiIdx] = useState(0);
  const CARD_W = 340;
  const onTestiScroll = () => {
    const el = testiRef.current;
    if (el) setTestiIdx(Math.min(Math.round(el.scrollLeft / CARD_W), TESTIMONIALS.length - 1));
  };
  const scrollTesti = (dir: number) => testiRef.current?.scrollBy({ left: dir * CARD_W, behavior: 'smooth' });

  /* FAQ */
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Personal loan quick apply */
  const [loanPhone, setLoanPhone] = useState('');
  const [loanConsent, setLoanConsent] = useState(false);
  const [loanMsg, setLoanMsg] = useState<{ text: string; color: string } | null>(null);
  const [loanBusy, setLoanBusy] = useState(false);
  const handleLoanApply = async () => {
    const phone = loanPhone.trim();
    if (!phone || phone.length < 10) {
      setLoanMsg({ color: '#F87171', text: '⚠ Please enter a valid 10-digit mobile number.' });
      return;
    }
    if (!loanConsent) {
      setLoanMsg({ color: '#F87171', text: '⚠ Please agree to the Terms & Conditions to proceed.' });
      return;
    }
    setLoanBusy(true);
    setLoanMsg(null);
    try {
      // Callback lead: the phone number is enough. Signed-in visitors also send their own
      // name and real email (phone-only accounts have a placeholder email, which is skipped).
      const realEmail = user?.email && !user.email.endsWith('@phone.navesta.in') ? user.email : undefined;
      await api.post('/inquiries', {
        name: user?.name?.trim() || undefined,
        email: realEmail,
        phone: '+91' + phone,
        inquiryType: 'Personal Loan Callback',
        message: `Personal loan quick apply from the home page. Please call back on +91 ${phone}.`,
      });
      setLoanMsg({ color: '#34D399', text: '✓ Great! Our advisor will call you within 10 minutes.' });
      setLoanPhone('');
      setLoanConsent(false);
    } catch (err) {
      setLoanMsg({ color: '#F87171', text: '⚠ ' + (err instanceof Error ? err.message : 'Something went wrong. Please try again.') });
    } finally {
      setLoanBusy(false);
    }
  };

  /* EMI savings calculator */
  const [calcBal, setCalcBal] = useState('500000');
  const [calcRate, setCalcRate] = useState('14.5');
  const [calcTenure, setCalcTenure] = useState('24');
  const bal = clamp(parseFloat(calcBal) || 500000, 1, 5000000);
  const rate = clamp(parseFloat(calcRate) || 14.5, 0, 36);
  const months = clamp(parseInt(calcTenure, 10) || 24, 1, 120);
  const currentInterest = calcInterest(bal, rate, months);
  const newInterest = calcInterest(bal, Math.max(8.5, rate - 3.5), months);
  const saved = currentInterest - newInterest;

  /* Sticky mobile download bar */
  const [dlDismissed, setDlDismissed] = useState(false);
  const appComingSoon = () => toast.info('The Navesta mobile app is coming soon. Everything works right here on the web in the meantime.');

  const signUpOr = (intent: 'ai-feat' | 'emi-calc' | null) => {
    if (user) router.push('/debt-management');
    else openAuth({ mode: 'signup', intent });
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const storeBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#2A1606', borderRadius: 12, border: 'none', cursor: 'pointer', color: '#fff', transition: 'all .2s', fontFamily: 'var(--sans)', textAlign: 'left' };
  const partnerCard: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid rgba(196,140,80,0.2)', borderRadius: 18, padding: '20px 28px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'box-shadow .2s,transform .2s', cursor: 'default' };
  const trustItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3A2310', fontFamily: 'var(--sans)' };
  const calcRangeLbl: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#B09070', fontFamily: 'var(--sans)', marginTop: 4 };

  return (
    <>
      <Navbar />
      {/* The design nav is fixed and overlays the first section; pull content up under it */}
      <div className="nv" id="land" ref={rootRef} style={{ marginTop: -84 }}>
        {/* ═══ POST-LOGIN HOME (#land-post-home) ═══ */}
        {user && (
          <section id="land-post-home" className="active" style={{ minHeight: 'auto', paddingBottom: 40 }}>
            <div className="lph-greeting">
              <div className="lph-name">Hello, {firstName}!</div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <div className="l-ai-badge" style={{ marginBottom: 0 }}>
                  <span>⚡</span> Powered by AI
                </div>
              </div>
            </div>
            <div className="lph-cards">
              <div className="lph-card debt-card" onClick={() => router.push('/debt-management')}>
                <div className="lph-card-glow" />
                <div className="lph-card-accent" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden>💸</span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, background: '#22C55E', color: '#fff', padding: '4px 10px', borderRadius: 20, fontFamily: 'var(--sans)' }}>LIVE</span>
                </div>
                <div className="lph-card-label">Debt Management</div>
                <div className="lph-card-title">Escape the debt trap</div>
                <div className="lph-card-desc">See the real cost of paying only the minimum. Get AI-ranked fixes and a clear, step-by-step path to financial freedom — faster than you ever imagined.</div>
                <button
                  className="lph-card-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/debt-management');
                  }}
                >
                  Start Debt Journey →
                </button>
              </div>
              <div className="lph-card life-card" onClick={() => router.push('/life-events')}>
                <div className="lph-card-glow" />
                <div className="lph-card-accent" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden>🌟</span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, background: '#22C55E', color: '#fff', padding: '4px 10px', borderRadius: 20, fontFamily: 'var(--sans)' }}>LIVE</span>
                </div>
                <div className="lph-card-label">Life Events Planner</div>
                <div className="lph-card-title">Big moments, planned early</div>
                <div className="lph-card-desc">Wedding, travel, education and many more — plan and save for every milestone before it arrives, so you never have to compromise on what matters most.</div>
                <button
                  className="lph-card-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/life-events');
                  }}
                >
                  Plan Life Events →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ═══ HERO ═══ */}
        <section className="l-hero">
          <div className="hero-bg-deco" aria-hidden>
            <div className="hero-bg-deco-ring" style={{ width: 600, height: 600, top: -200, right: -100 }} />
            <div className="hero-bg-deco-ring" style={{ width: 400, height: 400, bottom: -150, left: -80, borderColor: 'rgba(201,96,16,0.05)' }} />
          </div>

          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Debt Management
            </div>

            <h1 className="hero-h1-tp">
              Struggling With Debt?
              <br />
              <em>Here&apos;s Your Way Out.</em>
            </h1>

            <p className="hero-sub-tp">Being debt-free isn&apos;t a dream — it&apos;s a date on the calendar. Navesta finds yours in a few minutes. No card needed, no catch.</p>

            <div className="hero-paths" id="journeys">
              <div className="hero-path-card hero-path-cc">
                <span className="hpc-stat">24–36% APR</span>
                <div className="hpc-inner">
                  <div className="hpc-icon-wrap"><span className="hpc-icon" aria-hidden>💳</span></div>
                  <div className="hpc-label">Credit Card Debt</div>
                  <div className="hpc-title">Can&apos;t Clear Your Card Balance?</div>
                  <p className="hpc-pain">Minimum payments keep the bank happy — but you could pay 2–3× what you owe. We show you the exact steps to break free.</p>
                  <button className="hpc-cta" onClick={() => requireAuth('debt-cc', () => router.push('/journey/credit-card'))}>
                    Show Me the Way Out
                    <ArrowSmall />
                  </button>
                </div>
              </div>

              <div className="hero-path-card hero-path-loan">
                <span className="hpc-stat">Loan EMIs</span>
                <div className="hpc-inner">
                  <div className="hpc-icon-wrap"><span className="hpc-icon" aria-hidden>🏦</span></div>
                  <div className="hpc-label">Loan &amp; EMI Debt</div>
                  <div className="hpc-title">EMIs Draining Your Salary?</div>
                  <p className="hpc-pain">Personal Loan EMIs leaving nothing by the 15th? We show you how to clear it with low burden of EMI — and the exact month you&apos;ll be debt-free.</p>
                  <button className="hpc-cta" onClick={() => requireAuth('debt-loan', () => router.push('/journey/loan'))}>
                    Show Me My Freedom Date
                    <ArrowSmall />
                  </button>
                </div>
              </div>

              <div className="hero-path-card hero-path-consolidate">
                <span className="hpc-stat">All Debts</span>
                <div className="hpc-inner">
                  <div className="hpc-icon-wrap"><span className="hpc-icon" aria-hidden>🔗</span></div>
                  <div className="hpc-label">Debt Consolidation</div>
                  <div className="hpc-title">Too Many EMIs? Roll Them Into One.</div>
                  <p className="hpc-pain">Credit cards, personal loans — juggling multiple lenders is costly. One consolidation loan cuts your rate to a single, lower EMI.</p>
                  <button className="hpc-cta" onClick={() => requireAuth('debt-consolidation', () => router.push('/journey/multiple'))}>
                    Find My Consolidation Rate
                    <ArrowSmall />
                  </button>
                </div>
              </div>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-n">₹480 Cr+</div>
                <div className="hero-stat-l">Debt Managed</div>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <div className="hero-stat-n">2.4 L+</div>
                <div className="hero-stat-l">Users</div>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <div className="hero-stat-n">₹12K</div>
                <div className="hero-stat-l">Avg Saved/Mo</div>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <div className="hero-stat-n">4.8 ★</div>
                <div className="hero-stat-l">App Rating</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={trustItem}><span style={{ fontSize: 15 }} aria-hidden>🔒</span> 256-bit SSL Encryption</div>
              <div style={trustItem}><span style={{ fontSize: 15 }} aria-hidden>🛡️</span> ISO 27001 Certified</div>
              <div style={trustItem}><span style={{ fontSize: 15 }} aria-hidden>✅</span> No Credit Score Impact</div>
              <div style={trustItem}><span style={{ fontSize: 15 }} aria-hidden>🎁</span> Free · Always</div>
            </div>
          </div>

          <div className="hero-phone-wrap">
            <div className="hero-img-card">
              <Image src="/design/hero.jpg" alt="Indian couple happily reviewing their debt-free plan on Navesta" className="hero-img" fill priority sizes="(max-width: 700px) 0px, 50vw" />
              <div className="hero-img-caption">
                <span className="hero-img-cap-text">₹1.38 L saved · Debt-free Aug 2027</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRESS ═══ */}
        <section className="l-press">
          <div className="l-press-inner">
            <div className="l-press-label">As Seen In</div>
            <div className="l-press-logos">
              <div className="press-logo">Economic Times <span>ET</span></div>
              <div className="press-logo">Mint</div>
              <div className="press-logo">Inc42</div>
              <div className="press-logo">YourStory</div>
              <div className="press-logo">Business Standard</div>
              <div className="press-logo">CNBC-TV18</div>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="l-how reveal" id="how">
          <div className="l-sec-label">Simple Process</div>
          <h2 className="l-sec-h">Debt-Free in 4 Steps</h2>
          <div className="steps-grid" style={{ position: 'relative' }}>
            <StepConnector style={{ left: 'calc(12.5% + 0px)', width: 'calc(25% - 0px)', top: 26 }} />
            <StepConnector style={{ left: 'calc(37.5%)', width: 'calc(25%)', top: 26 }} />
            <StepConnector style={{ left: 'calc(62.5%)', width: 'calc(25%)', top: 26 }} />
            <div className="step-card reveal reveal-delay-1">
              <div className="step-num">1</div>
              <div className="step-title">Add Your Loans</div>
              <div className="step-desc">Import or manually add all your EMIs — home loan, car loan, personal loans, credit cards.</div>
            </div>
            <div className="step-card reveal reveal-delay-2">
              <div className="step-num">2</div>
              <div className="step-title">See Your Picture</div>
              <div className="step-desc">Get a clear dashboard of total debt, monthly obligation, and your debt-free date.</div>
            </div>
            <div className="step-card reveal reveal-delay-3">
              <div className="step-num">3</div>
              <div className="step-title">Avalanche Attack</div>
              <div className="step-desc">Our Avalanche planner redirects freed EMIs to high-interest debt, saving you lakhs.</div>
            </div>
            <div className="step-card reveal reveal-delay-4">
              <div className="step-num">4</div>
              <div className="step-title">Celebrate Freedom</div>
              <div className="step-desc">Watch the debt melt away month by month. Hit zero and unlock life event planning.</div>
            </div>
          </div>
        </section>

        {/* ═══ NAVA AI FEATURES ═══ */}
        <section className="l-ai-feat reveal">
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(240,144,32,0.6)', marginBottom: 14, fontFamily: 'var(--sans)' }}>Powered by Nava AI</div>
            <h2 style={{ fontSize: 'clamp(28px,4.5vw,44px)', fontFamily: 'var(--serif)', color: '#fff', fontWeight: 700, margin: '0 0 14px', letterSpacing: -0.5 }}>Your 24/7 Financial Co-Pilot</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--sans)' }}>
              Nava learns your financial profile and acts as your personal CFO — planning, optimising, and monitoring so you don&apos;t have to.
            </p>
          </div>
          <div className="ai-feat-grid">
            <div className="ai-feat-card">
              <div className="ai-feat-badge">Most Used</div>
              <div className="ai-feat-icon" aria-hidden>🧠</div>
              <div className="ai-feat-title">Debt Intelligence</div>
              <div className="ai-feat-body">Nava analyses your full debt portfolio — rate, tenure, type — and builds a personalised payoff strategy using avalanche or snowball methods. It finds refinancing opportunities and alerts you when rates drop.</div>
              <div className="ai-feat-chip">Saves avg. ₹1.4L interest</div>
            </div>
            <div className="ai-feat-card">
              <div className="ai-feat-icon" aria-hidden>📅</div>
              <div className="ai-feat-title">Life Event Planning</div>
              <div className="ai-feat-body">Tell Nava your upcoming goal — wedding, travel, home renovation, education — and it builds a custom savings + borrowing plan that fits your monthly cash flow. Adjusts in real time as your situation changes.</div>
              <div className="ai-feat-chip">Plans for 12+ life events</div>
            </div>
            <div className="ai-feat-card">
              <div className="ai-feat-icon" aria-hidden>📊</div>
              <div className="ai-feat-title">CIBIL Optimizer</div>
              <div className="ai-feat-body">Nava identifies the exact factors dragging your CIBIL score — credit utilisation, inquiry history, mix — and gives you a week-by-week repair plan. Track progress live as you implement each step.</div>
              <div className="ai-feat-chip">Avg. +82 points in 6 months</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 48, position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => signUpOr('ai-feat')}
              style={{ background: 'linear-gradient(135deg,#F09020,#C06010)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 700, fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'all .2s' }}
              {...hover({ transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(192,96,16,0.45)' }, { transform: '', boxShadow: '' })}
            >
              Start With Nava AI — Free ➜
            </button>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '12px 0 0', fontFamily: 'var(--sans)' }}>No credit card · No credit score impact · Takes 3 minutes</p>
          </div>
        </section>

        {/* ═══ ALWAYS-VISIBLE SECTIONS ═══ */}
        {/* Video */}
        <section className="l-video-sec reveal">
          <div className="l-video-inner">
            <div className="l-video-msg">
              <div className="l-sec-label" style={{ marginBottom: 12 }}>See It In Action</div>
              <h2 className="l-sec-h" style={{ textAlign: 'left', marginBottom: 18 }}>From Minimum Payments to Debt-Free — In 18 Months</h2>
              <p className="l-video-body">
                Most people spend years paying interest on debt they could clear in months — with the right plan. Watch how Navesta&apos;s AI mapped out a step-by-step payoff strategy for a real Indian family and saved them over ₹2.1L in interest.
              </p>
              <ul className="l-video-points">
                <li><span className="l-vp-icon" aria-hidden>📊</span> Analysed 4 credit cards + 2 EMI loans in under 3 minutes</li>
                <li><span className="l-vp-icon" aria-hidden>📅</span> Generated a personalised payoff calendar with exact dates</li>
                <li><span className="l-vp-icon" aria-hidden>💰</span> Identified ₹2.1L in avoidable interest charges</li>
                <li><span className="l-vp-icon" aria-hidden>🔒</span> Zero data shared — 100% private and secure</li>
              </ul>
            </div>
            <div className="l-video-player">
              <div className="l-video-thumb">
                {videoClicked ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#111', borderRadius: 18, color: 'rgba(255,255,255,0.4)', fontSize: 15, fontFamily: 'var(--sans)' }}>Video coming soon</div>
                ) : (
                  <>
                    <div className="l-video-overlay" />
                    <button className="l-video-play" onClick={() => setVideoClicked(true)} aria-label="Play video" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <div className="l-video-play-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </button>
                    <div className="l-video-duration">2:47</div>
                    <div className="l-video-bars" aria-hidden>
                      {Array.from({ length: 10 }, (_, i) => (
                        <span key={i} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="l-video-caption">📽️ How Navesta helped a Bengaluru couple clear ₹8.2L in credit card debt</div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="l-testi reveal">
          <div className="l-sec-label">Real Stories</div>
          <h2 className="l-sec-h">Stories That Started With One Decision</h2>
          <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 14 }}>
              {[
                { dir: -1, label: 'Previous', glyph: '‹' },
                { dir: 1, label: 'Next', glyph: '›' },
              ].map((b) => (
                <button
                  key={b.dir}
                  onClick={() => scrollTesti(b.dir)}
                  title={b.label}
                  aria-label={b.label + ' testimonial'}
                  style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', border: '1.5px solid #E8D5C0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#8A7058', fontSize: 20, lineHeight: 1, transition: 'all .2s' }}
                >
                  {b.glyph}
                </button>
              ))}
            </div>
            <div className="lph-testi-scroll" ref={testiRef} onScroll={onTestiScroll}>
              {TESTIMONIALS.map((t) => (
                <div className="lph-testi-card" key={t.name}>
                  <div className="lph-testi-stars" aria-label="5 out of 5 stars">★★★★★</div>
                  <div className="lph-testi-text">{t.text}</div>
                  <div className="lph-testi-author">
                    <div className="lph-testi-avatar" style={{ background: t.bg }}>{t.initials}</div>
                    <div>
                      <div className="lph-testi-name">{t.name}</div>
                      <div className="lph-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  aria-label={`Show testimonial ${i + 1}`}
                  aria-current={i === testiIdx}
                  onClick={() => testiRef.current?.scrollTo({ left: i * CARD_W, behavior: 'smooth' })}
                  style={{ width: i === testiIdx ? 24 : 8, height: 8, borderRadius: i === testiIdx ? 4 : '50%', background: i === testiIdx ? '#E07C10' : '#D4B896', cursor: 'pointer', transition: 'all .25s', display: 'inline-block', border: 'none', padding: 0 }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Mid-page CTA */}
        <section style={{ background: 'linear-gradient(135deg,#C96010 0%,#E07820 60%,#F09020 100%)', padding: '60px 5%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontFamily: 'var(--serif)', color: '#fff', fontWeight: 700, margin: '0 0 12px', letterSpacing: -0.4 }}>Ready to take control of your money?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '0 0 28px', fontFamily: 'var(--sans)' }}>Join 2.4 lakh+ Indians who&apos;ve already started. Free, always.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => signUpOr(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#C96010', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', transition: 'transform .2s,box-shadow .2s' }}
              {...hover({ transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(0,0,0,0.2)' }, { transform: '', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' })}
            >
              Start Free — No Card Required →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--sans)' }}>✓ 2.4L+ users</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--sans)' }}>✓ ₹90Cr interest saved</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--sans)' }}>✓ 4.8★ rated</span>
          </div>
        </section>

        {/* Trusted By India */}
        <section className="l-trusted reveal" ref={trustedRef}>
          <div className="l-sec-label">Why India Trusts Navesta</div>
          <h2 className="l-sec-h">Numbers That Speak</h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginTop: 40 }}>
            <div className="trusted-stat">
              <div className="trusted-stat-num"><CountUp run={countersRun} target={240000} comma suffix="+" initial="2,40,000+" /></div>
              <div className="trusted-stat-lbl">Active Users</div>
            </div>
            <div className="trusted-stat">
              <div className="trusted-stat-num"><CountUp run={countersRun} target={90} prefix="₹" suffix=" Cr+" initial="₹90 Cr+" /></div>
              <div className="trusted-stat-lbl">Interest Saved</div>
            </div>
            <div className="trusted-stat">
              <div className="trusted-stat-num"><CountUp run={countersRun} target={4.8} suffix=" ★" initial="4.8 ★" /></div>
              <div className="trusted-stat-lbl">App Rating</div>
            </div>
            <div className="trusted-stat">
              <div className="trusted-stat-num"><CountUp run={countersRun} target={3} suffix=" min" initial="3 min" /></div>
              <div className="trusted-stat-lbl">Avg. Setup Time</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(42,22,6,0.5)', maxWidth: 560, margin: '32px auto 0', lineHeight: 1.7, fontFamily: 'var(--sans)', textAlign: 'center' }}>
            From a 23-year-old managing their first credit card to a retired couple refinancing their home loan — Navesta works for every stage of life.
          </p>
        </section>

        {/* App Download */}
        <section style={{ background: '#EDE6DB', padding: '80px 5%' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E07C10', marginBottom: 14, fontFamily: 'var(--sans)' }}>Mobile App</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: '#2A1606', lineHeight: 1.15, marginBottom: 16 }}>
                Your Finances,
                <br />
                In Your Pocket
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(42,22,6,0.6)', lineHeight: 1.7, marginBottom: 32, fontFamily: 'var(--sans)', maxWidth: 400 }}>
                Track EMIs, get AI nudges, and plan every rupee — all from the Navesta app. Free forever, no credit card needed.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button style={storeBtn} onClick={appComingSoon} {...hover({ background: '#F09020' }, { background: '#2A1606' })}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>Download on the</div>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>App Store</div>
                  </div>
                </button>
                <button style={storeBtn} onClick={appComingSoon} {...hover({ background: '#F09020' }, { background: '#2A1606' })}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.79-2.79-10.8 9.86zm-1.7-20.4C1.18 3.7 1 4.14 1 4.64v14.72c0 .5.18.94.48 1.28l.07.06 8.25-8.25v-.2L1.55 3.3l-.07.06zM20.49 10.7l-2.35-1.36-3.12 3.12 3.12 3.12 2.38-1.37c.68-.39.68-1.02-.03-1.51zM4.17.24L16.77 7.5l-2.79 2.79L3.18.43a1.14 1.14 0 0 1 .99-.19z" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>Get it on</div>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>Google Play</div>
                  </div>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
                {[
                  ['4.8 ★', 'App Store'],
                  ['4.7 ★', 'Google Play'],
                  ['2.4L+', 'Downloads'],
                ].map(([n, l]) => (
                  <div key={l} style={{ fontFamily: 'var(--sans)' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#F09020', fontFamily: 'var(--serif)' }}>{n}</div>
                    <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div style={{ flexShrink: 0, width: 240, margin: '0 auto', position: 'relative' }} aria-hidden>
              <div style={{ width: 232, background: '#1A0E04', borderRadius: 44, padding: 6, boxShadow: '0 32px 80px rgba(42,22,6,0.35),0 0 0 1px rgba(255,255,255,0.08)' }}>
                <div style={{ borderRadius: 38, overflow: 'hidden', background: '#F5EDE0', position: 'relative' }}>
                  <div style={{ background: '#1A0E04', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 72, height: 20, background: '#000', borderRadius: 20 }} />
                  </div>
                  <div style={{ padding: '10px 12px 0', background: '#F5EDE0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0D9488', fontFamily: 'var(--sans)', lineHeight: 1 }}>
                          Navesta <span style={{ fontSize: 9 }}>📊</span>
                        </div>
                        <div style={{ fontSize: 8, color: '#C96010', fontFamily: 'var(--sans)' }}>Companion for smarter money</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(42,22,6,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🔍</div>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#0D9488,#065F46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', fontFamily: 'var(--sans)' }}>RM</div>
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg,#0D9488,#0891B2)', borderRadius: 20, padding: '3px 10px', marginBottom: 10 }}>
                      <span style={{ fontSize: 9 }}>⚡</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: 'var(--sans)' }}>Powered by AI</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1A0E04', fontFamily: 'var(--serif)', lineHeight: 1.25, marginBottom: 4 }}>
                      Hi Rahul, meet your <span style={{ color: '#F09020' }}>money companion.</span>
                    </div>
                    <div style={{ fontSize: 8, color: 'rgba(42,22,6,0.55)', fontFamily: 'var(--sans)', lineHeight: 1.5, marginBottom: 12 }}>AI-powered tools for smarter money decisions — built around your goals.</div>
                    <div style={{ background: 'linear-gradient(135deg,#D6EEFF,#B8DEFA)', borderRadius: 14, padding: 10, marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💳</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F4C8A', fontFamily: 'var(--serif)' }}>Debt Management</div>
                          <div style={{ fontSize: 7, fontWeight: 700, background: '#059669', color: '#fff', borderRadius: 6, padding: '1px 5px', fontFamily: 'var(--sans)' }}>LIVE</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 7.5, color: 'rgba(15,76,138,0.75)', fontFamily: 'var(--sans)', lineHeight: 1.5, marginBottom: 8 }}>Escape the debt trap — see the real cost of paying the minimum, get AI-ranked fixes and a clear payoff plan.</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#1E5FAD', borderRadius: 8, padding: '4px 10px' }}>
                        <span style={{ fontSize: 7.5, fontWeight: 700, color: '#fff', fontFamily: 'var(--sans)' }}>Get started →</span>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg,#EAD6FF,#C8AAFF)', borderRadius: 14, padding: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎉</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#5B21B6', fontFamily: 'var(--serif)' }}>Life-Event Planning</div>
                          <div style={{ fontSize: 7, fontWeight: 700, background: '#059669', color: '#fff', borderRadius: 6, padding: '1px 5px', fontFamily: 'var(--sans)' }}>LIVE</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 7.5, color: 'rgba(91,33,182,0.75)', fontFamily: 'var(--sans)', lineHeight: 1.5, marginBottom: 8 }}>Big moments, planned early — wedding, travel, renovation and more. Get a loan plan in seconds.</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6D28D9', borderRadius: 8, padding: '4px 10px' }}>
                        <span style={{ fontSize: 7.5, fontWeight: 700, color: '#fff', fontFamily: 'var(--sans)' }}>Get started →</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 12px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(196,168,130,0.2)' }}>
                    {[
                      ['50k+', 'people guided'],
                      ['₹90Cr', 'interest saved'],
                      ['4.8★', '12k ratings'],
                    ].map(([n, l]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#F09020', fontFamily: 'var(--serif)' }}>{n}</div>
                        <div style={{ fontSize: 6.5, color: '#8A7058', fontFamily: 'var(--sans)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ width: 72, height: 4, background: 'rgba(26,14,4,0.3)', borderRadius: 2, margin: '8px auto 0' }} />
            </div>
          </div>
        </section>

        {/* Lending Partners */}
        <section style={{ background: '#FDF6EC', padding: '52px 5% 48px', textAlign: 'center', borderBottom: '1px solid rgba(196,168,130,0.15)' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#8A7058', marginBottom: 8, fontFamily: 'var(--sans)' }}>Our Lending Partners</div>
            <p style={{ fontSize: 14, color: '#8A7058', margin: 0, fontFamily: 'var(--sans)' }}>3 leading banks — we surface the best rate for your profile, without bias.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
            {[
              { src: '/design/partner-sbi.png', alt: 'SBI', name: 'State Bank of India' },
              { src: '/design/partner-hdfc.png', alt: 'HDFC Bank', name: 'HDFC Bank' },
              { src: '/design/partner-icici.png', alt: 'ICICI Bank', name: 'ICICI Bank' },
            ].map((p) => (
              <div key={p.name} style={partnerCard} {...hover({ boxShadow: '0 8px 28px rgba(196,96,16,0.12)', transform: 'translateY(-3px)' }, { boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transform: '' })}>
                <Image src={p.src} alt={p.alt} width={120} height={72} style={{ width: 120, height: 72, objectFit: 'contain' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6A4020', fontFamily: 'var(--sans)', letterSpacing: 0.2 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Personal Loan quick apply */}
        <section className="l-loan-section reveal">
          <div className="l-loan-inner">
            <div className="l-loan-badge">Quick Apply</div>
            <h2 className="l-loan-h">Apply for a Personal Loan</h2>
            <p className="l-loan-sub">Get instant approval. No paperwork. Rates starting at 10.5% p.a.</p>
            <form
              className="l-loan-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleLoanApply();
              }}
              noValidate
            >
              <div className="l-loan-input-wrap">
                <span className="l-loan-flag">🇮🇳 +91</span>
                <input
                  className="l-loan-input"
                  id="loan-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter your mobile number"
                  aria-label="Mobile number"
                  maxLength={10}
                  value={loanPhone}
                  onChange={(e) => setLoanPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
              <button className="l-loan-btn" type="submit" disabled={loanBusy} style={loanBusy ? { opacity: 0.7, cursor: 'wait' } : undefined}>
                {loanBusy ? 'Submitting…' : 'Apply Now →'}
              </button>
            </form>
            <label className="l-loan-consent">
              <input type="checkbox" id="loan-consent" checked={loanConsent} onChange={(e) => setLoanConsent(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#0D9488', flexShrink: 0, marginTop: 1 }} />
              <span>
                By proceeding you agree to our <span style={{ color: '#0D9488' }}>Terms &amp; Conditions</span> &amp; <span style={{ color: '#0D9488' }}>Privacy Policy</span>
              </span>
            </label>
            <div className="l-loan-msg" role="status" aria-live="polite" style={loanMsg ? { color: loanMsg.color } : undefined}>
              {loanMsg?.text}
            </div>
          </div>
        </section>

        {/* EMI Savings Calculator */}
        <section className="l-calc reveal">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: '#8A7058', marginBottom: 14, fontFamily: 'var(--sans)' }}>Free Calculator</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontFamily: 'var(--serif)', color: '#1A0A00', fontWeight: 700, margin: '0 0 14px', letterSpacing: -0.5 }}>
              See Your Savings in <em style={{ color: '#C96010', fontStyle: 'italic' }}>30 Seconds</em>
            </h2>
            <p style={{ fontSize: 16, color: '#5A3A1A', lineHeight: 1.65, fontFamily: 'var(--sans)' }}>
              Enter your loan details — we&apos;ll show how much interest Navesta can save you through refinancing or restructuring.
            </p>
          </div>
          <div className="calc-wrap">
            <div className="calc-inputs">
              <div className="calc-field">
                <label htmlFor="calc-balance">Outstanding Balance</label>
                <div className="calc-input-row">
                  <span>₹</span>
                  <input type="number" id="calc-balance" value={calcBal} min={10000} max={5000000} step={10000} onChange={(e) => setCalcBal(e.target.value)} />
                </div>
                <input type="range" className="calc-range" min={10000} max={5000000} step={10000} value={clamp(parseFloat(calcBal) || 500000, 10000, 5000000)} onChange={(e) => setCalcBal(e.target.value)} aria-label="Balance slider" style={pct(parseFloat(calcBal) || 500000, 10000, 5000000)} />
                <div style={calcRangeLbl}><span>₹10K</span><span>₹50L</span></div>
              </div>
              <div className="calc-field">
                <label htmlFor="calc-rate">Current Interest Rate</label>
                <div className="calc-input-row">
                  <input type="number" id="calc-rate" value={calcRate} min={8} max={36} step={0.5} onChange={(e) => setCalcRate(e.target.value)} />
                  <span>% p.a.</span>
                </div>
                <input type="range" className="calc-range" min={8} max={36} step={0.5} value={clamp(parseFloat(calcRate) || 14.5, 8, 36)} onChange={(e) => setCalcRate(e.target.value)} aria-label="Rate slider" style={pct(parseFloat(calcRate) || 14.5, 8, 36)} />
                <div style={calcRangeLbl}><span>8%</span><span>36%</span></div>
              </div>
              <div className="calc-field">
                <label htmlFor="calc-tenure">Remaining Tenure</label>
                <div className="calc-input-row">
                  <input type="number" id="calc-tenure" value={calcTenure} min={3} max={120} step={1} onChange={(e) => setCalcTenure(e.target.value)} />
                  <span>months</span>
                </div>
                <input type="range" className="calc-range" min={3} max={120} step={1} value={clamp(parseInt(calcTenure, 10) || 24, 3, 120)} onChange={(e) => setCalcTenure(e.target.value)} aria-label="Tenure slider" style={pct(parseInt(calcTenure, 10) || 24, 3, 120)} />
                <div style={calcRangeLbl}><span>3 mo</span><span>10 yrs</span></div>
              </div>
            </div>
            <div className="calc-result" aria-live="polite">
              <div className="calc-result-label">Total Interest You&apos;ll Pay Now</div>
              <div className="calc-result-current">{calcFmt(currentInterest)}</div>
              <div className="calc-result-arrow">↓ Navesta finds you a better rate</div>
              <div className="calc-result-label" style={{ marginTop: 8 }}>Estimated Interest After Navesta</div>
              <div className="calc-result-new">{calcFmt(newInterest)}</div>
              <div className="calc-savings-pill" style={{ display: 'inline-flex' }}>{saved > 0 ? 'You could save ' + calcFmt(saved) : 'Already at a great rate!'}</div>
              <button className="calc-cta-btn" onClick={() => signUpOr('emi-calc')}>Get My Personalised Plan ➜</button>
              <div className="calc-disclaimer">* Estimated savings based on avg. 3–4% rate reduction. Actual savings depend on your credit profile and lender offers.</div>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="l-security">
          <div className="l-security-inner">
            {[
              ['🏛️', 'RBI Registered', 'NBFC · Digital Lending'],
              ['🔒', '256-bit SSL', 'Bank-grade encryption'],
              ['✅', 'ISO 27001', 'Certified data security'],
              ['🛡️', 'DPDP Compliant', 'India Data Protection Act'],
              ['🤝', 'AA Framework', 'RBI Account Aggregator'],
            ].map(([icon, title, sub], i) => (
              <div key={title} style={{ display: 'contents' }}>
                {i > 0 && <div className="sec-badge-divider" />}
                <div className="sec-badge">
                  <div className="sec-badge-icon" aria-hidden>{icon}</div>
                  <div>
                    <div className="sec-badge-title">{title}</div>
                    <div className="sec-badge-sub">{sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Follow Us */}
        <section style={{ background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 45%,#FDE8D0 100%)', padding: '56px 5%', textAlign: 'center', borderTop: '1px solid rgba(196,168,130,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: '#8A7058', marginBottom: 24, fontFamily: 'var(--sans)' }}>Follow Us</div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {SOCIAL.map((s) => (
              <span
                key={s.title}
                title={s.title}
                role="img"
                aria-label={s.title}
                style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1.5px solid rgba(196,140,80,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#C96010', transition: 'all .2s' }}
                {...hover({ background: '#F09020', color: '#fff', borderColor: '#F09020' }, { background: '#fff', color: '#C96010', borderColor: 'rgba(196,140,80,0.3)' })}
              >
                <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={s.d} />
                </svg>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.4)', marginTop: 24, fontFamily: 'var(--sans)' }}>© 2026 Navesta Financial Technologies Pvt. Ltd.</div>
        </section>

        {/* FAQ */}
        <section className="l-faq reveal">
          <h2 className="l-sec-h" style={{ marginBottom: 40 }}>Got Questions? We&apos;ve Got Answers.</h2>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} aria-controls={`faq-a-${i}`}>
                  {f.q}
                  <Chevron />
                </button>
                <div className="faq-a" id={`faq-a-${i}`}>{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="l-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="l-logo">Navesta</div>
              <div className="footer-desc">India&apos;s leading personal finance platform for debt management and life event planning. Helping families achieve financial freedom since 2022.</div>
              <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>
                📍 Navesta Financial Technologies Pvt. Ltd.
                <br />
                Level 8, Prestige Tech Tower,
                <br />
                Outer Ring Road, Marathahalli,
                <br />
                Bengaluru, Karnataka — 560 037
                <br />
                <br />
                📞{' '}
                <a href="tel:18001233328" style={{ color: 'inherit', textDecoration: 'none' }}>
                  1800-123-DEBT (1800-123-3328)
                </a>
                <br />
                ✉️{' '}
                <a href="mailto:support@navesta.in" style={{ color: 'inherit', textDecoration: 'none' }}>
                  support@navesta.in
                </a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Solutions</div>
              <ul className="footer-links">
                {FOOTER_SOLUTIONS.map((l) => (
                  <li key={l.label}>{l.href ? <Link href={l.href}>{l.label}</Link> : <span style={plainFooterItem}>{l.label}</span>}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Life Events</div>
              <ul className="footer-links">
                {FOOTER_LIFE.map((l) => (
                  <li key={l}>
                    <Link href="/life-events">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <ul className="footer-links">
                {FOOTER_COMPANY.map((l) => (
                  <li key={l.label}>{l.href ? <Link href={l.href}>{l.label}</Link> : <span style={plainFooterItem}>{l.label}</span>}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2026 Navesta Financial Technologies Pvt. Ltd. All rights reserved. NBFC Registered. RBI Compliant.</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {SOCIAL.slice(0, 4).map((s) => (
                <span
                  key={s.title}
                  title={s.title}
                  role="img"
                  aria-label={s.title}
                  style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={s.d} />
                  </svg>
                </span>
              ))}
            </div>
          </div>
        </footer>

        {/* Sticky mobile download bar */}
        {!dlDismissed && (
          // Right padding keeps the ✕ clear of the floating Nava chat button (fixed, bottom-right)
          <div className="sticky-dl" style={{ paddingRight: 96 }}>
            <div className="sticky-dl-text">
              Free Download
              <br />
              No credit check · No fees
            </div>
            <div className="sticky-dl-btns">
              <button className="sticky-dl-btn" onClick={appComingSoon} style={{ cursor: 'pointer' }}>
                App Store
              </button>
              <button className="sticky-dl-btn" onClick={appComingSoon} style={{ cursor: 'pointer' }}>
                Play Store
              </button>
            </div>
            <button className="sticky-dl-close" onClick={() => setDlDismissed(true)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}

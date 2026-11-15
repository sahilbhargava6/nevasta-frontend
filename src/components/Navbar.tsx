'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Landmark,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  FileText,
  Settings,
  Compass,
} from 'lucide-react';
import { useSession, initialsOf } from '@/components/session/SessionProvider';

/**
 * Site header in the original Navesta look (slate/blue), wired to the shared
 * session: sign-in opens the mobile + OTP dialog, the avatar opens the
 * profile, and "Start Debt Plan" enters the Debt Management journey.
 */
const PUBLIC_LINKS = [
  { href: '/about', label: 'Who We Are' },
  { href: '/debt-management', label: 'Debt Management', needsAccount: true },
  { href: '/life-events', label: 'Life Events' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/blog', label: 'Knowledge Hub' },
  { href: '/contact', label: 'Contact Us' },
];

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/debt-management', label: 'Debt Plan', icon: Compass },
  { href: '/loans', label: 'Loans & EMIs', icon: Landmark },
  { href: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
  { href: '/balance-transfer', label: 'Balance Transfer', icon: ArrowLeftRight },
  { href: '/statements', label: 'Vault', icon: FileText },
];

export default function Navbar(_props: { onOpenAuth?: () => void } = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { user, ready, openAuth, requireAuth, openProfile, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = ready && !!user;

  const go = (href: string, needsAccount?: boolean) => {
    setMobileOpen(false);
    if (needsAccount) requireAuth('debt-management', () => router.push(href));
    else router.push(href);
  };
  const startPlan = () => go('/debt-management', true);
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">navesta</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Debt Advisory</span>
          </div>
        </Link>

        {isLoggedIn ? (
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/70">
            {ACCOUNT_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    active ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-6">
            {PUBLIC_LINKS.map((l) => (
              <button
                key={l.href}
                type="button"
                onClick={() => go(l.href, l.needsAccount)}
                className={`text-xs font-semibold transition-colors cursor-pointer ${isActive(l.href) ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {l.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={openProfile}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
                title="Your profile"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">{initialsOf(user?.name)}</div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user?.name || 'Account'}</span>
              </button>
              <Link
                href="/settings"
                className="hidden sm:flex p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors min-w-[36px] min-h-[36px] items-center justify-center"
                title="Settings & Privacy"
                aria-label="Settings & Privacy"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="hidden sm:flex p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer min-w-[36px] min-h-[36px] items-center justify-center"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={startPlan}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Start Debt Plan</span>
              </button>
              <button
                type="button"
                onClick={() => openAuth({ mode: 'login' })}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button type="button" onClick={() => openAuth({ mode: 'signup' })} className="btn-primary text-xs !py-1.5 !px-3 sm:!px-4 cursor-pointer font-bold shadow-subtle">
                Get Started
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1.5 shadow-elevated">
          {isLoggedIn ? (
            <>
              <button type="button" onClick={() => { setMobileOpen(false); openProfile(); }} className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 mb-2 text-left cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">{initialsOf(user?.name)}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{user?.name || 'Account'}</div>
                  <div className="text-[11px] text-slate-500">View profile</div>
                </div>
              </button>
              {[...ACCOUNT_LINKS, { href: '/settings', label: 'Account & Privacy Settings', icon: Settings }].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium min-h-[44px] transition-colors ${
                      isActive(item.href) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-500" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => { setMobileOpen(false); signOut(); }}
                className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 mt-2 min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              {PUBLIC_LINKS.map((l) => (
                <button
                  key={l.href}
                  type="button"
                  onClick={() => go(l.href, l.needsAccount)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold min-h-[44px] transition-colors cursor-pointer ${
                    isActive(l.href) ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{l.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
              <div className="pt-3 mt-1 border-t border-slate-100 flex flex-col gap-2">
                <button type="button" onClick={startPlan} className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all min-h-[44px] cursor-pointer">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Start My Free Debt Plan</span>
                </button>
                <button type="button" onClick={() => { setMobileOpen(false); openAuth({ mode: 'login' }); }} className="btn-secondary w-full text-xs !py-3 min-h-[44px] font-bold">
                  Sign In to Account
                </button>
                <button type="button" onClick={() => { setMobileOpen(false); openAuth({ mode: 'signup' }); }} className="btn-primary w-full text-xs !py-3 min-h-[44px] font-bold">
                  Get Started Free
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}

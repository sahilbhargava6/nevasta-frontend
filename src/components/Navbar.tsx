'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { api } from '@/lib/api';

export default function Navbar({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('navesta_user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // server session cleared; clear local storage
    }
    localStorage.removeItem('navesta_user');
    setUser(null);
    router.push('/');
  };

  const isLoggedIn = !!user;

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/loans', label: 'Loans & EMIs', icon: Landmark },
    { href: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
    { href: '/balance-transfer', label: 'Balance Transfer', icon: ArrowLeftRight },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              navesta
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Debt Advisory
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        {isLoggedIn ? (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/about" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Who We Are
            </Link>
            <Link href="/solutions" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Our Solutions
            </Link>
            <Link href="/calculator" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Takeover Calculator
            </Link>
            <Link href="/contact" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Contact Us
            </Link>
          </nav>
        )}

        {/* Right CTA / User State */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <span>{user?.name || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onOpenAuth}
                className="btn-primary text-xs !py-1.5 !px-3.5 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 mb-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">{user?.name || 'User'}</div>
                  <div className="text-[11px] text-slate-500">{user?.email || ''}</div>
                </div>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 mt-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Who We Are
              </Link>
              <Link
                href="/solutions"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Our Solutions
              </Link>
              <Link
                href="/calculator"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Takeover Calculator
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Contact Us
              </Link>
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth?.();
                  }}
                  className="btn-secondary w-full text-xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth?.();
                  }}
                  className="btn-primary w-full text-xs"
                >
                  Get Started
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}

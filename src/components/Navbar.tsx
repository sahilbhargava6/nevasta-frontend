'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { initialsOf, useSession } from '@/components/session/SessionProvider';

/**
 * Site navigation from the design (.l-nav): logo, Who We Are, Our Solutions
 * menu (Debt Management, Life Events Planner), Contact Us, and Login /
 * Get Started or the profile avatar. Account pages also get a second row
 * with their own sections.
 *
 * `onOpenAuth` is accepted for older pages; sign-in now comes from the
 * shared session.
 */

const ACCOUNT_TABS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/loans', label: 'Loans & EMIs' },
  { href: '/credit-cards', label: 'Credit Cards' },
  { href: '/balance-transfer', label: 'Applications' },
  { href: '/statements', label: 'Vault' },
  { href: '/settings', label: 'Settings' },
];

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 1l4 4 4-4" />
  </svg>
);

const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export function SolutionsMenu({ onPick }: { onPick?: () => void }) {
  const router = useRouter();
  const { requireAuth } = useSession();
  const item = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#2A1606', textAlign: 'left' as const };

  return (
    <div style={{ background: '#FFFAF6', border: '1px solid rgba(196,168,130,0.3)', borderRadius: 16, boxShadow: '0 8px 32px rgba(42,22,6,0.15)', overflow: 'hidden', minWidth: 240 }} role="menu">
      <button
        role="menuitem"
        style={item}
        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(201,96,16,0.08)')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
        onClick={() => {
          onPick?.();
          requireAuth('debt-management', () => router.push('/debt-management'));
        }}
      >
        <span style={{ fontSize: 20 }}>💳</span>
        <div>
          <div style={{ fontWeight: 700, color: '#2A1606' }}>Debt Management</div>
          <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', fontWeight: 400 }}>Credit card payoff &amp; loan plans</div>
        </div>
      </button>
      <div style={{ height: 1, background: 'rgba(196,168,130,0.2)', margin: '0 14px' }} />
      <button
        role="menuitem"
        style={item}
        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(201,96,16,0.08)')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
        onClick={() => {
          onPick?.();
          router.push('/life-events');
        }}
      >
        <span style={{ fontSize: 20 }}>🎊</span>
        <div>
          <div style={{ fontWeight: 700, color: '#2A1606' }}>Life Events Planner</div>
          <div style={{ fontSize: 12, color: 'rgba(42,22,6,0.5)', fontWeight: 400 }}>Weddings, education &amp; big milestones</div>
        </div>
      </button>
    </div>
  );
}

/** Who We Are · Our Solutions ▾ · Contact Us (shared by the site nav and journey headers). */
export function NavLinks() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const linkStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' };

  return (
    <div className="l-nav-links">
      <Link className="l-nav-link" href="/about">
        Who We Are
      </Link>
      <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
        <button className="l-nav-link" style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 4 }} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Our Solutions <ChevronDown />
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
            <SolutionsMenu onPick={() => setOpen(false)} />
          </div>
        )}
      </div>
      <Link className="l-nav-link" href="/contact">
        Contact Us
      </Link>
    </div>
  );
}

/** Avatar for signed-in customers, Login / Get Started otherwise. */
export function NavAccount({ compact = false }: { compact?: boolean }) {
  const { user, ready, openAuth, openProfile } = useSession();
  if (!ready) return <div style={{ marginLeft: 'auto', width: 36 }} />;

  if (user) {
    return (
      <div className="l-nav-user" style={{ marginLeft: 'auto', display: 'flex' }}>
        <button className="user-avatar" onClick={openProfile} title="View Profile" aria-label="View profile" style={compact ? { width: 36, height: 36, fontSize: 13 } : undefined}>
          {initialsOf(user.name)}
        </button>
      </div>
    );
  }

  return (
    <div className="l-nav-actions" style={{ marginLeft: 'auto' }}>
      <button className="l-btn-ghost" onClick={() => openAuth({ mode: 'login' })}>
        Login
      </button>
      <button className="l-btn-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} onClick={() => openAuth({ mode: 'signup' })}>
        Get Started <ArrowRight />
      </button>
    </div>
  );
}

export default function Navbar(_props: { onOpenAuth?: () => void } = {}) {
  const pathname = usePathname();
  const { user, openAuth } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onAccountPage = !!user && ACCOUNT_TABS.some((t) => pathname === t.href || pathname.startsWith(t.href + '/'));

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="nv" style={{ position: 'relative', zIndex: 200 }}>
      <nav className="l-nav" aria-label="Main">
        <button className={`l-hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
          <span />
          <span />
          <span />
        </button>
        <Link href="/" title="Go to Home" style={{ cursor: 'pointer' }}>
          <Image src="/design/navesta-logo.png" alt="Navesta" width={168} height={64} style={{ height: 64, width: 'auto', display: 'block' }} priority />
        </Link>
        <NavLinks />
        <NavAccount />
      </nav>

      <div className={`l-mobile-nav${mobileOpen ? ' open' : ''}`}>
        <Link href="/#journeys" onClick={() => setMobileOpen(false)}>
          Journeys
        </Link>
        <Link href="/#how" onClick={() => setMobileOpen(false)}>
          How It Works
        </Link>
        <Link href="/about" onClick={() => setMobileOpen(false)}>
          Who We Are
        </Link>
        <Link href="/life-events" onClick={() => setMobileOpen(false)}>
          Life Events Planner
        </Link>
        <Link href="/contact" onClick={() => setMobileOpen(false)}>
          Contact Us
        </Link>
        {!user && (
          <>
            <a onClick={() => { setMobileOpen(false); openAuth({ mode: 'signup' }); }}>Sign Up Free</a>
            <button className="l-mobile-cta" onClick={() => { setMobileOpen(false); openAuth({ mode: 'signup' }); }}>
              Start Free — No Card Needed
            </button>
          </>
        )}
      </div>

      {/* The design nav is fixed; this keeps page content below it */}
      <div style={{ height: 84 }} aria-hidden />

      {onAccountPage && (
        <div style={{ background: 'rgba(255,250,245,0.97)', borderBottom: '1px solid rgba(196,168,130,0.2)' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 5%' }}>
            {ACCOUNT_TABS.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + '/');
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none', color: active ? '#fff' : '#3A2310', background: active ? 'linear-gradient(135deg,#F09020 0%,#D06000 100%)' : 'transparent' }}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

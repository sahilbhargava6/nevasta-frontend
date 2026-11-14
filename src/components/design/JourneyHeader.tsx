'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavAccount, NavLinks } from '@/components/Navbar';

/**
 * Sticky header of the design's journey screens (dm-page, cc-page, ...):
 * round back button, logo, the three nav links and the profile avatar.
 * Render inside a `.nv` wrapper.
 */
export default function JourneyHeader({ backHref, onBack, minimal = false }: { backHref?: string; onBack?: () => void; minimal?: boolean }) {
  const router = useRouter();
  const back = () => (onBack ? onBack() : backHref ? router.push(backHref) : router.back());

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,250,245,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(196,168,130,0.2)', boxShadow: '0 2px 20px rgba(58,35,16,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 5%', position: 'relative' }}>
        <button
          onClick={back}
          aria-label="Back"
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE0D0', border: '1.5px solid rgba(196,152,100,0.35)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(107,58,42,0.10)' }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#DDD0BE')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#EDE0D0')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B3A2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Link href="/" title="Go to Home" style={{ cursor: 'pointer', flexShrink: 0 }}>
          <Image src="/design/navesta-logo.png" alt="Navesta" width={168} height={64} style={{ height: 64, width: 'auto', display: 'block' }} />
        </Link>
        {!minimal && <NavLinks />}
        <NavAccount compact />
      </div>
    </div>
  );
}

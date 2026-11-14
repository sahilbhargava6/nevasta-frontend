'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearJourneys } from '@/lib/journey';
import AuthDialog from './AuthDialog';
import ProfileModal from './ProfileModal';

/**
 * Signed-in customer + the design's sign-in and profile modals, shared by
 * every page. The session itself is an HTTP-only cookie set by the API; the
 * profile cached in localStorage only drives the UI.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  propertyStatus?: string | null;
  employmentSector?: string | null;
};

/** Where the customer was heading when sign-in was needed (design "intent"). */
export type AuthIntent = 'debt-cc' | 'debt-loan' | 'debt-consolidation' | 'debt-management' | 'ai-feat' | 'emi-calc' | null;

type OpenAuthOptions = {
  mode?: 'signup' | 'login';
  intent?: AuthIntent;
  /** Runs after a successful sign-in / sign-up (e.g. continue the journey). */
  onSuccess?: () => void;
};

type SessionContextValue = {
  user: SessionUser | null;
  ready: boolean;
  openAuth: (options?: OpenAuthOptions) => void;
  /** Run `next` now if signed in, otherwise after sign-up/sign-in. */
  requireAuth: (intent: AuthIntent, next: () => void) => void;
  openProfile: () => void;
  signOut: () => Promise<void>;
  setUser: (user: SessionUser) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = 'navesta_user';

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<(OpenAuthOptions & { open: boolean }) | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUserState(readStoredUser());
    setReady(true);

    // Other tabs, and code that still writes navesta_user directly
    const sync = () => setUserState(readStoredUser());
    window.addEventListener('storage', sync);
    window.addEventListener('navesta:user-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('navesta:user-changed', sync);
    };
  }, []);

  const setUser = useCallback((next: SessionUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUserState(next);
    window.dispatchEvent(new Event('navesta:user-changed'));
  }, []);

  const openAuth = useCallback((options: OpenAuthOptions = {}) => {
    setAuth({ mode: options.mode ?? 'signup', intent: options.intent ?? null, onSuccess: options.onSuccess, open: true });
  }, []);

  const requireAuth = useCallback(
    (intent: AuthIntent, next: () => void) => {
      if (readStoredUser()) {
        next();
      } else {
        openAuth({ mode: 'signup', intent, onSuccess: next });
      }
    },
    [openAuth],
  );

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Session already ended on the server
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('navesta_active_application');
    clearJourneys();
    setUserState(null);
    setProfileOpen(false);
    window.dispatchEvent(new Event('navesta:user-changed'));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, ready, openAuth, requireAuth, openProfile: () => (user ? setProfileOpen(true) : openAuth({ mode: 'login' })), signOut, setUser }),
    [user, ready, openAuth, requireAuth, signOut, setUser],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      {auth?.open && (
        <AuthDialog
          initialMode={auth.mode ?? 'signup'}
          intent={auth.intent ?? null}
          onClose={() => setAuth(null)}
          onSignedIn={(u) => setUser(u)}
          onContinue={(fromWelcome) => {
            const next = auth.onSuccess;
            setAuth(null);
            if (next) next();
            else if (fromWelcome) router.push('/dashboard');
          }}
        />
      )}
      {profileOpen && user && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSignOut={signOut} />}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

export function initialsOf(name: string | undefined | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N';
}

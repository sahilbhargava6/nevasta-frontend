'use client';

import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useSession, type AuthIntent } from '@/components/session/SessionProvider';

/**
 * Journey screens need an account. Opens sign-up once when a signed-out
 * visitor lands here directly, then shows the screen after sign-in.
 */
export default function JourneyGate({ intent, children }: { intent: AuthIntent; children: React.ReactNode }) {
  const { user, ready, openAuth } = useSession();
  const asked = useRef(false);

  useEffect(() => {
    if (ready && !user && !asked.current) {
      asked.current = true;
      openAuth({ mode: 'signup', intent });
    }
  }, [ready, user, intent, openAuth]);

  if (!ready) return <div className="min-h-screen bg-slate-50" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your free account to continue</h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-2 mb-6">Your plan is built from your own numbers, so we keep it in your private account. Free forever, no card needed.</p>
          <button type="button" className="btn-accent w-full sm:w-auto cursor-pointer" onClick={() => openAuth({ mode: 'signup', intent })}>
            Get Started
          </button>
          <p className="text-sm text-slate-600 mt-4">
            Already have an account?{' '}
            <button type="button" className="font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => openAuth({ mode: 'login', intent })}>
              Sign In
            </button>
          </p>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}

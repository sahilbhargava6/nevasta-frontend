'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/session/SessionProvider';

/**
 * Kept for pages that still render <AuthModal isOpen onClose />: opening it
 * shows the shared sign-in (mobile + OTP) from SessionProvider, or takes a
 * customer who is already signed in straight to their debt plan.
 */
export default function AuthModal({ isOpen = true, onClose }: { isOpen?: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, openAuth } = useSession();

  useEffect(() => {
    if (!isOpen) return;
    if (user) router.push('/debt-management');
    else openAuth({ mode: 'signup', intent: 'debt-management', onSuccess: () => router.push('/debt-management') });
    onClose();
  }, [isOpen, user, openAuth, onClose, router]);

  return null;
}

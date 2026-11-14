'use client';

import { useEffect } from 'react';
import { useSession } from '@/components/session/SessionProvider';

/**
 * Kept for pages that still render <AuthModal isOpen onClose />: opening it
 * now shows the shared design sign-in (mobile + OTP) from SessionProvider.
 */
export default function AuthModal({ isOpen = true, onClose }: { isOpen?: boolean; onClose: () => void }) {
  const { openAuth } = useSession();

  useEffect(() => {
    if (isOpen) {
      openAuth({ mode: 'signup' });
      onClose();
    }
  }, [isOpen, openAuth, onClose]);

  return null;
}

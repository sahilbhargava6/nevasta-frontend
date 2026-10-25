'use client';

import { useState, useEffect } from 'react';
import NavaChatWidget from './NavaChatWidget';
import DebtAuditModal from './DebtAuditModal';
import WhatsAppButton from './WhatsAppButton';

export default function GlobalInteractiveWidgets() {
  const [auditOpen, setAuditOpen] = useState(false);
  const [initialDebtType, setInitialDebtType] = useState<'card' | 'loan' | 'both'>('card');

  useEffect(() => {
    const handleOpenAudit = (e: any) => {
      if (e.detail?.debtType) {
        setInitialDebtType(e.detail.debtType);
      }
      setAuditOpen(true);
    };
    window.addEventListener('navesta:open-audit', handleOpenAudit);
    return () => {
      window.removeEventListener('navesta:open-audit', handleOpenAudit);
    };
  }, []);

  return (
    <>
      {/* 30-Second Interactive Debt Audit Modal */}
      <DebtAuditModal
        isOpen={auditOpen}
        initialDebtType={initialDebtType}
        onClose={() => setAuditOpen(false)}
      />

      {/* Floating Interactive Nava AI Advisor */}
      <NavaChatWidget onOpenAudit={() => setAuditOpen(true)} />

      {/* Floating Instant WhatsApp Consultation */}
      <WhatsAppButton variant="floating" />
    </>
  );
}

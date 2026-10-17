'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({
  customMessage,
  variant = 'floating',
  className = '',
}: {
  customMessage?: string;
  variant?: 'floating' | 'inline';
  className?: string;
}) {
  const defaultText =
    "Hello Navesta, I would like to consult with an advisor about a 10.25% credit card takeover / debt consolidation.";
  const text = encodeURIComponent(customMessage || defaultText);
  const waUrl = `https://wa.me/918045689200?text=${text}`;

  if (variant === 'inline') {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all min-h-[44px] ${className}`}
      >
        <MessageCircle className="w-4 h-4 fill-current" />
        <span>Chat on WhatsApp</span>
      </a>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 print:hidden">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with a Debt Specialist on WhatsApp"
        className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 fill-current text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
        </div>
        <span className="hidden sm:inline font-bold text-xs tracking-tight">
          WhatsApp Advisor
        </span>
      </a>
    </div>
  );
}

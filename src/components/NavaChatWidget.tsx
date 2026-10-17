'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'nava' | 'user';
  text: string;
  timestamp: string;
  cta?: {
    label: string;
    action: 'audit' | 'whatsapp' | 'calculator';
  };
}

const PRESET_QUESTIONS = [
  'Can I consolidate cards with a 680 CIBIL score?',
  'Why is the minimum due payment a trap?',
  'How does a 10.25% bank takeover work?',
  'What documents are required for balance transfer?',
];

const KNOWLEDGE_BASE: { keywords: string[]; answer: string; cta?: ChatMessage['cta'] }[] = [
  {
    keywords: ['cibil', 'score', 'credit score', '680', '650', '700', '750'],
    answer:
      'Yes! While Tier-1 banks usually look for a 720+ CIBIL score for prime rates (10.25%–11.5%), we work with partner institutions that approve balance transfers and consolidation facilities for scores between 650 and 700. In fact, consolidating high-utilization credit cards immediately drops your credit utilization to 0%, often boosting your CIBIL score by 30 to 80 points within 60 days.',
    cta: { label: 'Check Your Eligibility (Free)', action: 'audit' },
  },
  {
    keywords: ['minimum', 'trap', 'due', 'revolving', 'compound', '42%'],
    answer:
      'The minimum due (usually 5% of your balance) only covers ongoing interest and taxes, paying down almost ZERO principal. On top of that, Indian banks charge 18% GST on every rupee of interest. A ₹1,00,000 balance paid via minimum dues takes over 14 years and costs over ₹2,80,000 in interest alone. Navesta replaces this with a fixed-tenure institutional loan at 10.25% p.a.',
    cta: { label: 'Calculate Your Freedom Date', action: 'calculator' },
  },
  {
    keywords: ['takeover', 'work', 'balance transfer', 'how it works', 'process', '10.25'],
    answer:
      'In a bank takeover, our partner institutional lender directly settles your high-cost credit cards (24–42% APR) and personal loans (16–28%) on your behalf. All debts are closed out, and you are left with a single, structured personal loan at 10.25%–12.5% p.a. with a predictable EMI and an exact payoff date.',
    cta: { label: 'Start 30-Sec Debt Audit', action: 'audit' },
  },
  {
    keywords: ['document', 'documents', 'paperwork', 'kyc', 'salary', 'payslip'],
    answer:
      'The process is 100% digital. You typically need: 1) PAN & Aadhaar (e-KYC), 2) Last 3 months bank statements (via RBI Account Aggregator or net banking upload), and 3) Latest card statements or loan sanction letters. Disbursal and direct card settlement takes 24 to 48 hours.',
    cta: { label: 'Talk to an Advisor on WhatsApp', action: 'whatsapp' },
  },
  {
    keywords: ['gst', 'tax', 'hidden', 'fee', 'charge'],
    answer:
      'Under Indian tax law, credit card finance charges (interest) and late fees attract 18% GST. That means a 42% APR effectively costs you nearly 49.56% annually! With a bank takeover loan, GST applies only once on the minimal upfront processing fee (0.5%–1%), and never on monthly interest payments, saving you thousands every month.',
    cta: { label: 'Run Savings Simulation', action: 'calculator' },
  },
  {
    keywords: ['emi', 'salary', 'burden', 'cash flow', 'relief'],
    answer:
      'By consolidating multiple EMIs into a single 10.25% loan with an extended tenure (up to 5 years), borrowers typically lower their monthly repayment burden by 40% to 65%. This immediately restores cash flow so your salary lasts through the month.',
    cta: { label: 'Audit Your Debts (30 Sec)', action: 'audit' },
  },
];

export default function NavaChatWidget({
  onOpenAudit,
}: {
  onOpenAudit?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'nava',
      text: 'Hello! I am Nava, your AI Debt & Takeover Advisor. How can I assist you with your loans or credit card balances today?',
      timestamp: 'Just now',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // AI answer generation with slight realistic pause
    setTimeout(() => {
      const qLower = query.toLowerCase();
      let matched = KNOWLEDGE_BASE.find((item) =>
        item.keywords.some((kw) => qLower.includes(kw))
      );

      let replyText = '';
      let replyCta = matched?.cta;

      if (matched) {
        replyText = matched.answer;
      } else {
        replyText = `That is an important question. Navesta specializes in restructuring high-interest unsecured debts (credit cards at 24–42% and costly personal loans) into institutional bank takeover facilities starting at 10.25% p.a. Would you like a personalized 30-second audit of your outstanding balances?`;
        replyCta = { label: 'Start 30-Sec Debt Audit', action: 'audit' };
      }

      const botMsg: ChatMessage = {
        id: `nava-${Date.now()}`,
        sender: 'nava',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cta: replyCta,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleCtaClick = (action: 'audit' | 'whatsapp' | 'calculator') => {
    if (action === 'audit') {
      setIsOpen(false);
      onOpenAudit?.();
    } else if (action === 'whatsapp') {
      window.open(
        'https://wa.me/918045689200?text=' +
          encodeURIComponent(
            "Hello Navesta, I'd like to consult with an advisor regarding a 10.25% debt consolidation / bank takeover."
          ),
        '_blank'
      );
    } else if (action === 'calculator') {
      setIsOpen(false);
      window.location.href = '/calculator';
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end print:hidden">
        {!isOpen && hasUnread && (
          <div className="mb-2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">Ask Nava AI anything</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Nava AI Debt Advisor"
          className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-white" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              )}
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[82vh] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 print:hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">Nava AI</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    ADVISOR
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  Online • Institutional Takeovers
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'nava' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-subtle ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {m.cta && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleCtaClick(m.cta!.action)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg transition-colors w-full justify-center"
                      >
                        <span>{m.cta.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-slate-100 border-t border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
              <span>Suggested Questions</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about interest, CIBIL, takeovers..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

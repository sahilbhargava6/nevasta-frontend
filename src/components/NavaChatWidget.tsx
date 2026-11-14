'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/**
 * Floating Nava chat from the design landing page (FAB "N" + .land-chat-panel,
 * Navesta_Website_22Sep26.html ~1846–1880) with the keyword replies of
 * `sendLandChat` (~4398). Replies that suggest starting a plan offer a button
 * into the debt journey (`onOpenAudit`) or a link to the Life Events Planner.
 */

type Action = 'debt' | 'life';
type Msg = { id: number; from: 'ai' | 'user'; text: string; actions?: Action[] };

const GREETING = "👋 Hi! I'm Nava, your AI financial co-pilot. Ask me about debt management, life events planning, EMIs, or CIBIL scores!";

const CHIPS = [
  { label: 'Get debt-free faster', msg: 'How do I get debt-free faster?' },
  { label: 'Wedding budget', msg: 'Plan my wedding budget' },
  { label: 'Improve CIBIL', msg: 'How to improve CIBIL?' },
  { label: 'Avalanche method', msg: 'What is Avalanche method?' },
];

function replyFor(text: string): { text: string; actions?: Action[] } {
  const tl = text.toLowerCase();
  if (tl.includes('debt') || tl.includes('faster') || tl.includes('emi') || tl.includes('loan'))
    return {
      text: '💡 The fastest way to get debt-free is the Avalanche method — pay minimums on all loans, then throw extra money at the highest-interest one. Navesta calculates this for you automatically. Start your Debt Journey to see your personalised plan!',
      actions: ['debt'],
    };
  if (tl.includes('wedding') || tl.includes('marriage') || tl.includes('life') || tl.includes('budget'))
    return {
      text: "💒 Start planning your wedding early — even ₹10,000/month invested 24 months before saves you from emergency loans. Navesta's Life Events Planner builds a personalised savings roadmap for every milestone!",
      actions: ['life'],
    };
  if (tl.includes('cibil') || tl.includes('credit') || tl.includes('score'))
    return { text: '📊 To improve your CIBIL score: keep credit card usage below 30%, never miss EMIs, and avoid multiple loan applications in a short period. A score above 750 unlocks the best loan rates in India!' };
  if (tl.includes('avalanche') || tl.includes('method') || tl.includes('strategy'))
    return {
      text: "🏔️ The Avalanche method = pay minimums on ALL loans, then put every extra rupee toward the loan with the HIGHEST interest rate. Once that's cleared, attack the next. This saves the most interest — sometimes ₹50,000+ over a few years!",
      actions: ['debt'],
    };
  if (tl.includes('travel') || tl.includes('education') || tl.includes('school') || tl.includes('college'))
    return {
      text: "✈️ Planning a big life event? The key is starting early. Navesta's Life Planner calculates exactly how much to save monthly so you're fully funded when the moment arrives — no loans needed!",
      actions: ['life'],
    };
  return {
    text: 'Great question! Navesta can help you with that. Start your journey by choosing Debt Management or Life Events planning below.',
    actions: ['debt', 'life'],
  };
}

const actionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 13px',
  background: 'linear-gradient(135deg,#F09020,#E07C10)',
  border: 'none',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export default function NavaChatWidget({ onOpenAudit }: { onOpenAudit: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'ai', text: GREETING }]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text) return;
    setInput('');
    setMsgs((m) => [...m, { id: nextId.current++, from: 'user', text }]);
    const reply = replyFor(text);
    timers.current.push(
      window.setTimeout(() => {
        setMsgs((m) => [...m, { id: nextId.current++, from: 'ai', ...reply }]);
      }, 600),
    );
  };

  const startDebt = () => {
    setOpen(false);
    onOpenAudit();
  };

  return (
    <div className="nv">
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} title="Chat with Nava AI" aria-label={open ? 'Close Nava chat' : 'Chat with Nava AI'} aria-expanded={open} aria-controls="land-chat-panel">
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <span style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>N</span>
        )}
      </button>

      <div className={`land-chat-panel${open ? ' open' : ''}`} id="land-chat-panel" role="dialog" aria-label="Nava — AI Assistant" aria-hidden={!open} inert={!open} style={{ maxWidth: 'calc(100vw - 32px)' }}>
        <div className="lcp-header">
          <div className="lcp-avatar" aria-hidden>🤖</div>
          <div>
            <div className="lcp-title">Nava — AI Assistant</div>
            <div className="lcp-sub">Ask me anything about your finances</div>
          </div>
          <button className="lcp-close" onClick={() => setOpen(false)} aria-label="Close chat">
            ✕
          </button>
        </div>

        <div className="lcp-msgs" ref={listRef} aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'ai' ? 'flex-start' : 'flex-end', gap: 8 }}>
              <div className={`lcp-bubble ${m.from}`}>{m.text}</div>
              {m.actions && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {m.actions.includes('debt') && (
                    <button style={actionStyle} onClick={startDebt}>
                      Start My Debt Journey →
                    </button>
                  )}
                  {m.actions.includes('life') && (
                    <Link href="/life-events" style={actionStyle} onClick={() => setOpen(false)}>
                      Open Life Events Planner →
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lcp-chips">
          {CHIPS.map((c) => (
            <button key={c.label} className="lcp-chip" onClick={() => send(c.msg)}>
              {c.label}
            </button>
          ))}
        </div>

        <form
          className="lcp-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send();
            inputRef.current?.focus();
          }}
        >
          <input ref={inputRef} className="lcp-input" placeholder="Ask Nava anything…" aria-label="Ask Nava anything" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="lcp-send" type="submit" aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" aria-hidden>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

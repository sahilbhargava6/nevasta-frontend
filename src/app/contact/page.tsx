'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useSession } from '@/components/session/SessionProvider';
import { api } from '@/lib/api';

/** Contact Us (design #contact-page) plus a message form that posts to /inquiries. */

const INQUIRY_TYPES = [
  'General Inquiry',
  'Credit Card Takeover',
  'Multi-Loan Consolidation',
  'Life Event Planning',
  'Nava AI Payoff Plan Inquiry',
  'Bank / Institutional Partnership',
  'Grievance / Privacy Redressal',
];

const EMPTY_FORM = { name: '', email: '', phone: '', inquiryType: INQUIRY_TYPES[0], message: '' };

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(196,168,130,0.3)', borderRadius: 20, padding: 28, backdropFilter: 'blur(8px)', display: 'block', textDecoration: 'none' };
const cardIcon = (bg: string): React.CSSProperties => ({ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 });
const cardLabel: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'rgba(42,22,6,0.45)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 6 };
const cardSub: React.CSSProperties = { fontSize: 13, color: 'rgba(42,22,6,0.5)', marginTop: 4 };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.6px', color: '#8A6A3A', textTransform: 'uppercase', marginBottom: 6 };
const field: React.CSSProperties = { width: '100%', border: '1.5px solid rgba(196,168,130,0.4)', borderRadius: 12, padding: '12px 14px', fontSize: 15, fontFamily: 'var(--sans)', color: '#2A1606', background: '#FFFCF8', outline: 'none', minHeight: 46, boxSizing: 'border-box' };

export default function ContactPage() {
  const { user } = useSession();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed-in customers: start from their own name and email
  useEffect(() => {
    if (!user) return;
    setFormData((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '', phone: f.phone || user.phone || '' }));
  }, [user]);

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/inquiries', formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nv" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF8F2 0%,#FFF0E3 50%,#FDE8D0 100%)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
      <Navbar />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 5% 100px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,96,16,0.1)', border: '1px solid rgba(201,96,16,0.2)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 13 }} aria-hidden>📞</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#7C3200', textTransform: 'uppercase' }}>Contact Us</span>
        </div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,6vw,42px)', fontWeight: 900, lineHeight: 1.15, color: '#2A1606', margin: '0 0 12px' }}>
          We&apos;d love to <span style={{ color: '#C96010' }}>hear from you</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(42,22,6,0.6)', lineHeight: 1.7, margin: '0 0 40px' }}>
          Whether you have a question, feedback, or just want to say hello — our team is here.
        </p>

        {/* Contact cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 36 }}>
          <a href="mailto:support@navesta.in" style={card}>
            <div style={cardIcon('linear-gradient(135deg,#FDE8D0,#F5C89A)')} aria-hidden>✉</div>
            <div style={cardLabel}>Email</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2A1606' }}>support@navesta.in</div>
            <div style={cardSub}>We reply within 24 hours</div>
          </a>

          <a href="tel:18001233328" style={card}>
            <div style={cardIcon('linear-gradient(135deg,#E8F5FF,#B3D9F5)')} aria-hidden>📞</div>
            <div style={cardLabel}>Helpline</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2A1606' }}>1800-123-3328</div>
            <div style={cardSub}>Mon – Sat, 9 AM – 6 PM IST</div>
          </a>

          <div style={card}>
            <div style={cardIcon('linear-gradient(135deg,#F0FBF0,#B3E6B3)')} aria-hidden>📍</div>
            <div style={cardLabel}>Office</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2A1606' }}>Mumbai, India</div>
            <div style={cardSub}>Fintech Hub, BKC</div>
          </div>
        </div>

        {/* Message form */}
        <section aria-labelledby="contact-form-title" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(196,168,130,0.3)', borderRadius: 20, padding: 'clamp(20px,5vw,28px)', backdropFilter: 'blur(8px)', marginBottom: 36 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }} role="status">
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }} aria-hidden>✓</div>
              <h2 id="contact-form-title" style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 900, color: '#2A1606', margin: '0 0 8px' }}>Message received</h2>
              <p style={{ fontSize: 14, color: 'rgba(42,22,6,0.65)', lineHeight: 1.7, margin: '0 auto 20px', maxWidth: 420 }}>
                Thank you for reaching out, {formData.name || 'there'}. Our team will get back to you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ ...EMPTY_FORM, name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' });
                }}
                style={{ background: '#fff', color: '#C96010', border: '1.5px solid #C96010', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)', cursor: 'pointer' }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 id="contact-form-title" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,4vw,24px)', fontWeight: 800, color: '#2A1606', margin: '0 0 6px' }}>Send us a message</h2>
              <p style={{ fontSize: 13, color: 'rgba(42,22,6,0.55)', lineHeight: 1.6, margin: '0 0 20px' }}>Tell us what you need help with and we&apos;ll get back to you shortly.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label htmlFor="contact-name" style={fieldLabel}>Full name *</label>
                  <input id="contact-name" type="text" required maxLength={120} autoComplete="name" value={formData.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" style={field} />
                </div>
                <div>
                  <label htmlFor="contact-phone" style={fieldLabel}>Phone number *</label>
                  <input id="contact-phone" type="tel" required maxLength={30} autoComplete="tel" value={formData.phone} onChange={set('phone')} placeholder="+91 98765 43210" style={field} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="contact-email" style={fieldLabel}>Email address *</label>
                <input id="contact-email" type="email" required maxLength={120} autoComplete="email" value={formData.email} onChange={set('email')} placeholder="rahul@example.com" style={field} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="contact-type" style={fieldLabel}>Topic</label>
                <select id="contact-type" value={formData.inquiryType} onChange={set('inquiryType')} style={field}>
                  {INQUIRY_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="contact-message" style={fieldLabel}>Your message *</label>
                <textarea id="contact-message" required minLength={5} maxLength={5000} rows={5} value={formData.message} onChange={set('message')} placeholder="Tell us about your question, your loans or cards, or your plan…" style={{ ...field, resize: 'vertical', minHeight: 120 }} />
              </div>

              {error && (
                <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#B91C1C', marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#C96010,#EA8820)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 18px', fontSize: 15, fontWeight: 700, fontFamily: 'var(--sans)', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, boxShadow: '0 6px 20px rgba(201,96,16,0.3)' }}
              >
                {loading ? 'Sending…' : 'Send message →'}
              </button>
            </form>
          )}
        </section>

        {/* Quick message note */}
        <div style={{ background: 'rgba(201,96,16,0.06)', border: '1px solid rgba(201,96,16,0.18)', borderRadius: 16, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden>💡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2A1606', marginBottom: 4 }}>Got a finance question?</div>
            <div style={{ fontSize: 13, color: 'rgba(42,22,6,0.65)', lineHeight: 1.6 }}>
              Our AI assistant is available 24/7 in the app. For account or billing queries, reach out to us at <strong>support@navesta.in</strong> and we&apos;ll get back to you shortly.
            </div>
          </div>
        </div>

        {/* Required by the DPDP Act: a published contact for privacy and grievance requests */}
        <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(42,22,6,0.6)', lineHeight: 1.6, textAlign: 'center' }}>
          Privacy requests and grievances (access, correction, erasure, consent withdrawal):{' '}
          <a href="mailto:grievance@navesta.in" style={{ color: '#D96010', fontWeight: 700 }}>grievance@navesta.in</a>
        </p>
      </div>
    </div>
  );
}

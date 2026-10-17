'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Send,
} from 'lucide-react';

export default function ContactPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Takeover / Refinancing',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>WE ARE HERE TO HELP • BENGALURU, INDIA</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
            Contact the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700">
              Navesta Team
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have a question about your debt takeover, institutional lending partners, or borrower data protection? Our advisory and grievance team responds within 24 business hours.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Contact Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Thank you for reaching out, {formData.name || 'there'}. A member of our debt advisory team will review your inquiry and respond within 24 business hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        inquiryType: 'Takeover / Refinancing',
                        message: '',
                      });
                    }}
                    className="btn-secondary text-xs font-semibold mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Send Us an Inquiry
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-base sm:text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-base sm:text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rahul@example.com"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-base sm:text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-base sm:text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 min-h-[44px]"
                    >
                      <option>Credit Card Takeover</option>
                      <option>Multi-Loan Consolidation</option>
                      <option>Nava AI Payoff Plan Inquiry</option>
                      <option>Bank / Institutional Partnership</option>
                      <option>Grievance / Privacy Redressal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Message
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your current loan balances or questions..."
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-base sm:text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-accent !py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Office Information & Channels */}
            <div className="lg:col-span-5 space-y-6">
              {/* Direct Channels */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Direct Channels
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Borrower Support</div>
                      <a href="mailto:support@navesta.in" className="text-blue-600 hover:underline">
                        support@navesta.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Bank &amp; NBFC Partnerships</div>
                      <a href="mailto:partnerships@navesta.in" className="text-blue-600 hover:underline">
                        partnerships@navesta.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Grievance &amp; DPDP Officer</div>
                      <a href="mailto:grievance@navesta.in" className="text-blue-600 hover:underline">
                        grievance@navesta.in
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Location */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-700" />
                  <h3 className="text-base font-bold text-slate-900">Registered Office</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Navesta Technologies Private Limited<br />
                  Level 4, Prestige Meridian, M.G. Road,<br />
                  Bengaluru, Karnataka 560001, India
                </p>
                <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Monday – Friday: 9:30 AM to 6:30 PM IST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Landmark,
  BadgePercent,
  Clock,
  Sparkles,
} from 'lucide-react';

const LENDERS = [
  {
    name: 'HDFC Bank',
    type: 'Scheduled Commercial Bank',
    startingRate: '10.25% p.a.',
    disbursal: '24–48 Hours',
    features: 'Zero foreclosure penalty after 12 months, direct card settlement',
  },
  {
    name: 'ICICI Bank',
    type: 'Scheduled Commercial Bank',
    startingRate: '10.50% p.a.',
    disbursal: '24 Hours',
    features: 'Pre-approved digital paperless sanction, competitive balance transfer',
  },
  {
    name: 'Axis Bank',
    type: 'Scheduled Commercial Bank',
    startingRate: '10.49% p.a.',
    disbursal: '48 Hours',
    features: 'Flexible tenure up to 60 months, multi-loan consolidation',
  },
  {
    name: 'IDFC FIRST Bank',
    type: 'Scheduled Commercial Bank',
    startingRate: '10.75% p.a.',
    disbursal: '24 Hours',
    features: 'Zero prepayment charges on floating facilities, transparent fees',
  },
  {
    name: 'Tata Capital',
    type: 'Systemically Important NBFC',
    startingRate: '10.99% p.a.',
    disbursal: 'Same Day',
    features: 'Relaxed CIBIL criteria (650+), rapid payout to card accounts',
  },
  {
    name: 'Kotak Mahindra Bank',
    type: 'Scheduled Commercial Bank',
    startingRate: '10.75% p.a.',
    disbursal: '24 Hours',
    features: 'High loan-to-value consolidation up to ₹25 Lakhs',
  },
];

export default function PartnerShowcase() {
  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Institutional Lending Network</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Backed by India&apos;s Leading Regulated Banks &amp; NBFCs
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Navesta does not lend from its own balance sheet. We act as an institutional borrower advocate connecting you directly with RBI-regulated Scheduled Commercial Banks and Tier-1 NBFCs.
          </p>
        </div>

        {/* Lenders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {LENDERS.map((lender) => (
            <div
              key={lender.name}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{lender.name}</h3>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {lender.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Starting At
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {lender.startingRate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Disbursal Speed
                    </span>
                    <span className="text-sm font-extrabold text-blue-700">
                      {lender.disbursal}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{lender.features}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  RBI Regulated
                </span>
                <span>Zero Advance Fee</span>
              </div>
            </div>
          ))}
        </div>

        {/* Regulatory Trust Seal Box */}
        <div className="mt-10 max-w-4xl mx-auto bg-white rounded-2xl p-5 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-600">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-900 text-sm">
              Strict Adherence to RBI Digital Lending Directions (2022)
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Navesta operates strictly as a digital Lending Service Provider (LSP). Loan disbursements and card settlements occur directly between the regulated bank/NBFC and borrower credit card accounts. Navesta never collects deposits or handles borrower loan capital.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

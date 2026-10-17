'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { CreditCard as CardIcon, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AddCreditCardPage() {
  const router = useRouter();

  const [bankName, setBankName] = useState('HDFC Bank');
  const [cardName, setCardName] = useState('');
  const [lastFour, setLastFour] = useState('4321');
  const [creditLimitRupees, setCreditLimitRupees] = useState(200000);
  const [outstandingRupees, setOutstandingRupees] = useState(75000);
  const [aprPercent, setAprPercent] = useState(42);
  const [minPaymentRupees, setMinPaymentRupees] = useState(3750);
  const [dueDay, setDueDay] = useState(15);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/credit-cards', {
        bankName,
        cardName,
        lastFour,
        creditLimitRupees: Number(creditLimitRupees),
        outstandingRupees: Number(outstandingRupees),
        aprPercent: Number(aprPercent),
        minPaymentRupees: Number(minPaymentRupees),
        dueDay: Number(dueDay),
      });

      router.push('/credit-cards');
    } catch (err: any) {
      setError(err.message || 'Failed to add credit card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/credit-cards"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Credit Cards
        </Link>

        <div className="card-fintech p-6 sm:p-8 space-y-6 bg-white shadow-card">
          <div className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <CardIcon className="w-4 h-4" />
              <span>CARD ONBOARDING</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Add Revolving Credit Line</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter statement parameters to calculate exact balance transfer savings and optimize your payoff priority.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Card Issuer Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="SBI Card">SBI Card</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra">Kotak Mahindra Bank</option>
                  <option value="IndusInd Bank">IndusInd Bank</option>
                  <option value="RBL Bank">RBL Bank</option>
                  <option value="Other">Other Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Card Variant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Millennia, Regalia, SimplyCLICK"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={lastFour}
                  onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sanctioned Limit (₹)</label>
                <input
                  type="number"
                  required
                  value={creditLimitRupees}
                  onChange={(e) => setCreditLimitRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Outstanding Balance (₹)</label>
                <input
                  type="number"
                  required
                  value={outstandingRupees}
                  onChange={(e) => setOutstandingRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-rose-600 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Annual APR (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={aprPercent}
                  onChange={(e) => setAprPercent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Min Due Amount (₹)</label>
                <input
                  type="number"
                  value={minPaymentRupees}
                  onChange={(e) => setMinPaymentRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing Due Day (1–31)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? 'Registering Card...' : 'Register Credit Card to Portfolio'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

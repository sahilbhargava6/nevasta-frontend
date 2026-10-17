'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Landmark, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AddLoanPage() {
  const router = useRouter();

  const [lenderName, setLenderName] = useState('Bajaj Finserv');
  const [loanType, setLoanType] = useState<'personal' | 'home' | 'auto' | 'education' | 'other'>('personal');
  const [principalRupees, setPrincipalRupees] = useState(500000);
  const [outstandingRupees, setOutstandingRupees] = useState(380000);
  const [interestRatePercent, setInterestRatePercent] = useState(14.5);
  const [emiRupees, setEmiRupees] = useState(17250);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [tenureRemainingMonths, setTenureRemainingMonths] = useState(24);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/loans', {
        lenderName,
        loanType,
        principalRupees: Number(principalRupees),
        outstandingRupees: Number(outstandingRupees),
        interestRatePercent: Number(interestRatePercent),
        emiRupees: Number(emiRupees),
        tenureMonths: Number(tenureMonths),
        tenureRemainingMonths: Number(tenureRemainingMonths),
      });

      router.push('/loans');
    } catch (err: any) {
      setError(err.message || 'Failed to add loan account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Loans Portfolio
        </Link>

        <div className="card-fintech p-6 sm:p-8 space-y-6 bg-white shadow-card">
          <div className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Landmark className="w-4 h-4" />
              <span>LOAN ONBOARDING</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Add Term Loan Account</h1>
            <p className="text-xs text-slate-500 mt-1">
              Provide loan parameters to enable automated amortization modeling and balance takeover analysis.
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lender Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bajaj Finserv, HDFC Bank, Tata Capital"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Facility Type</label>
                <select
                  value={loanType}
                  onChange={(e: any) => setLoanType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                >
                  <option value="personal">Personal Loan</option>
                  <option value="home">Home Loan</option>
                  <option value="auto">Auto / Vehicle Loan</option>
                  <option value="education">Education Loan</option>
                  <option value="other">Other Term Debt</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Original Principal (₹)</label>
                <input
                  type="number"
                  required
                  value={principalRupees}
                  onChange={(e) => setPrincipalRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Balance Outstanding (₹)</label>
                <input
                  type="number"
                  required
                  value={outstandingRupees}
                  onChange={(e) => setOutstandingRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Annual Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={interestRatePercent}
                  onChange={(e) => setInterestRatePercent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly EMI Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={emiRupees}
                  onChange={(e) => setEmiRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Original Tenure (Months)</label>
                <input
                  type="number"
                  required
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Remaining Tenure (Months)</label>
                <input
                  type="number"
                  required
                  value={tenureRemainingMonths}
                  onChange={(e) => setTenureRemainingMonths(Number(e.target.value))}
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
                {loading ? 'Registering Facility...' : 'Register Loan Account to Portfolio'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

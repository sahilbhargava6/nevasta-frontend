'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Landmark, Plus, ArrowRight, Calendar, Trash2, PieChart } from 'lucide-react';
import { api } from '@/lib/api';
import AmortizationModal from '@/components/AmortizationModal';
import LoanAnalysisModal from '@/components/LoanAnalysisModal';
import { toast } from 'sonner';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [analysisLoanId, setAnalysisLoanId] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/loans');
      setLoans(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch loans:', err);
      toast.error('Failed to load loan accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoan = async (id: string, lenderName: string) => {
    if (!confirm(`Are you sure you want to delete ${lenderName} loan?`)) return;
    try {
      await api.delete(`/loans/${id}`);
      toast.success(`${lenderName} loan deleted successfully`);
      fetchLoans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete loan');
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="card-fintech p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <Landmark className="w-4 h-4 text-blue-600" />
              <span>TERM DEBT PORTFOLIO</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Loans &amp; EMIs</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal loans, consumer credit, and vehicle finance schedules under active amortization.
            </p>
          </div>

          <Link href="/loans/add" className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Loan Account</span>
          </Link>
        </div>

        {loading ? (
          <div className="card-fintech text-center py-16 text-xs text-slate-500">Loading loan accounts...</div>
        ) : loans.length === 0 ? (
          <div className="card-fintech text-center py-16 p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Active Loan Accounts</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your personal or term loans to run automated amortization calculations and unlock direct bank-to-bank takeover savings.
            </p>
            <Link href="/loans/add" className="btn-primary text-xs !py-2.5 !px-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Loan</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="card-fintech p-6 space-y-5 hover:border-slate-300 transition-colors shadow-subtle bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge-slate text-[10px] uppercase font-bold tracking-wider">
                      {loan.loanType} Loan
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{loan.lenderName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sanctioned Principal: ₹{loan.principalRupees.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="badge-amber font-bold text-xs tabular-nums">
                      {loan.interestRatePercent}% p.a.
                    </span>
                    <button
                      onClick={() => handleDeleteLoan(loan.id, loan.lenderName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Loan"
                      aria-label="Delete Loan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Current Balance</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                      ₹{loan.outstandingRupees.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Monthly Outflow</span>
                    <div className="text-lg font-bold text-blue-700 mt-0.5 tabular-nums">
                      ₹{loan.emiRupees.toLocaleString('en-IN')}/mo
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    Tenure: {loan.tenureRemainingMonths} of {loan.tenureMonths} mos remaining
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedLoanId(loan.id)}
                      className="text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Amortization</span>
                    </button>

                    <button
                      onClick={() => setAnalysisLoanId(loan.id)}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Takeover Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Amortization Schedule Modal */}
      <AmortizationModal loanId={selectedLoanId} onClose={() => setSelectedLoanId(null)} />

      {/* Loan Takeover Analysis Modal */}
      <LoanAnalysisModal loanId={analysisLoanId} onClose={() => setAnalysisLoanId(null)} />
    </div>
  );
}

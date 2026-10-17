'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface LoanAnalysisModalProps {
  loanId: string | null;
  onClose: () => void;
}

export default function LoanAnalysisModal({ loanId, onClose }: LoanAnalysisModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loanId) return;
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: any = await api.get(`/loans/${loanId}/analysis`);
        setData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load loan analysis');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [loanId]);

  if (!loanId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-elevated flex flex-col overflow-hidden max-h-[94vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Balance Takeover Analysis</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">
              {data ? `${data.lenderName} Refinancing Model` : 'Loan Prepayment & Takeover'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500">
              Querying institutional benchmark rates and calculating amortization...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-xs text-rose-600 font-semibold">{error}</div>
          ) : data ? (
            <>
              {/* Highlight Net Savings Banner */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Net Projected Savings
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-0.5 tabular-nums">
                    ₹{data.totalBtSavingsEstimateRupees.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Net interest saved over {data.tenureRemainingMonths} remaining months (net of processing fees).
                  </p>
                </div>
                <div className="badge-emerald font-bold self-start sm:self-auto flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-₹{data.monthlySavingsRupees.toLocaleString('en-IN')}/mo EMI</span>
                </div>
              </div>

              {/* Rate Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Current Facility
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                    {data.interestRatePercent}% p.a.
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Outstanding:</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        ₹{data.outstandingRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Interest:</span>
                      <span className="font-semibold text-rose-600 tabular-nums">
                        ₹{data.totalRemainingInterestRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">
                      Partner Benchmark
                    </span>
                    <span className="badge-blue text-[10px]">
                      {data.benchmarkLenderName || 'SBI / HDFC'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-blue-700 mt-1 tabular-nums">
                    {data.benchmarkRatePercent}% p.a.
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">New Monthly EMI:</span>
                      <span className="font-semibold text-blue-800 tabular-nums">
                        ₹{data.newEmiRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Est. Processing Fee:</span>
                      <span className="font-medium text-slate-700 tabular-nums">
                        ₹{data.processingFeeRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <Link
                  href={`/balance-transfer`}
                  onClick={onClose}
                  className="btn-primary w-full sm:flex-1 text-xs !py-2.5 flex items-center justify-center gap-1.5"
                >
                  <span>Apply for Takeover</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary w-full sm:w-auto text-xs !py-2.5 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

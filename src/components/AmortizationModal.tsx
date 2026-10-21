'use client';

import { useState, useEffect } from 'react';
import { X, ShieldCheck, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { exportAmortizationPDF } from '@/utils/pdfExport';

interface AmortizationModalProps {
  loanId: string | null;
  onClose: () => void;
}

export default function AmortizationModal({ loanId, onClose }: AmortizationModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loanId) return;
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/solutions/amortization/${loanId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [loanId]);

  if (!loanId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-elevated flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 sm:p-5 bg-slate-900 text-white gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Amortization Schedule</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-0.5 truncate">
              {data ? `${data.lenderName} (${data.loanType} Loan)` : 'Repayment Schedule'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={() => exportAmortizationPDF(data)}
                className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Export PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 flex-1 overflow-y-auto space-y-4 sm:space-y-5">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500">
              Generating month-by-month principal and interest breakdown...
            </div>
          ) : error ? (
            <div className="text-center py-16 text-xs text-rose-600 font-semibold">{error}</div>
          ) : data ? (
            <>
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">Principal Amount</div>
                  <div className="font-bold text-base text-slate-900 mt-0.5 tabular-nums">
                    ₹{data.principalRupees.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">Interest Rate</div>
                  <div className="font-bold text-base text-rose-600 mt-0.5 tabular-nums">
                    {data.annualRatePercent}% p.a.
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">Monthly EMI</div>
                  <div className="font-bold text-base text-blue-700 mt-0.5 tabular-nums">
                    ₹{data.emiRupees.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">Total Interest Cost</div>
                  <div className="font-bold text-base text-slate-900 mt-0.5 tabular-nums">
                    ₹{data.totalInterestRupees.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-subtle">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5">Month</th>
                        <th className="py-2.5 px-3.5">Opening Balance</th>
                        <th className="py-2.5 px-3.5">Monthly EMI</th>
                        <th className="py-2.5 px-3.5 text-rose-600">Interest Component</th>
                        <th className="py-2.5 px-3.5 text-emerald-700">Principal Component</th>
                        <th className="py-2.5 px-3.5">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {data.schedule.map((row: any) => (
                        <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3.5 font-medium text-slate-500">M{row.month}</td>
                          <td className="py-2 px-3.5 tabular-nums">₹{row.openingBalanceRupees.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3.5 font-medium tabular-nums">₹{row.emiRupees.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3.5 text-rose-600 tabular-nums">
                            ₹{row.interestComponentRupees.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3.5 text-emerald-700 tabular-nums">
                            ₹{row.principalComponentRupees.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3.5 font-semibold text-slate-900 tabular-nums">
                            ₹{row.closingBalanceRupees.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

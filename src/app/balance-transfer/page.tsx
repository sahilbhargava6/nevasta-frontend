'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  Sparkles,
  Calculator,
  CheckCircle2,
  FileText,
  Clock,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function BalanceTransferPage() {
  const [activeTab, setActiveTab] = useState<'offers' | 'applications'>('offers');
  const [outstandingRupees, setOutstandingRupees] = useState(300000);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [lenderType, setLenderType] = useState<'all' | 'bank' | 'nbfc'>('all');

  const [offers, setOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);

  // The customer's cards and loans; an application must name the account being transferred
  const [debts, setDebts] = useState<
    { key: string; kind: 'card' | 'loan'; id: string; label: string; outstandingRupees: number; ratePercent: number }[]
  >([]);
  const [selectedDebt, setSelectedDebt] = useState<string>('');

  useEffect(() => {
    Promise.all([api.get('/credit-cards'), api.get('/loans')])
      .then(([cards, loans]: any[]) => {
        const list = [
          ...(cards.data || []).map((c: any) => ({
            key: `card:${c.id}`,
            kind: 'card' as const,
            id: c.id,
            label: `${c.bankName} ${c.cardName}`,
            outstandingRupees: c.outstandingRupees,
            ratePercent: c.aprPercent,
          })),
          ...(loans.data || []).map((l: any) => ({
            key: `loan:${l.id}`,
            kind: 'loan' as const,
            id: l.id,
            label: `${l.lenderName} (${l.loanType})`,
            outstandingRupees: l.outstandingRupees,
            ratePercent: l.interestRatePercent,
          })),
        ].filter((d) => d.outstandingRupees > 0);
        list.sort((a, b) => b.ratePercent - a.ratePercent);
        setDebts(list);
        if (list.length > 0) {
          setSelectedDebt(list[0].key);
          setOutstandingRupees(list[0].outstandingRupees);
        }
      })
      .catch((err) => console.error('Failed to load accounts:', err));
  }, []);

  const chooseDebt = (key: string) => {
    setSelectedDebt(key);
    const debt = debts.find((d) => d.key === key);
    if (debt) setOutstandingRupees(debt.outstandingRupees);
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const typeParam = lenderType !== 'all' ? `&type=${lenderType}` : '';
      const res: any = await api.get(
        `/bt/offers?outstandingRupees=${outstandingRupees}&tenureMonths=${tenureMonths}${typeParam}`
      );
      setOffers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch BT offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res: any = await api.get('/bt/applications');
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch BT applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [outstandingRupees, tenureMonths, lenderType]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApply = async (lenderId: string, lenderName: string) => {
    const debt = debts.find((d) => d.key === selectedDebt);
    if (!debt) {
      toast.error('Add a credit card or loan first, then select it as the transfer source.');
      return;
    }
    try {
      setSubmitting(lenderId);
      await api.post('/bt/applications', {
        lenderId,
        requestedTenureMonths: tenureMonths,
        ...(debt.kind === 'card' ? { sourceCcId: debt.id } : { sourceLoanId: debt.id }),
      });

      setSubmittedSuccess(lenderName);
      toast.success(`Application submitted to ${lenderName}`);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || 'Application submission failed');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="card-fintech p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>INSTITUTIONAL BALANCE REFINANCING</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Balance Transfer &amp; Takeover Workbench
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare institutional takeover rates from Scheduled Commercial Banks and NBFCs. Direct bank-to-bank settlement.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {submittedSuccess && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                Balance Transfer application submitted to <strong>{submittedSuccess}</strong>. The underwriting partner has initiated digital verification.
              </span>
            </div>
            <button
              onClick={() => setSubmittedSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 underline font-semibold ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'offers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Takeover Offers &amp; Simulator</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('applications');
                fetchApplications();
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'applications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>My Applications</span>
              {applications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {applications.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'applications' && (
            <button
              onClick={fetchApplications}
              disabled={loadingApps}
              className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          )}
        </div>

        {/* TAB 1: OFFERS & CALCULATOR */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Parameter Controls */}
            <div className="lg:col-span-4 space-y-4">
              <div className="card-fintech p-5 space-y-5 bg-white">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Takeover Parameters</h3>
                </div>

                {/* Account to transfer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Source Account to Refinance</label>
                  {debts.length > 0 ? (
                    <select
                      value={selectedDebt}
                      onChange={(e) => chooseDebt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    >
                      {debts.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label} (₹{d.outstandingRupees.toLocaleString('en-IN')} @ {d.ratePercent}% APR)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Add a card or loan to select as source. You can still simulate loan amounts below.
                    </p>
                  )}
                </div>

                {/* Slider 1: Outstanding */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Balance to Takeover</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      ₹{outstandingRupees.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="2500000"
                    step="25000"
                    value={outstandingRupees}
                    onChange={(e) => setOutstandingRupees(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>₹50K</span>
                    <span>₹12.5L</span>
                    <span>₹25L</span>
                  </div>
                </div>

                {/* Slider 2: Tenure */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Target Tenure</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {tenureMonths} Months ({tenureMonths / 12} Yrs)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="60"
                    step="6"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>12 Mos</span>
                    <span>36 Mos</span>
                    <span>60 Mos</span>
                  </div>
                </div>

                {/* Lender Filter */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700">Institution Category</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setLenderType('all')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                        lenderType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setLenderType('bank')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                        lenderType === 'bank' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Banks
                    </button>
                    <button
                      onClick={() => setLenderType('nbfc')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                        lenderType === 'nbfc' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      NBFCs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Offers List */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Matched Refinancing Offers ({offers.length})
                </h3>
                <span className="text-xs text-slate-500">Sorted by lowest interest rate</span>
              </div>

              {loading ? (
                <div className="card-fintech text-center py-16 text-xs text-slate-500">
                  Querying partner underwriting criteria...
                </div>
              ) : offers.length === 0 ? (
                <div className="card-fintech text-center py-16 text-xs text-slate-500">
                  No institutional facilities match the selected parameters.
                </div>
              ) : (
                offers.map((offer, idx) => (
                  <div
                    key={offer.lenderId}
                    className="card-fintech p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-slate-300 transition-colors bg-white shadow-subtle"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: offer.brandColor || '#0F172A' }}
                      >
                        {offer.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900">{offer.name}</h4>
                          <span className="badge-slate text-[10px]">{offer.type}</span>
                          {idx === 0 && (
                            <span className="badge-emerald text-[10px]">
                              Lowest Rate
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Disbursal: {offer.disbursalDaysMin}–{offer.disbursalDaysMax} days · Processing: ₹{offer.processingFeeRupees.toLocaleString('en-IN')} · Min CIBIL: {offer.minCreditScore}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 self-end sm:self-auto text-right">
                      <div>
                        <div className="font-bold text-base text-emerald-700 tabular-nums">
                          {offer.offeredRatePercent}% p.a.
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          ~₹{offer.estimatedEmiRupees.toLocaleString('en-IN')}/mo
                        </div>
                      </div>

                      <button
                        onClick={() => handleApply(offer.lenderId, offer.name)}
                        disabled={submitting === offer.lenderId || offer.meetsMinimumScore === false}
                        title={
                          offer.meetsMinimumScore === false
                            ? `Requires bureau score of ${offer.minCreditScore}+`
                            : undefined
                        }
                        className="btn-primary text-xs !py-2 !px-4 cursor-pointer"
                      >
                        {submitting === offer.lenderId ? 'Submitting...' : 'Apply Takeover'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS TRACKER */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submitted Applications &amp; Status Tracker</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track document verification, underwriting sanction, and loan takeover disbursals in real time.
                </p>
              </div>
              <span className="badge-emerald text-xs font-semibold">{applications.length} Total</span>
            </div>

            {loadingApps ? (
              <div className="card-fintech text-center py-16 text-xs text-slate-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="card-fintech text-center py-16 p-8 space-y-4">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Applications Submitted</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Compare takeover interest rates from verified partner banks and submit your first balance transfer request.
                </p>
                <button
                  onClick={() => setActiveTab('offers')}
                  className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Compare Partner Offers</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {applications.map((app) => {
                  const statusBadges: Record<string, { badgeClass: string; label: string; step: number }> = {
                    draft: { badgeClass: 'badge-amber', label: 'Draft', step: 1 },
                    submitted: { badgeClass: 'badge-blue', label: 'Under Review', step: 2 },
                    approved: { badgeClass: 'badge-emerald', label: 'Sanctioned', step: 3 },
                    disbursed: { badgeClass: 'badge-emerald', label: 'Disbursed / Settled', step: 4 },
                    rejected: { badgeClass: 'badge-rose', label: 'Declined', step: 0 },
                  };
                  const currentStatus = statusBadges[app.status] || statusBadges.submitted;

                  return (
                    <div key={app.id} className="card-fintech p-5 space-y-4 shadow-subtle bg-white">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900">{app.lenderName}</h4>
                            <span className={currentStatus.badgeClass}>{currentStatus.label}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Submitted on{' '}
                              {app.createdAt
                                ? new Date(app.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Recently'}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-600">ID: {app.id.substring(0, 8)}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Transfer Amount</span>
                          <div className="text-xl font-bold text-slate-900 tabular-nums">
                            ₹{app.outstandingRupees.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Rate & Tenure Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-500">Source Rate</span>
                          <div className="font-bold text-rose-600 mt-0.5 tabular-nums">
                            {app.currentRatePercent}% p.a.
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Sanctioned Rate</span>
                          <div className="font-bold text-emerald-700 mt-0.5 tabular-nums">
                            {app.newRatePercent ? `${app.newRatePercent}% p.a.` : 'In Appraisal'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Requested Tenure</span>
                          <div className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                            {app.requestedTenureMonths} Months
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Rate Reduction</span>
                          <div className="font-bold text-emerald-700 mt-0.5 tabular-nums">
                            {app.newRatePercent
                              ? `-${(app.currentRatePercent - app.newRatePercent).toFixed(2)}%`
                              : 'Under Review'}
                          </div>
                        </div>
                      </div>

                      {/* Stepper Progression */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                          <span className={currentStatus.step >= 1 ? 'font-bold text-slate-900' : ''}>
                            1. Application Ingested
                          </span>
                          <span className={currentStatus.step >= 2 ? 'font-bold text-slate-900' : ''}>
                            2. Underwriting Review
                          </span>
                          <span className={currentStatus.step >= 3 ? 'font-bold text-slate-900' : ''}>
                            3. Sanction Letter
                          </span>
                          <span className={currentStatus.step >= 4 ? 'font-bold text-slate-900' : ''}>
                            4. Bank Takeover Disbursal
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{
                              width:
                                app.status === 'rejected'
                                  ? '100%'
                                  : currentStatus.step === 1
                                  ? '25%'
                                  : currentStatus.step === 2
                                  ? '50%'
                                  : currentStatus.step === 3
                                  ? '75%'
                                  : '100%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

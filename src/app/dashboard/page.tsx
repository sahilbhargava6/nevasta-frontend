'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  TrendingDown,
  CreditCard,
  Landmark,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Zap,
  CheckCircle2,
  Bell,
  Lightbulb,
  Gauge,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import ReminderModal from '@/components/ReminderModal';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [avalanchePlan, setAvalanchePlan] = useState<any>(null);
  const [snowballPlan, setSnowballPlan] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [cibilTips, setCibilTips] = useState<any>(null);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const DEFAULT_AVALANCHE = {
    strategy: 'avalanche',
    description:
      'Direct all excess monthly cash flow toward your target priority account with the highest APR (42.0% p.a.) to mathematically minimize overall interest cost.',
    estimatedInterestSavingsRupees: 79800,
    payoffSequence: [
      {
        rank: 1,
        name: 'HDFC Bank Millennia Card',
        ratePercent: 42.0,
        outstandingRupees: 120000,
        recommendation: 'Pay minimum dues on all other accounts; direct all excess monthly cash flow here first.',
      },
      {
        rank: 2,
        name: 'ICICI Bank Sapphiro Card',
        ratePercent: 36.0,
        outstandingRupees: 70000,
        recommendation: 'Target after HDFC Bank Millennia is fully settled.',
      },
      {
        rank: 3,
        name: 'Axis Bank Personal Loan',
        ratePercent: 14.5,
        outstandingRupees: 380000,
        recommendation: 'Lowest interest rate: keep paying standard EMI until revolving card balances are eliminated.',
      },
    ],
  };

  const DEFAULT_SNOWBALL = {
    strategy: 'snowball',
    description:
      'Direct all excess monthly cash flow toward the account with the smallest balance (₹70,000) for rapid psychological momentum and account elimination.',
    estimatedInterestSavingsRupees: 64200,
    payoffSequence: [
      {
        rank: 1,
        name: 'ICICI Bank Sapphiro Card',
        ratePercent: 36.0,
        outstandingRupees: 70000,
        recommendation: 'Smallest balance account: eliminate first to unlock fast psychological momentum.',
      },
      {
        rank: 2,
        name: 'HDFC Bank Millennia Card',
        ratePercent: 42.0,
        outstandingRupees: 120000,
        recommendation: 'Target second smallest balance once ICICI Sapphiro is paid in full.',
      },
      {
        rank: 3,
        name: 'Axis Bank Personal Loan',
        ratePercent: 14.5,
        outstandingRupees: 380000,
        recommendation: 'Final obligation to extinguish in your payoff journey.',
      },
    ],
  };

  const DEFAULT_ELIGIBILITY = {
    creditScore: 785,
    matches: [
      {
        lenderId: '1',
        lenderName: 'HDFC Bank',
        type: 'Scheduled Bank',
        minRatePercent: 10.25,
        maxRatePercent: 12.5,
        processingFeePercent: 0.5,
        disbursalDays: '2 Days',
        preApproved: true,
      },
      {
        lenderId: '2',
        lenderName: 'Tata Capital',
        type: 'Systemically Important NBFC',
        minRatePercent: 11.0,
        maxRatePercent: 13.5,
        processingFeePercent: 0.75,
        disbursalDays: '24 Hours',
        preApproved: true,
      },
      {
        lenderId: '3',
        lenderName: 'ICICI Bank',
        type: 'Scheduled Bank',
        minRatePercent: 10.5,
        maxRatePercent: 13.0,
        processingFeePercent: 0.5,
        disbursalDays: '2 Days',
        preApproved: true,
      },
    ],
  };

  const DEFAULT_CIBIL_TIPS = {
    utilizationRatioPercent: 28,
    tipsCount: 3,
    tips: [
      {
        category: 'Credit Utilization',
        priority: 'low',
        title: 'Healthy Utilization Ratio (28.0%)',
        advice: 'Card utilization is maintained below the recommended 30% ceiling. This contributes positively to your CIBIL score.',
      },
      {
        category: 'Payment History',
        priority: 'high',
        title: 'Ensure Automated Standing Instructions',
        advice: 'Repayment history represents 35% of bureau scoring weight. Keep auto-debits active to prevent inadvertent delinquency marks.',
      },
      {
        category: 'Credit Mix',
        priority: 'medium',
        title: 'Balanced Facility Composition',
        advice: 'Maintaining a balanced proportion of secured versus unsecured credit lines supports long-term profile resilience.',
      },
    ],
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, avRes, sbRes, elRes, cibilRes]: [any, any, any, any, any] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/solutions/avalanche'),
        api.get('/solutions/snowball'),
        api.get('/solutions/eligibility'),
        api.get('/solutions/cibil-tips'),
      ]);
      setSummary(sumRes.data);
      setAvalanchePlan(avRes.data);
      setSnowballPlan(sbRes.data);
      setEligibility(elRes.data);
      setCibilTips(cibilRes.data);
    } catch (err: any) {
      console.warn('Using fallback data for dashboard:', err);
      setAvalanchePlan(DEFAULT_AVALANCHE);
      setSnowballPlan(DEFAULT_SNOWBALL);
      setEligibility(DEFAULT_ELIGIBILITY);
      setCibilTips(DEFAULT_CIBIL_TIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('navesta_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    loadData();
  }, []);

  const activePlan = strategy === 'avalanche' ? avalanchePlan : snowballPlan;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Action Bar */}
        <div className="card-fintech p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Portfolio Risk &amp; Refinancing Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name || 'Rahul Mehta'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time debt exposure, optimal payoff priority, and matched takeover facilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/credit-cards/add" className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Card</span>
            </Link>
            <Link href="/loans/add" className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Loan</span>
            </Link>
            <button
              onClick={() => setIsReminderOpen(true)}
              className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span>Set Alert</span>
            </button>
            <Link href="/balance-transfer" className="btn-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5">
              <span>Takeover Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="card-fintech p-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Total Debt Exposure</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              ₹{summary ? summary.totalOutstandingRupees.toLocaleString('en-IN') : '5,70,000'}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Cards: ₹{summary?.totalCcOutstandingRupees.toLocaleString('en-IN') || '1,90,000'}</span>
              <span>Loans: ₹{summary?.totalLoanOutstandingRupees.toLocaleString('en-IN') || '3,80,000'}</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="card-fintech p-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Monthly Obligations (EMIs)</span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              ₹{summary ? summary.totalMonthlyObligationsRupees.toLocaleString('en-IN') : '26,750'}
              <span className="text-xs font-normal text-slate-500 ml-1">/mo</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              {summary?.activeCreditCardsCount || 2} Credit Lines · {summary?.activeLoansCount || 1} Term Loan
            </div>
          </div>

          {/* Metric 3 */}
          <div className="card-fintech p-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Peak Interest Rate</span>
              <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">
              {summary ? `${summary.highestRateDebt.ratePercent}% APR` : '42.0% APR'}
            </div>
            <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100">
              Target: {summary ? summary.highestRateDebt.name : 'HDFC Bank Millennia Card'}
            </div>
          </div>

          {/* Metric 4 */}
          <div className="card-fintech p-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Calculated Takeover Savings</span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">
              ₹{avalanchePlan ? avalanchePlan.estimatedInterestSavingsRupees.toLocaleString('en-IN') : '79,800'}
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              Via partner refinancing at 10.25% p.a.
            </div>
          </div>
        </div>

        {/* Strategy Order with Interactive Toggle */}
        <div className="card-fintech p-6 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Algorithmic Repayment Engine</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Recommended Payoff Sequence
              </h2>
            </div>

            {/* Clean Segmented Control */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setStrategy('avalanche')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  strategy === 'avalanche'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Avalanche (Highest APR)</span>
              </button>
              <button
                onClick={() => setStrategy('snowball')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  strategy === 'snowball'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Snowball (Smallest Balance)</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-600 leading-relaxed flex items-center justify-between">
            <span>{activePlan?.description}</span>
            <span className="badge-emerald font-semibold ml-4 flex-shrink-0">
              Est. Interest Saved: ₹{activePlan?.estimatedInterestSavingsRupees.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3">
            {activePlan?.payoffSequence ? (
              activePlan.payoffSequence.map((item: any) => (
                <div
                  key={item.rank}
                  className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-colors shadow-subtle"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                        item.rank === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{item.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-900">{item.name}</h4>
                        {item.rank === 1 && (
                          <span className="badge-rose text-[10px]">
                            Primary Target
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.recommendation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto text-right">
                    <div>
                      <div className="font-bold text-sm text-rose-600 tabular-nums">
                        {item.ratePercent}% APR
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        ₹{item.outstandingRupees.toLocaleString('en-IN')} outstanding
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">Loading payoff sequence...</div>
            )}
          </div>
        </div>

        {/* Matched Partner Lending Facilities */}
        {eligibility?.matches && (
          <div className="card-fintech p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Institutional Pre-Approvals</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Matched Refinancing Facilities
                </h2>
              </div>
              <div className="text-xs text-slate-500">
                Bureau Profile: <span className="font-bold text-slate-900">Score {eligibility.creditScore ?? '785'} (CRIF/CIBIL)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {eligibility.matches.slice(0, 3).map((offer: any) => (
                <div
                  key={offer.lenderId}
                  className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-subtle hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {offer.type}
                      </span>
                      {offer.preApproved && (
                        <span className="badge-emerald text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Pre-Approved
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{offer.lenderName}</h3>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Interest Rate</span>
                        <span className="font-bold text-emerald-700 tabular-nums">
                          {offer.minRatePercent}% – {offer.maxRatePercent}% p.a.
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Processing Fee</span>
                        <span className="font-medium text-slate-900">{offer.processingFeePercent}%</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Disbursal Horizon</span>
                        <span className="font-medium text-slate-900">{offer.disbursalDays}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/balance-transfer?lenderId=${offer.lenderId}`}
                    className="btn-primary w-full text-xs !py-2 flex items-center justify-center gap-1.5"
                  >
                    <span>Apply for Takeover</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CIBIL Intelligence & Score Drivers */}
        {cibilTips && (
          <div className="card-fintech p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span>Credit Profile Intelligence</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  CIBIL Health &amp; Score Enhancement Advisory
                </h2>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Revolving Utilization:</span>
                <span
                  className={`font-bold tabular-nums ${
                    cibilTips.utilizationRatioPercent > 30 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {cibilTips.utilizationRatioPercent}%
                </span>
                <span
                  className={
                    cibilTips.utilizationRatioPercent > 30 ? 'badge-rose text-[10px]' : 'badge-emerald text-[10px]'
                  }
                >
                  {cibilTips.utilizationRatioPercent > 30 ? 'High' : 'Optimal'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cibilTips.tips?.map((tip: any, index: number) => {
                const isHigh = tip.priority === 'high';
                const isMed = tip.priority === 'medium';
                return (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col justify-between space-y-3 shadow-subtle hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {tip.category}
                        </span>
                        <span
                          className={
                            isHigh ? 'badge-rose text-[10px]' : isMed ? 'badge-amber text-[10px]' : 'badge-emerald text-[10px]'
                          }
                        >
                          {tip.priority} Priority
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 flex items-start gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{tip.title}</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{tip.advice}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <ReminderModal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { CreditCard as CardIcon, Plus, Trash2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function CreditCardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/credit-cards');
      setCards(res.data || []);
    } catch (err) {
      console.error('Failed to fetch credit cards:', err);
      toast.error('Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this credit card account?')) return;
    try {
      await api.delete(`/credit-cards/${id}`);
      toast.success('Card removed from portfolio');
      fetchCards();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete credit card');
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
              <CardIcon className="w-4 h-4 text-blue-600" />
              <span>REVOLVING CREDIT LINES</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Credit Cards</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              High-APR revolving credit limits, statement cycles, and balance transfer candidate accounts.
            </p>
          </div>

          <Link href="/credit-cards/add" className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Credit Card</span>
          </Link>
        </div>

        {loading ? (
          <div className="card-fintech text-center py-16 text-xs text-slate-500">Loading credit card accounts...</div>
        ) : cards.length === 0 ? (
          <div className="card-fintech text-center py-16 p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
              <CardIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Credit Cards Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your revolving cards to evaluate balance transfer eligibility and calculate exact interest savings from high APRs.
            </p>
            <Link href="/credit-cards/add" className="btn-primary text-xs !py-2.5 !px-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Card</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card) => {
              const utilizationPct = card.creditLimitRupees > 0
                ? Math.round((card.outstandingRupees / card.creditLimitRupees) * 100)
                : 0;

              return (
                <div
                  key={card.id}
                  className="card-fintech p-6 space-y-4 hover:border-slate-300 transition-colors shadow-subtle bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge-slate text-[10px] uppercase font-bold tracking-wider">
                        {card.bankName}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{card.cardName}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        •••• •••• •••• {card.lastFour || '4321'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="badge-rose font-bold text-xs tabular-nums">
                        {card.aprPercent}% APR
                      </span>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Card"
                        aria-label="Remove Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Balance: <strong className="text-slate-900 tabular-nums">₹{card.outstandingRupees.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        Limit: ₹{card.creditLimitRupees.toLocaleString('en-IN')} ({utilizationPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          utilizationPct > 50
                            ? 'bg-rose-500'
                            : utilizationPct > 30
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, utilizationPct))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                      Min Due: <strong className="text-slate-800 tabular-nums">₹{(card.minPaymentRupees || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="text-slate-500">
                      Payment Cycle: <strong className="text-slate-800">{card.dueDay || 15}th</strong> of month
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/balance-transfer`}
                      className="btn-secondary w-full !py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Simulate Balance Transfer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

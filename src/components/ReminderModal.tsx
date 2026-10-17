'use client';

import { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, Phone, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReminderModal({ isOpen, onClose }: ReminderModalProps) {
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [accountName, setAccountName] = useState('HDFC Bank Millennia Card');
  const [amountRupees, setAmountRupees] = useState(12000);
  const [dueDate, setDueDate] = useState('5th of next month');
  const [loading, setLoading] = useState(false);
  const [sentResponse, setSentResponse] = useState<any>(null);

  if (!isOpen) return null;

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await api.post('/notifications/reminder', {
        channel,
        phone,
        accountName,
        amountRupees,
        dueDate,
      });
      setSentResponse(res.payload);
      toast.success(`${channel.toUpperCase()} payment reminder dispatched successfully`);
    } catch {
      toast.error('Failed to send payment reminder notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Automated Alert Dispatch</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">Payment Due Reminder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {sentResponse ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Alert Dispatched</h3>
              <p className="text-xs text-slate-500 mt-0.5">Notification delivered to {sentResponse.recipient}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{sentResponse.channel} Delivery Payload</span>
                <span className="badge-emerald text-[10px]">{sentResponse.dispatchStatus}</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">{sentResponse.content}</p>
            </div>

            <button
              onClick={() => {
                setSentResponse(null);
                onClose();
              }}
              className="btn-primary w-full text-xs !py-2.5 cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendReminder} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Delivery Channel</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Direct SMS</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Recipient Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Due Amount (₹)</label>
                <input
                  type="number"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Due Date Reference</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. 5th of next month"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Alert</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

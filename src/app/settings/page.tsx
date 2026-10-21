'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Bell,
  Building,
  Briefcase,
  KeyRound,
  FileText,
  Save,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('rented');
  const [employmentSector, setEmploymentSector] = useState('salaried_private');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Phone OTP Flow State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string | null>(null);

  // Account Deletion State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Export State
  const [exporting, setExporting] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/users/me');
      const data = res.data;
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setPropertyStatus(data.propertyStatus || 'rented');
      setEmploymentSector(data.employmentSector || 'salaried_private');
      setRemindersEnabled(!!data.remindersEnabled);
      setTwoFactorEnabled(!!data.twoFactorEnabled);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setAuthOpen(true);
      } else {
        setError('Failed to load profile details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res: any = await api.patch('/users/me', {
        name,
        phone,
        propertyStatus,
        employmentSector,
        remindersEnabled,
        twoFactorEnabled,
      });

      // Update stored user in localStorage
      const stored = localStorage.getItem('navesta_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.name = name;
          parsed.phone = phone;
          localStorage.setItem('navesta_user', JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }

      setSuccessMsg('Your profile and security preferences have been updated.');
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setOtpLoading(true);
    setOtpMsg(null);
    setError(null);
    try {
      await api.post('/users/me/phone/send-code');
      setOtpSent(true);
      setOtpMsg('A 6-digit verification code was sent to your registered phone number.');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) return;
    setOtpLoading(true);
    setError(null);
    try {
      await api.post('/users/me/phone/verify', { code: otpCode });
      setOtpSent(false);
      setOtpCode('');
      setSuccessMsg('Your phone number has been verified successfully.');
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    setError(null);
    try {
      const response = await api.get('/users/me/export', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `navesta-data-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Personal data archive downloaded (DPDP Act compliant).');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate data export.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete('/users/me', {
        data: { password: deletePassword },
      });

      localStorage.removeItem('navesta_user');
      alert('Your account and all associated debts, statements, and snapshots have been erased.');
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete account. Please verify your password.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Borrower Account Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Account Settings &amp; Data Privacy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your borrower profile, multi-factor phone verification, institutional alerts, and DPDP Act data rights.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Querying account security details...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile & Demographics Card */}
            <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">Encrypted Profile Data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Primary login identity (immutable)</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mobile Phone Number</label>
                    {profile?.phoneVerified ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Unverified
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Sector</label>
                  <select
                    value={employmentSector}
                    onChange={(e) => setEmploymentSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50"
                  >
                    <option value="salaried_private">Salaried (Private Sector / IT)</option>
                    <option value="salaried_govt">Salaried (Government / PSU)</option>
                    <option value="self_employed">Self Employed / Freelance</option>
                    <option value="professional">Doctor / CA / Lawyer / Architect</option>
                    <option value="business">Business Owner / Enterprise</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Property Ownership Status</label>
                  <select
                    value={propertyStatus}
                    onChange={(e) => setPropertyStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50"
                  >
                    <option value="rented">Rented Accommodation</option>
                    <option value="owned_with_mortgage">Owned with Active Home Loan Mortgage</option>
                    <option value="owned_outright">Owned Outright (Debt-Free Property)</option>
                    <option value="living_with_family">Living with Parents / Family</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Used by partner banks to determine collateral and takeover rate tiers.</span>
                </div>
              </div>

              {/* Preferences Toggles */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Due Date &amp; Overdraft Alerts</span>
                      <span className="text-[11px] text-slate-500">
                        Receive WhatsApp and SMS reminders 3 days before payment due dates.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[11px] text-slate-500">
                        Require an SMS OTP sign-in code whenever signing in from a new browser.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!profile?.phoneVerified}
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>

            {/* Phone Verification Section (if unverified) */}
            {!profile?.phoneVerified && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>Verify Your Mobile Phone Number</span>
                </div>
                <p className="text-xs text-amber-800">
                  Verifying your phone number enables SMS balance takeover status notifications and activates two-factor authentication.
                </p>

                {otpMsg && <p className="text-xs font-semibold text-emerald-700">{otpMsg}</p>}

                {!otpSent ? (
                  <button
                    onClick={handleSendPhoneOtp}
                    disabled={otpLoading || !phone}
                    className="btn-accent text-xs !py-2 !px-4 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="flex items-center gap-2.5 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="px-3.5 py-2 rounded-xl border border-amber-300 text-sm font-mono tracking-widest bg-white focus:outline-none focus:border-amber-600 flex-1"
                    />
                    <button
                      type="submit"
                      disabled={otpLoading || otpCode.length < 4}
                      className="btn-primary text-xs !py-2 !px-4 cursor-pointer disabled:opacity-50"
                    >
                      {otpLoading ? 'Verifying...' : 'Confirm OTP'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* DPDP Act Data Privacy & Portability */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Data Protection &amp; Portability (DPDP Act 2023)</h2>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  India DPDP Compliant
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Under the Indian Digital Personal Data Protection (DPDP) Act 2023, you have full ownership of your financial records. You may export your entire digital portfolio archive or permanently delete your account at any time.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Personal Data Archive Export</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Download a comprehensive JSON package including your credit profile, cards, loans, amortization schedules, and audit entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="btn-secondary text-xs !py-2 !px-4 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{exporting ? 'Compiling Archive...' : 'Download My Data'}</span>
                </button>
              </div>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 shadow-card space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-base">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h2>Danger Zone: Right to Erasure</h2>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Permanently delete your Navesta account, credit cards, active loans, balance transfer applications, and encrypted statement files. This action cannot be reversed.
              </p>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated border border-slate-200">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Confirm Account Erasure</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                To confirm permanent deletion of your borrower account and all encrypted financial assets, enter your account password below:
              </p>

              {deleteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-rose-600 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    }}
                    className="btn-secondary text-xs !py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? 'Erasing Account...' : 'Yes, Permanently Delete'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

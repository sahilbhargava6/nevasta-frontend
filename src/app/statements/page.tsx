'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { api } from '@/lib/api';
import {
  FileText,
  UploadCloud,
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface StatementItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'clean' | 'pending' | 'infected' | 'unscanned' | string;
  downloadable: boolean;
  scannedAt: string | null;
  uploadedAt: string;
}

export default function StatementsPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/statements');
      setStatements(res.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setAuthOpen(true);
      } else {
        setError('Failed to load statements from vault.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(50);
      await api.post('/statements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(100);
      setSuccessMsg(`"${file.name}" uploaded successfully. It is encrypted and queued for security scanning.`);
      fetchStatements();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to upload statement.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (statement: StatementItem) => {
    try {
      const response = await api.get(`/statements/${statement.id}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: statement.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', statement.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Unable to download file. It may still be undergoing virus scan.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from your vault?`)) {
      return;
    }

    try {
      await api.delete(`/statements/${id}`);
      setStatements((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg(`"${name}" was deleted from your encrypted vault.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete statement.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string, downloadable: boolean) => {
    switch (status) {
      case 'clean':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clean / Scanned</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Scanning in queue...</span>
          </span>
        );
      case 'infected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Security Blocked</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Encrypted At Rest</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Institutional Statement Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Encrypted Statement Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload bank and credit card statements (PDF, CSV). Files are AES-256 encrypted before write and protected by automated virus scanners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatements}
              className="btn-secondary text-xs !py-2 flex items-center gap-1.5 cursor-pointer"
              title="Refresh Vault"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/balance-transfer"
              className="btn-primary text-xs !py-2 flex items-center gap-1.5"
            >
              <span>Balance Takeover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security Assurance Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block">End-to-End Encryption & Antivirus Pipeline</span>
              <span className="text-slate-300">
                Statements are never stored in plaintext. ClamAV scans payloads for malware before allowing access.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300 bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-800/60 self-start sm:self-auto">
            <span>AES-256-CBC • Zero-Log Storage</span>
          </div>
        </div>

        {/* Alert Messages */}
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

        {/* Upload Card */}
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center hover:border-blue-500 transition-colors bg-slate-50/40">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.csv,.txt,application/pdf,text/csv,text/plain"
            className="hidden"
            id="statement-file-input"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Your Statements</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your PDF or CSV bank statement or credit card billing summary (Max 10 MB).
              </p>
            </div>

            <label
              htmlFor="statement-file-input"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>{uploading ? 'Encrypting & Uploading...' : 'Select File from Device'}</span>
            </label>

            {uploadProgress !== null && (
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-3">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Statements List Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Vault Files</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {statements.length}
              </span>
            </div>
            <span className="text-xs text-slate-400">Encrypted in Navesta Vault</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Querying encrypted statement records...
            </div>
          ) : statements.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No statements uploaded yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Upload your latest credit card statements to unlock instant institutional balance takeover matching.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (xs to sm) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {statements.map((statement) => (
                  <div key={statement.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                            {statement.fileName}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {formatBytes(statement.sizeBytes)} • {new Date(statement.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(statement.status, statement.downloadable)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                      <button
                        onClick={() => handleDownload(statement)}
                        disabled={!statement.downloadable}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                          statement.downloadable
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'border-slate-100 opacity-40 cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleDelete(statement.id, statement.fileName)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop & Tablet Table (sm and up) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 sm:px-6">File Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Security Status</th>
                      <th className="py-3 px-4">Uploaded Date</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {statements.map((statement) => (
                      <tr key={statement.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-[200px] sm:max-w-[280px]">{statement.fileName}</span>
                        </td>
                        <td className="py-3.5 px-4 tabular-nums text-slate-600">
                          {formatBytes(statement.sizeBytes)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(statement.status, statement.downloadable)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(statement.uploadedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleDownload(statement)}
                            disabled={!statement.downloadable}
                            className={`p-1.5 rounded-lg border text-slate-600 transition-colors ${
                              statement.downloadable
                                ? 'border-slate-200 hover:bg-slate-100 hover:text-blue-600 cursor-pointer'
                                : 'border-slate-100 opacity-40 cursor-not-allowed'
                            }`}
                            title={statement.downloadable ? 'Download decrypted file' : 'File undergoing scan'}
                            aria-label="Download statement"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(statement.id, statement.fileName)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete from vault"
                            aria-label="Delete statement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export default function BlogPostDetail() {
  const params = useParams();
  const slug = params?.slug as string;

  const [authOpen, setAuthOpen] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/posts/${slug}`);
        setPost(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load publication.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Knowledge Hub</span>
          </Link>

          <button
            onClick={handleShare}
            className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Share</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center text-xs text-slate-500">
            Rendering research article...
          </div>
        ) : error || !post ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-sm font-bold text-slate-800">{error || 'Article not found.'}</div>
            <Link href="/blog" className="btn-primary text-xs !py-2 !px-4 inline-flex items-center gap-1">
              <span>Explore other publications</span>
            </Link>
          </div>
        ) : (
          <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-card space-y-8">
            {/* Header */}
            <div className="space-y-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Navesta Institutional Advisory
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                  {post.excerpt}
                </p>
              )}

              {/* Author Row */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {post.authorName ? post.authorName.charAt(0) : 'N'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{post.authorName || 'Navesta Advisory Team'}</div>
                  <div className="text-[11px] text-slate-500">Debt Advisory &amp; Algorithmic Takeover Desk</div>
                </div>
              </div>
            </div>

            {/* Rendered Body (Safe Sanitized HTML from Backend) */}
            <div
              className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />

            {/* Bottom Takeover Callout */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Ready to optimize your portfolio?
                </div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  Check your institutional balance takeover rate
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Compare active partner bank facilities starting at 10.25% p.a. with zero CIBIL score impact.
                </p>
              </div>

              <Link
                href="/balance-transfer"
                className="btn-accent text-xs !py-2.5 !px-4 flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Check Takeover Offers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

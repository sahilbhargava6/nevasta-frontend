'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string | null;
  publishedAt: string;
}

export default function BlogIndexPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/posts');
        setPosts(res.data || []);
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-18 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>NAVESTA RESEARCH &amp; ADVISORY KNOWLEDGE HUB</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
            Debt Optimization &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
              Credit Intelligence
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Institutional research, mathematical payoff strategies, and regulatory insights on Indian lending, CIBIL scores, and balance transfers.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles on CIBIL, balance transfers, payoff math..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none bg-slate-50/70"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            Loading institutional advisory publications...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No articles match your search</div>
            <p className="text-[11px] text-slate-500">Try searching for other terms like &quot;interest&quot;, &quot;loans&quot;, or &quot;CIBIL&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group hover:border-blue-300"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Advisory
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {post.authorName ? post.authorName.charAt(0) : 'N'}
                    </div>
                    <span>{post.authorName || 'Navesta Research'}</span>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

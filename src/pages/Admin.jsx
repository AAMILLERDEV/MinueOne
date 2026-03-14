import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Loader2, ShieldAlert, Users, Rss, BarChart3,
  Crown, CheckCircle, XCircle, Search, ChevronDown,
  ArrowLeft, Trash2, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'feed', label: 'Feed', icon: Rss },
];

const TIER_OPTIONS = ['free', 'pro', 'business', 'enterprise'];

const TYPE_COLORS = {
  founder: 'bg-blue-100 text-blue-700',
  investor: 'bg-violet-100 text-violet-700',
  service_provider: 'bg-emerald-100 text-emerald-700',
  advisor: 'bg-amber-100 text-amber-700',
};

const CATEGORY_COLORS = {
  growth: 'bg-emerald-100 text-emerald-700',
  fundraising: 'bg-violet-100 text-violet-700',
  legal: 'bg-amber-100 text-amber-700',
  tech: 'bg-cyan-100 text-cyan-700',
  hiring: 'bg-pink-100 text-pink-700',
  marketing: 'bg-orange-100 text-orange-700',
  operations: 'bg-slate-100 text-slate-700',
  finance: 'bg-green-100 text-green-700',
  product: 'bg-blue-100 text-blue-700',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);

  // Users tab state
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [updatingUser, setUpdatingUser] = useState(null);

  // Feed tab state
  const [feedFilter, setFeedFilter] = useState('all'); // all | pending | approved | rejected
  const [updatingPost, setUpdatingPost] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const user = await minus1.auth.me();
      const myProfiles = await minus1.entities.Profile.filter({ user_id: user.id });
      const myProfile = myProfiles[0];
      console.debug('[Admin] profile:', myProfile);
      // is_admin may come back as boolean true, string 'true', or 1 depending on
      // PostgREST schema cache state — coerce to boolean
      const adminFlag = myProfile?.is_admin;
      if (!myProfile || !adminFlag) {
        console.warn('[Admin] access denied — is_admin value:', adminFlag);
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const [allProfiles, allMatches, allMessages, allPosts] = await Promise.all([
        minus1.entities.Profile.list('-created_date'),
        minus1.entities.Match.list('-created_date'),
        minus1.entities.Message.list('-created_date'),
        minus1.entities.FeedPost.list('-created_at'),
      ]);

      setProfiles(allProfiles);
      setMatches(allMatches);
      setMessages(allMessages);
      setFeedPosts(allPosts);
    } catch (err) {
      console.error('Admin load error:', err);
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  // ── User actions ──────────────────────────────────────────────────────────
  const togglePremium = async (profile) => {
    setUpdatingUser(profile.id);
    try {
      const updated = await minus1.entities.Profile.update(profile.id, {
        is_premium: !profile.is_premium,
      });
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Error toggling premium:', err);
    } finally {
      setUpdatingUser(null);
    }
  };

  const changeTier = async (profile, tier) => {
    setUpdatingUser(profile.id);
    try {
      const updated = await minus1.entities.Profile.update(profile.id, {
        subscription_tier: tier,
        is_premium: tier !== 'free',
      });
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Error changing tier:', err);
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleAdmin = async (profile) => {
    setUpdatingUser(profile.id);
    try {
      const updated = await minus1.entities.Profile.update(profile.id, {
        is_admin: !profile.is_admin,
      });
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Error toggling admin:', err);
    } finally {
      setUpdatingUser(null);
    }
  };

  // ── Feed actions ──────────────────────────────────────────────────────────
  const setPostApproval = async (post, approved) => {
    setUpdatingPost(post.id);
    try {
      const updated = await minus1.entities.FeedPost.update(post.id, {
        approved,
        rejection_reason: approved ? null : 'Manually rejected by admin',
      });
      setFeedPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setUpdatingPost(null);
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm('Delete this post permanently?')) return;
    setUpdatingPost(post.id);
    try {
      await minus1.entities.FeedPost.delete(post.id);
      setFeedPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setUpdatingPost(null);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const stats = {
    totalUsers: profiles.length,
    premiumUsers: profiles.filter(p => p.is_premium).length,
    founders: profiles.filter(p => p.profile_type === 'founder').length,
    serviceProviders: profiles.filter(p => p.profile_type === 'service_provider').length,
    totalMatches: matches.length,
    totalMessages: messages.length,
    totalPosts: feedPosts.length,
    approvedPosts: feedPosts.filter(p => p.approved).length,
  };

  const filteredUsers = profiles.filter(p => {
    const matchesSearch =
      !userSearch ||
      p.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.profile_type?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesType = userTypeFilter === 'all' || p.profile_type === userTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredPosts = feedPosts.filter(p => {
    if (feedFilter === 'approved') return p.approved === true;
    if (feedFilter === 'rejected') return p.approved === false;
    return true;
  });

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <p className="text-slate-700 font-medium">Admin access required</p>
        <Button variant="outline" onClick={() => navigate(createPageUrl('Discover'))}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 pt-12 pb-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-slate-400 hover:text-slate-600"
              onClick={loadAll}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 mt-6">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Users</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Users" value={stats.totalUsers} color="blue" />
                <StatCard label="Premium Users" value={stats.premiumUsers} sub={`${Math.round(stats.premiumUsers / (stats.totalUsers || 1) * 100)}% of total`} color="amber" />
                <StatCard label="Founders" value={stats.founders} color="violet" />
                <StatCard label="Service Providers" value={stats.serviceProviders} color="emerald" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Activity</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Matches" value={stats.totalMatches} color="violet" />
                <StatCard label="Messages Sent" value={stats.totalMessages} color="blue" />
                <StatCard label="Feed Posts" value={stats.totalPosts} color="emerald" />
                <StatCard label="Approved Posts" value={stats.approvedPosts} sub={`${Math.round(stats.approvedPosts / (stats.totalPosts || 1) * 100)}% approval`} color="emerald" />
              </div>
            </div>

            {/* Recent signups */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Signups</h2>
              <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                {profiles.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                      {p.display_name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.display_name}</p>
                      <p className="text-xs text-slate-400">{timeAgo(p.created_date)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[p.profile_type] ?? 'bg-slate-100 text-slate-500'}`}>
                      {p.profile_type?.replace('_', ' ') ?? 'unknown'}
                    </span>
                    {p.is_premium && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or type..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={userTypeFilter}
                onChange={e => setUserTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                <option value="all">All types</option>
                <option value="founder">Founder</option>
                <option value="investor">Investor</option>
                <option value="service_provider">Service Provider</option>
                <option value="advisor">Advisor</option>
              </select>
            </div>

            <p className="text-xs text-slate-400">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</p>

            <div className="space-y-2">
              {filteredUsers.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500 flex-shrink-0 overflow-hidden">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : p.display_name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{p.display_name}</p>
                        {p.is_admin && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
                        )}
                        {p.is_premium && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[p.profile_type] ?? 'bg-slate-100 text-slate-500'}`}>
                          {p.profile_type?.replace('_', ' ') ?? 'unknown'}
                        </span>
                        <span className="text-xs text-slate-400">{p.location || 'No location'}</span>
                        <span className="text-xs text-slate-400">Joined {timeAgo(p.created_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {/* Tier selector */}
                    <select
                      value={p.subscription_tier ?? 'free'}
                      onChange={e => changeTier(p, e.target.value)}
                      disabled={updatingUser === p.id}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                    >
                      {TIER_OPTIONS.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      variant={p.is_premium ? 'outline' : 'default'}
                      className={p.is_premium ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                      disabled={updatingUser === p.id}
                      onClick={() => togglePremium(p)}
                    >
                      {updatingUser === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          {p.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={p.is_admin ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                      disabled={updatingUser === p.id}
                      onClick={() => toggleAdmin(p)}
                    >
                      <ShieldAlert className="w-3 h-3 mr-1" />
                      {p.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FEED TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'feed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filter pills */}
            <div className="flex gap-2">
              {['all', 'approved', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setFeedFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                    feedFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {f}
                </button>
              ))}
              <span className="text-xs text-slate-400 self-center ml-1">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {filteredPosts.map(post => {
                const author = profileMap[post.author_profile_id];
                return (
                  <div key={post.id} className="bg-white rounded-xl border border-slate-100 p-4">
                    {/* Author + meta */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                        {author?.display_name?.[0] ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{author?.display_name ?? 'Unknown'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-500'}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{timeAgo(post.created_at)}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{post.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 mb-3">{post.content}</p>

                    {/* Status + actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.approved ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}

                      {post.rejection_reason && (
                        <span className="text-xs text-slate-400 truncate max-w-xs">{post.rejection_reason}</span>
                      )}

                      <div className="flex gap-2 ml-auto">
                        {!post.approved && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                            disabled={updatingPost === post.id}
                            onClick={() => setPostApproval(post, true)}
                          >
                            {updatingPost === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}
                          </Button>
                        )}
                        {post.approved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 h-7 text-xs"
                            disabled={updatingPost === post.id}
                            onClick={() => setPostApproval(post, false)}
                          >
                            {updatingPost === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reject'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-500 h-7 w-7 p-0"
                          disabled={updatingPost === post.id}
                          onClick={() => deletePost(post)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPosts.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <Rss className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No posts in this filter</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

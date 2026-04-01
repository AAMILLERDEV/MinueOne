import React, { useState, useEffect, useRef } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Rss, Plus, X, AlertCircle, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

// Set to true to re-enable AI content moderation (requires Anthropic API credits)
const AI_MODERATION_ENABLED = false;

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'growth', label: 'Growth' },
  { id: 'fundraising', label: 'Fundraising' },
  { id: 'legal', label: 'Legal' },
  { id: 'tech', label: 'Tech' },
  { id: 'hiring', label: 'Hiring' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'operations', label: 'Operations' },
  { id: 'finance', label: 'Finance' },
  { id: 'product', label: 'Product' },
];

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

function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Feed() {
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [composerError, setComposerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'growth', imageUrls: [] });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await minus1.auth.me();
      const myProfiles = await minus1.entities.Profile.filter({ user_id: user.id });
      if (myProfiles.length) setMyProfile(myProfiles[0]);

      const allPosts = await minus1.entities.FeedPost.list('-created_at');
      setPosts(allPosts);

      // Load author profiles for all posts
      const authorIds = [...new Set(allPosts.map(p => p.author_profile_id))];
      if (authorIds.length) {
        const allProfiles = await minus1.entities.Profile.list();
        const profileMap = {};
        allProfiles.forEach(p => { profileMap[p.id] = p; });
        setProfiles(profileMap);
      }
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isServiceProvider = myProfile?.profile_type === 'service_provider';
  const isPremium =
    myProfile?.is_premium ||
    ['pro', 'business', 'enterprise'].includes(myProfile?.subscription_tier);
  const canPost = myProfile?.is_admin || (isServiceProvider && isPremium);

  const hasPostedThisWeek = () => {
    if (!myProfile) return false;
    const now = new Date();
    const week = getISOWeek(now);
    const year = now.getFullYear();
    return posts.some(
      p =>
        p.author_profile_id === myProfile.id &&
        p.post_week === week &&
        p.post_year === year
    );
  };

  const filteredPosts =
    activeCategory === 'all'
      ? posts
      : posts.filter(p => p.category === activeCategory);

  const resizeImage = (file, maxPx = 1200, quality = 0.8) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', quality);
      };
      img.src = url;
    });

  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const toUpload = files.slice(0, 2 - form.imageUrls.length);
    setUploadingImages(true);
    try {
      const urls = await Promise.all(
        toUpload.map(async file => {
          const resized = await resizeImage(file);
          return minus1.integrations.Core.UploadFile({ file: resized }).then(r => r.file_url);
        })
      );
      setForm(f => ({ ...f, imageUrls: [...f.imageUrls, ...urls] }));
    } catch (err) {
      setComposerError('Image upload failed. Please try again.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== index) }));

  const closeComposer = () => {
    setShowComposer(false);
    setComposerError('');
    setForm({ title: '', content: '', category: 'growth', imageUrls: [] });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setComposerError('Please fill in both the title and content.');
      return;
    }
    if (!myProfile?.is_admin && hasPostedThisWeek()) {
      setComposerError('You can only share one insight per week.');
      return;
    }

    setSubmitting(true);
    setComposerError('');

    try {
      // AI moderation: ensure post is genuinely helpful, not just advertising
      if (AI_MODERATION_ENABLED) {
      const moderation = await minus1.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator for a founder community feed. Evaluate whether this post is genuinely helpful educational content for startup founders, or primarily advertising/self-promotion.

Title: ${form.title}
Content: ${form.content}

Respond with JSON only:
{
  "approved": true/false,
  "reason": "brief explanation"
}

Approve if: actionable insights, expert knowledge, practical advice, case studies, frameworks, lessons learned.
Reject if: primarily promoting a service/product, generic sales pitch, no actionable value, purely self-promotional.`,
        response_json_schema: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            reason: { type: 'string' },
          },
        },
      });

      if (!moderation.approved) {
        setComposerError(
          `Post not approved: ${moderation.reason}. Please revise to focus on actionable insights for founders rather than promotion.`
        );
        setSubmitting(false);
        return;
      }
      } // end AI_MODERATION_ENABLED

      const now = new Date();
      const created = await minus1.entities.FeedPost.create({
        author_profile_id: myProfile.id,
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        image_urls: form.imageUrls,
        approved: true,
        post_week: getISOWeek(now),
        post_year: now.getFullYear(),
      });

      setPosts(prev => [created, ...prev]);
      setProfiles(prev => ({ ...prev, [myProfile.id]: myProfile }));
      setForm({ title: '', content: '', category: 'growth', imageUrls: [] });
      setShowComposer(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setComposerError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 pt-12 pb-4">
        <div className="flex items-start justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Rss className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Feed</h1>
            </div>
            <p className="text-sm text-slate-500">Expert insights for founders</p>
          </div>
          {canPost && (
            <Button
              onClick={() => setShowComposer(true)}
              disabled={!myProfile?.is_admin && hasPostedThisWeek()}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Share Insight
            </Button>
          )}
        </div>

        {/* Category filter */}
        <div className="mt-4 max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly limit notice for service providers */}
      {canPost && !myProfile?.is_admin && hasPostedThisWeek() && (
        <div className="max-w-lg mx-auto px-5 mt-4">
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            You've shared your insight for this week. Come back next week!
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="max-w-lg mx-auto px-5 mt-5 space-y-4">
        <AnimatePresence>
          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <Rss className="w-12 h-12 text-slate-200 mb-4" />
              <p className="font-medium text-slate-600">No posts yet</p>
              <p className="text-sm text-slate-400 mt-1">
                {activeCategory === 'all'
                  ? 'No posts yet. Check back soon!'
                  : `No posts in this category yet.`}
              </p>
            </motion.div>
          ) : (
            filteredPosts.map((post, i) => {
              const author = profiles[post.author_profile_id];
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                <div className="p-4">
                  {/* Author row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 font-semibold text-sm">
                      {author?.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        author?.display_name?.[0] ?? '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {author?.display_name ?? 'Expert'}
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-slate-900 text-sm mb-1.5 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                    {post.content}
                  </p>
                </div>
                {/* Images — flush to card edges */}
                {(post.image_urls ?? []).length > 0 && (
                  <div className={`grid gap-0.5 ${post.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {post.image_urls.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="w-full object-cover max-h-64" />
                    ))}
                  </div>
                )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Composer modal */}
      <AnimatePresence>
        {showComposer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={closeComposer}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
            <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Share an Insight</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Share actionable knowledge for founders — not promotional content.
                  </p>
                </div>
                <button
                  onClick={closeComposer}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          form.category === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Title</label>
                  <Input
                    placeholder="e.g. 3 things I wish I knew about fundraising term sheets"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    maxLength={120}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Content</label>
                  <Textarea
                    placeholder="Share your insight, lesson, or framework. Be specific and actionable..."
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={5}
                    maxLength={1500}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {form.content.length}/1500
                  </p>
                </div>

                {/* Photos */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Photos <span className="text-slate-400 font-normal">({form.imageUrls.length}/2)</span>
                  </label>
                  {form.imageUrls.length > 0 && (
                    <div className={`grid gap-2 mb-2 ${form.imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {form.imageUrls.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.imageUrls.length < 2 && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages}
                        className="flex items-center gap-2 w-full border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl px-4 py-3 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                        {uploadingImages ? 'Uploading...' : `Add photos (${2 - form.imageUrls.length} remaining)`}
                      </button>
                    </>
                  )}
                </div>

                {composerError && (
                  <div className="flex gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{composerError}</span>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploadingImages || !form.title.trim() || !form.content.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Reviewing content...
                    </>
                  ) : (
                    'Publish Insight'
                  )}
                </Button>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

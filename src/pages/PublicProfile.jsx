import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft, Globe, Linkedin, MapPin, Tag, Loader2, UserX,
  Briefcase, Calendar, Newspaper,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const profileTypeLabel = {
  founder: 'Founder',
  collaborator: 'Collaborator',
  investor: 'Investor',
  service_provider: 'Service Provider',
  accelerator: 'Accelerator',
  event_organizer: 'Event Organizer',
};

const categoryColors = {
  growth: 'bg-green-100 text-green-700',
  fundraising: 'bg-blue-100 text-blue-700',
  legal: 'bg-red-100 text-red-700',
  tech: 'bg-violet-100 text-violet-700',
  hiring: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
  operations: 'bg-slate-100 text-slate-700',
  finance: 'bg-amber-100 text-amber-700',
  product: 'bg-cyan-100 text-cyan-700',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profileId = searchParams.get('profileId');

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (profileId) loadProfile();
    else setNotFound(true);
  }, [profileId]);

  const loadProfile = async () => {
    try {
      const [allProfiles, allPosts] = await Promise.all([
        minus1.entities.Profile.filter({ id: profileId }),
        minus1.entities.FeedPost.filter({ author_profile_id: profileId, approved: true }, '-created_at'),
      ]);

      if (!allProfiles.length) { setNotFound(true); return; }
      setProfile(allProfiles[0]);
      setPosts(allPosts);
    } catch (err) {
      console.error('Error loading public profile:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-slate-500">
        <UserX className="w-12 h-12 text-slate-300" />
        <p className="font-medium">Profile not found</p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const typeLabel = profileTypeLabel[profile.profile_type] ?? profile.profile_type;

  return (
    <div className="max-w-lg mx-auto pb-28">
      {/* Back button */}
      <div className="px-5 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="px-5">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl">{profile.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl font-bold text-slate-900">{profile.display_name}</h1>
            <Badge variant="outline" className="mt-1 text-xs capitalize">{typeLabel}</Badge>
            {profile.location && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                <MapPin className="w-3 h-3" />{profile.location}
              </p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-slate-700 leading-relaxed mb-4">{profile.bio}</p>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.website_url && (
            <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <Globe className="w-3.5 h-3.5" />Website
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <Linkedin className="w-3.5 h-3.5" />LinkedIn
            </a>
          )}
        </div>

        {/* Tags / skills */}
        {profile.tags?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" />Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Skills for collaborators */}
        {profile.primary_skills?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.primary_skills.map(s => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Founder stage */}
        {profile.stage && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="capitalize">{profile.stage} stage</span>
          </div>
        )}

        <hr className="border-slate-200 my-5" />
      </div>

      {/* Feed posts */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Insights</h2>
          <span className="text-xs text-slate-400">({posts.length})</span>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No published insights yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const catColor = categoryColors[post.category] ?? 'bg-slate-100 text-slate-600';
              return (
                <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs capitalize ${catColor}`}>{post.category}</Badge>
                      <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>
                  {post.image_urls?.length > 0 && (
                    <div className={`grid ${post.image_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {post.image_urls.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-video object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, Upload, MapPin, Crown, EyeOff, Eye, Check, LogOut, ShieldAlert, BarChart3, Lock, X, Building2, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DiscoveryPreferencesEditor from '@/components/DiscoveryPreferencesEditor';
import { VerificationStatus } from '@/components/VerificationBadges';
import PrivacySettings from '@/components/analytics/PrivacySettings';
import FeedbackModal from '@/components/FeedbackModal';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeSection, setActiveSection] = useState('section-profile');

  const navSections = [
    { id: 'section-profile',      label: 'Profile' },
    { id: 'section-verification', label: 'Verification' },
    { id: 'section-discovery',    label: 'Discovery' },
    { id: 'section-team',         label: 'Company' },
    { id: 'section-privacy',      label: 'Privacy' },
    { id: 'section-account',      label: 'Account' },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -70% 0px' }
    );
    navSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [profile]);

  const loadProfile = async () => {
    try {
      const user = await minus1.auth.me();
      setUser(user);
      const profiles = await minus1.entities.Profile.filter({ user_id: user.id });

      if (!profiles.length) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      setProfile(profiles[0]);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await minus1.integrations.Core.UploadFile({ file });
      setProfile(p => ({ ...p, avatar_url: file_url }));
      await minus1.entities.Profile.update(profile.id, { avatar_url: file_url });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setProfile(p => ({ ...p, latitude, longitude }));
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || '';
            const country = data.address.country || '';
            setProfile(p => ({ ...p, location: `${city}${city && country ? ', ' : ''}${country}` }));
          } catch (error) {
            console.error('Error getting location name:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const setLookingFor = (orderedTypes) => {
    setProfile(p => ({ ...p, looking_for: orderedTypes }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await minus1.entities.Profile.update(profile.id, profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    minus1.auth.logout();
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
      <div className="max-w-lg mx-auto px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${createPageUrl('PublicProfile')}?profileId=${profile.id}`)}
            className="gap-1.5 text-slate-600"
          >
            <Eye className="w-4 h-4" />
            View Profile
          </Button>
        </div>
      </div>

      {/* Sticky section nav */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navSections.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Premium Card */}
          {!profile.is_premium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Upgrade to Premium
                  </CardTitle>
                  <CardDescription>
                    Unlock Stealth Mode to browse anonymously and send NDA requests to protect your ideas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-amber-500" />
                      Stealth Mode - browse without being seen
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-amber-500" />
                      Send NDA requests to matches
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-amber-500" />
                      Priority in search results
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stealth Mode (Premium only) */}
          {profile.is_premium && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Stealth Mode</p>
                      <p className="text-sm text-slate-500">Browse without being seen</p>
                    </div>
                  </div>
                  <Switch
                    checked={profile.stealth_mode}
                    onCheckedChange={(checked) => setProfile(p => ({ ...p, stealth_mode: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Info */}
          <div id="section-profile" className="scroll-mt-14">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">Change Photo</span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Your legal name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={profile.display_name || ''}
                    onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="Shown publicly"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Profile Type</Label>
                <select
                  value={profile.profile_type || ''}
                  onChange={(e) => setProfile(p => ({ ...p, profile_type: e.target.value }))}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select type…</option>
                  <option value="founder">Founder</option>
                  <option value="collaborator">Collaborator</option>
                  <option value="investor">Investor</option>
                  <option value="accelerator">Accelerator</option>
                  <option value="service_provider">Service Provider</option>
                  <option value="event_organizer">Event Organizer</option>
                </select>
              </div>

              <div>
                <Label>Industry</Label>
                <select
                  value={profile.industry || ''}
                  onChange={(e) => setProfile(p => ({ ...p, industry: e.target.value }))}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select industry…</option>
                  {[
                    'AI / Machine Learning', 'B2B SaaS', 'CleanTech', 'Consumer',
                    'Crypto / Web3', 'DeepTech', 'E-commerce', 'EdTech', 'Fintech',
                    'Gaming', 'Healthcare', 'HR Tech', 'Legal Tech', 'Logistics',
                    'MarTech', 'Media', 'PropTech', 'Social Impact', 'Other'
                  ].map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Software Development', 'Mobile Development', 'Data Science', 'AI/ML',
                    'Product Management', 'UX/UI Design', 'Marketing', 'Sales',
                    'Business Development', 'Finance', 'Legal', 'Operations',
                    'Content Creation', 'Growth Hacking', 'DevOps', 'Fundraising'
                  ].map(skill => {
                    const selected = (profile.skills || []).includes(skill);
                    return (
                      <Badge
                        key={skill}
                        variant={selected ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs ${selected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:border-slate-400'}`}
                        onClick={() => setProfile(p => ({
                          ...p,
                          skills: selected
                            ? (p.skills || []).filter(s => s !== skill)
                            : [...(p.skills || []), skill]
                        }))}
                      >
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell others about yourself, your experience, and what you're looking for…"
                  className="mt-1.5 h-24"
                />
              </div>

              <div>
                <Label>Location</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={profile.location || ''}
                    onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                    placeholder="City, Country"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={getLocation} type="button">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={profile.linkedin_url || ''}
                    onChange={(e) => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
                    placeholder="linkedin.com/in/…"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={profile.website_url || ''}
                    onChange={(e) => setProfile(p => ({ ...p, website_url: e.target.value }))}
                    placeholder="https://…"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Profile Verification */}
          <div id="section-verification" className="scroll-mt-14">
          <Card>
            <CardHeader>
              <CardTitle>Profile Verification</CardTitle>
              <CardDescription>Verified profiles get more matches and build trust</CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationStatus profile={profile} user={user} />
            </CardContent>
          </Card>
          </div>

          {/* Looking For / Discovery Preferences */}
          <div id="section-discovery" className="scroll-mt-14">
          <Card>
            <CardHeader>
              <CardTitle>Discovery Preferences</CardTitle>
              <CardDescription>
                Choose who you want to discover and drag to set your priority — higher-ranked types
                appear more often in your feed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiscoveryPreferencesEditor
                value={profile.looking_for || []}
                onChange={setLookingFor}
              />
            </CardContent>
          </Card>
          </div>

          {/* Company */}
          <div id="section-team" className="scroll-mt-14">
          <Card>
            <CardHeader>
              <CardTitle>Company</CardTitle>
              <CardDescription>Manage your company, team collaboration, and milestone checklist</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => navigate(createPageUrl('Company'))}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:border-blue-400 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">Go to Company tab</p>
                  <p className="text-sm text-slate-500">Create a company, manage employees, teams, and your milestone checklist</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </button>
            </CardContent>
          </Card>
          </div>

          {/* Privacy & Data Settings */}
          <div id="section-privacy" className="scroll-mt-14">
            <PrivacySettings />
          </div>

          {/* Account actions */}
          <div id="section-account" className="scroll-mt-14 space-y-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowFeedback(true)}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Send Feedback
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Analytics'))}
              className="w-full relative"
            >
              <BarChart3 className="w-4 h-4 text-purple-500 mr-2" />
              Profile Analytics
              <span className="absolute right-3">
                {profile.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(profile.subscription_tier) ? (
                  <Crown className="w-4 h-4 text-amber-500" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
              </span>
            </Button>

            {profile.is_admin && (
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('Admin'))}
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-slate-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        myProfileId={profile?.id}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, Upload, MapPin, Crown, EyeOff, Check, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LookingForSelector from '@/components/LookingForSelector';
import { VerificationStatus } from '@/components/VerificationBadges';
import PrivacySettings from '@/components/analytics/PrivacySettings';
import TeamLinkManager from '@/components/team/TeamLinkManager';
import FeedbackModal from '@/components/FeedbackModal';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.Profile.filter({ user_id: user.id });
      
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfile(p => ({ ...p, avatar_url: file_url }));
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

  const toggleLookingFor = (id) => {
    setProfile(p => ({
      ...p,
      looking_for: p.looking_for.includes(id)
        ? p.looking_for.filter(i => i !== id)
        : [...p.looking_for, id]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Profile.update(profile.id, profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
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
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

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

              <div>
                <Label>Display Name</Label>
                <Input
                  value={profile.display_name}
                  onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                  className="mt-1.5 h-24"
                />
              </div>

              <div>
                <Label>Location</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={profile.location || ''}
                    onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
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
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={profile.website_url || ''}
                    onChange={(e) => setProfile(p => ({ ...p, website_url: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Verification</CardTitle>
              <CardDescription>Verified profiles get more matches and build trust</CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationStatus profile={profile} />
            </CardContent>
          </Card>

          {/* Looking For */}
          <Card>
            <CardHeader>
              <CardTitle>Looking For</CardTitle>
              <CardDescription>Select the types of profiles you want to discover</CardDescription>
            </CardHeader>
            <CardContent>
              <LookingForSelector
                selected={profile.looking_for || []}
                onToggle={toggleLookingFor}
              />
            </CardContent>
          </Card>

          {/* Team Collaboration (Premium) */}
          <Card>
            <CardHeader>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>Link your co-founders, advisors, and team members</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamLinkManager
                myProfile={profile}
                isPremium={profile.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(profile.subscription_tier)}
                onUpgrade={() => setProfile(p => ({ ...p, is_premium: true }))}
              />
            </CardContent>
          </Card>

          {/* Privacy & Data Settings */}
          <PrivacySettings />

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-slate-800"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          {/* Send Feedback */}
          <Button 
            variant="outline"
            onClick={() => setShowFeedback(true)}
            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Send Feedback
          </Button>

          {/* Logout */}
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

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        myProfileId={profile?.id}
      />
    </div>
  );
}
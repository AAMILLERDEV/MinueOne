import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Upload, MapPin } from 'lucide-react';
import AIProfileAssistant from '@/components/AIProfileAssistant';

const languages = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Italian'
];

const availabilityOptions = [
  { id: 'full_time', label: 'Full-time' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'project_based', label: 'Project-based' },
];

const collaborationTypes = [
  { id: 'equity', label: 'Equity Only' },
  { id: 'paid', label: 'Paid Only' },
  { id: 'equity_paid', label: 'Equity + Paid' },
  { id: 'advisory', label: 'Advisory' },
];

export default function UniversalFields({ profile, setProfile, onImageUpload, onGetLocation, isPremium = false, onUpgrade }) {
  const toggleLanguage = (lang) => {
    const languages = profile.languages || [];
    setProfile(p => ({
      ...p,
      languages: languages.includes(lang)
        ? languages.filter(l => l !== lang)
        : [...languages, lang]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Your Profile</h2>
        <p className="text-slate-500 mt-1">Tell us about yourself or your organization</p>
      </div>

      {/* Profile Type Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-900">Company Profile</p>
          <p className="text-sm text-slate-500">Toggle if this is a company profile</p>
        </div>
        <Switch
          checked={profile.is_company_profile || false}
          onCheckedChange={(checked) => setProfile(p => ({ ...p, is_company_profile: checked }))}
        />
      </div>

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
            onChange={onImageUpload}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button variant="outline" size="sm" asChild>
              <span className="cursor-pointer">Upload Photo</span>
            </Button>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{profile.is_company_profile ? 'Company Name' : 'Your Name'}</Label>
          <Input
            value={profile.display_name || ''}
            onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
            placeholder={profile.is_company_profile ? "Enter company name" : "Enter your name"}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
            placeholder="Tell others about yourself, your experience, and what you're looking for..."
            className="mt-1.5 h-28"
          />
        </div>

        {/* AI Profile Assistant */}
        <AIProfileAssistant 
          profile={profile}
          setProfile={setProfile}
          isPremium={isPremium}
          onUpgrade={onUpgrade}
        />

        <div>
          <Label>Location</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={profile.location || ''}
              onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
              placeholder="City, Country"
              className="flex-1"
            />
            <Button variant="outline" onClick={onGetLocation} type="button">
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Remote Friendly */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium text-sm">Remote Friendly</p>
            <p className="text-xs text-slate-500">Open to remote collaboration</p>
          </div>
          <Switch
            checked={profile.remote_friendly || false}
            onCheckedChange={(checked) => setProfile(p => ({ ...p, remote_friendly: checked }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>LinkedIn</Label>
            <Input
              value={profile.linkedin_url || ''}
              onChange={(e) => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
              placeholder="linkedin.com/in/..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={profile.website_url || ''}
              onChange={(e) => setProfile(p => ({ ...p, website_url: e.target.value }))}
              placeholder="https://..."
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Languages */}
        <div>
          <Label>Languages Spoken</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {languages.map(lang => (
              <Badge
                key={lang}
                variant={(profile.languages || []).includes(lang) ? 'default' : 'outline'}
                className={`cursor-pointer ${(profile.languages || []).includes(lang) ? 'bg-blue-600' : ''}`}
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <Label>Availability</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {availabilityOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setProfile(p => ({ ...p, availability: opt.id }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  profile.availability === opt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Hours per week */}
        <div>
          <Label>Hours per Week</Label>
          <Input
            type="number"
            value={profile.hours_per_week || ''}
            onChange={(e) => setProfile(p => ({ ...p, hours_per_week: Number(e.target.value) || null }))}
            placeholder="e.g. 20"
            className="mt-1.5"
          />
        </div>

        {/* Collaboration Type */}
        <div>
          <Label>Preferred Collaboration Type</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {collaborationTypes.map(opt => (
              <button
                key={opt.id}
                onClick={() => setProfile(p => ({ ...p, collaboration_type: opt.id }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  profile.collaboration_type === opt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyticsService } from './AnalyticsService';

const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const genders = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non_binary', label: 'Non-binary' },
  { id: 'other', label: 'Other' }
];
const educationLevels = [
  { id: 'high_school', label: 'High School' },
  { id: 'some_college', label: 'Some College' },
  { id: 'bachelors', label: "Bachelor's" },
  { id: 'masters', label: "Master's" },
  { id: 'doctorate', label: 'Doctorate' },
  { id: 'trade_school', label: 'Trade School' }
];
const industries = [
  { id: 'tech', label: 'Technology' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'retail', label: 'Retail' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'legal', label: 'Legal' },
  { id: 'media', label: 'Media' },
  { id: 'nonprofit', label: 'Nonprofit' },
  { id: 'government', label: 'Government' },
  { id: 'other', label: 'Other' }
];
const experienceYears = ['0-2', '3-5', '6-10', '11-20', '20+'];
const collaborationIntents = [
  { id: 'cofounder', label: 'Finding a Co-founder' },
  { id: 'advisor', label: 'Seeking Advisors' },
  { id: 'employee', label: 'Hiring Team' },
  { id: 'investor_seeking', label: 'Raising Funds' },
  { id: 'service_client', label: 'Finding Services' },
  { id: 'networking', label: 'General Networking' }
];

export default function OptionalDemographics({ onComplete, initialData = {} }) {
  const [expanded, setExpanded] = useState(false);
  const [demographics, setDemographics] = useState({
    age_range: initialData.age_range || null,
    gender: initialData.gender || null,
    education_level: initialData.education_level || null,
    industry: initialData.industry || null,
    experience_years_bucket: initialData.experience_years_bucket || null,
    collaboration_intent: initialData.collaboration_intent || null
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const filteredData = Object.fromEntries(
      Object.entries(demographics).filter(([_, v]) => v !== null)
    );
    await AnalyticsService.updateDemographics(filteredData);
    onComplete?.(filteredData);
    setSaving(false);
    setExpanded(false);
  };

  const filledCount = Object.values(demographics).filter(v => v !== null).length;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Help improve the platform</p>
              <p className="text-sm text-slate-500">Optional: Share anonymous demographics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {filledCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {filledCount}/6
              </Badge>
            )}
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(false)}
        className="w-full p-4 flex items-center justify-between border-b border-slate-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-900">Anonymous Demographics</p>
            <p className="text-sm text-slate-500">All fields are optional</p>
          </div>
        </div>
        <ChevronUp className="w-5 h-5 text-slate-400" />
      </button>

      <div className="p-4 space-y-4">
        {/* Age Range */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Age Range</p>
          <div className="flex flex-wrap gap-2">
            {ageRanges.map(range => (
              <button
                key={range}
                onClick={() => setDemographics(d => ({ ...d, age_range: d.age_range === range ? null : range }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  demographics.age_range === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Gender</p>
          <div className="flex flex-wrap gap-2">
            {genders.map(g => (
              <button
                key={g.id}
                onClick={() => setDemographics(d => ({ ...d, gender: d.gender === g.id ? null : g.id }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  demographics.gender === g.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Education Level</p>
          <div className="flex flex-wrap gap-2">
            {educationLevels.map(e => (
              <button
                key={e.id}
                onClick={() => setDemographics(d => ({ ...d, education_level: d.education_level === e.id ? null : e.id }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  demographics.education_level === e.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Industry</p>
          <div className="flex flex-wrap gap-2">
            {industries.map(i => (
              <button
                key={i.id}
                onClick={() => setDemographics(d => ({ ...d, industry: d.industry === i.id ? null : i.id }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  demographics.industry === i.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Years of Experience</p>
          <div className="flex flex-wrap gap-2">
            {experienceYears.map(y => (
              <button
                key={y}
                onClick={() => setDemographics(d => ({ ...d, experience_years_bucket: d.experience_years_bucket === y ? null : y }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  demographics.experience_years_bucket === y
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                {y} years
              </button>
            ))}
          </div>
        </div>

        {/* Intent */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Primary Goal</p>
          <div className="flex flex-wrap gap-2">
            {collaborationIntents.map(i => (
              <button
                key={i.id}
                onClick={() => setDemographics(d => ({ ...d, collaboration_intent: d.collaboration_intent === i.id ? null : i.id }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  demographics.collaboration_intent === i.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setExpanded(false)} className="flex-1">
            Skip
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          This data is stored anonymously and never linked to your profile.
        </p>
      </div>
    </motion.div>
  );
}
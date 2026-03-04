import React from 'react';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const stages = [
  { id: 'idea', label: 'Idea' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'validation', label: 'Validation' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'scaling', label: 'Scaling' },
];

const archetypes = [
  { id: 'visionary', label: 'Visionary', desc: 'Big picture thinker, sets the vision' },
  { id: 'hacker', label: 'Hacker', desc: 'Technical builder, makes things work' },
  { id: 'hustler', label: 'Hustler', desc: 'Sales & growth focused, gets customers' },
  { id: 'designer', label: 'Designer', desc: 'UX/product focused, designs experiences' },
];

const founderTags = [
  'Serial Entrepreneur', 'First-time Founder', 'Technical Background', 
  'Business Background', 'Industry Expert', 'Side Project', 'Full-time Committed'
];

const targetCustomers = [
  { id: 'b2b', label: 'B2B' },
  { id: 'b2c', label: 'B2C' },
  { id: 'smb', label: 'SMB' },
  { id: 'enterprise', label: 'Enterprise' },
];

const marketTypes = [
  { id: 'niche', label: 'Niche' },
  { id: 'growing', label: 'Growing' },
  { id: 'competitive', label: 'Competitive' },
];

const helpNeededOptions = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Operations', 'Legal', 'Finance'];

const timelineOptions = [
  { id: 'exploring', label: 'Exploring', desc: 'Just exploring ideas' },
  { id: 'actively_building', label: 'Actively Building', desc: 'Working on MVP or product' },
  { id: 'fundraising_soon', label: 'Fundraising Soon', desc: 'Preparing to raise capital' },
];

export default function FounderFields({ profile, setProfile, toggleArrayItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Founder Details</h2>
        <p className="text-slate-500 mt-1">Tell us about your startup journey</p>
      </div>

      {/* Stage */}
      <div>
        <Label>Startup Stage</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {stages.map(s => (
            <Badge
              key={s.id}
              variant={profile.stage === s.id ? 'default' : 'outline'}
              className={`cursor-pointer ${profile.stage === s.id ? 'bg-blue-600' : ''}`}
              onClick={() => setProfile(p => ({ ...p, stage: s.id }))}
            >
              {s.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Archetype */}
      <div>
        <Label>Founder Archetype</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {archetypes.map(a => (
            <button
              key={a.id}
              onClick={() => setProfile(p => ({ ...p, archetype: a.id }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                profile.archetype === a.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm">{a.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {founderTags.map(tag => (
            <Badge
              key={tag}
              variant={(profile.tags || []).includes(tag) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.tags || []).includes(tag) ? 'bg-slate-700' : ''}`}
              onClick={() => toggleArrayItem('tags', tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Problem Statement */}
      <div>
        <Label>Problem Statement</Label>
        <Textarea
          value={profile.problem_statement || ''}
          onChange={(e) => setProfile(p => ({ ...p, problem_statement: e.target.value }))}
          placeholder="What problem are you solving? Who are you solving it for?"
          className="mt-1.5 h-24"
        />
      </div>

      {/* Target Customer */}
      <div>
        <Label>Target Customer</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {targetCustomers.map(tc => (
            <Badge
              key={tc.id}
              variant={profile.target_customer === tc.id ? 'default' : 'outline'}
              className={`cursor-pointer ${profile.target_customer === tc.id ? 'bg-blue-600' : ''}`}
              onClick={() => setProfile(p => ({ ...p, target_customer: tc.id }))}
            >
              {tc.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Market Type */}
      <div>
        <Label>Market Type</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {marketTypes.map(mt => (
            <Badge
              key={mt.id}
              variant={profile.market_type === mt.id ? 'default' : 'outline'}
              className={`cursor-pointer ${profile.market_type === mt.id ? 'bg-blue-600' : ''}`}
              onClick={() => setProfile(p => ({ ...p, market_type: mt.id }))}
            >
              {mt.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Help Needed */}
      <div>
        <Label>What Help Are You Looking For?</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {helpNeededOptions.map(help => (
            <Badge
              key={help}
              variant={(profile.help_needed || []).includes(help) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.help_needed || []).includes(help) ? 'bg-cyan-600' : ''}`}
              onClick={() => toggleArrayItem('help_needed', help)}
            >
              {help}
            </Badge>
          ))}
        </div>
      </div>

      {/* Equity Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Equity Offer (%)</Label>
          <Input
            type="number"
            value={profile.equity_range_min || ''}
            onChange={(e) => setProfile(p => ({ ...p, equity_range_min: Number(e.target.value) || null }))}
            placeholder="e.g. 5"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Max Equity Offer (%)</Label>
          <Input
            type="number"
            value={profile.equity_range_max || ''}
            onChange={(e) => setProfile(p => ({ ...p, equity_range_max: Number(e.target.value) || null }))}
            placeholder="e.g. 20"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Timeline Urgency */}
      <div>
        <Label>Timeline</Label>
        <div className="space-y-2 mt-2">
          {timelineOptions.map(t => (
            <button
              key={t.id}
              onClick={() => setProfile(p => ({ ...p, timeline_urgency: t.id }))}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                profile.timeline_urgency === t.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs text-slate-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const programTypes = [
  { id: 'cohort', label: 'Cohort-based', desc: 'Fixed start and end dates' },
  { id: 'rolling', label: 'Rolling', desc: 'Accept startups year-round' },
  { id: 'residency', label: 'Residency', desc: 'Long-term in-residence program' },
];

const focusAreas = ['Tech', 'Healthcare', 'Fintech', 'CleanTech', 'Consumer', 'B2B SaaS', 'DeepTech', 'Social Impact', 'E-commerce', 'EdTech', 'Hardware', 'AI/ML'];

const benefitsOptions = ['Mentorship', 'Funding', 'Office Space', 'Community', 'Legal Support', 'Accounting Support', 'Investor Introductions', 'Demo Day', 'Perks & Credits'];

export default function AcceleratorFields({ profile, setProfile, toggleArrayItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Accelerator Details</h2>
        <p className="text-slate-500 mt-1">Tell us about your program</p>
      </div>

      {/* Program Type */}
      <div>
        <Label>Program Type</Label>
        <div className="space-y-2 mt-2">
          {programTypes.map(pt => (
            <button
              key={pt.id}
              onClick={() => setProfile(p => ({ ...p, program_type: pt.id }))}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                profile.program_type === pt.id 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm">{pt.label}</p>
              <p className="text-xs text-slate-500">{pt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div>
        <Label>Focus Areas</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {focusAreas.map(area => (
            <Badge
              key={area}
              variant={(profile.focus_areas || []).includes(area) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.focus_areas || []).includes(area) ? 'bg-amber-500' : ''}`}
              onClick={() => toggleArrayItem('focus_areas', area)}
            >
              {area}
            </Badge>
          ))}
        </div>
      </div>

      {/* Equity & Funding */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Equity Taken (%)</Label>
          <Input
            type="number"
            value={profile.equity_taken || ''}
            onChange={(e) => setProfile(p => ({ ...p, equity_taken: Number(e.target.value) || null }))}
            placeholder="e.g. 7"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Funding Offered ($)</Label>
          <Input
            type="number"
            value={profile.funding_offered || ''}
            onChange={(e) => setProfile(p => ({ ...p, funding_offered: Number(e.target.value) || null }))}
            placeholder="e.g. 150000"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Next Intake */}
      <div>
        <Label>Next Intake Date</Label>
        <Input
          type="date"
          value={profile.next_intake_date || ''}
          onChange={(e) => setProfile(p => ({ ...p, next_intake_date: e.target.value }))}
          className="mt-1.5"
        />
      </div>

      {/* Benefits Offered */}
      <div>
        <Label>Benefits Offered</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {benefitsOptions.map(benefit => (
            <Badge
              key={benefit}
              variant={(profile.benefits_offered || []).includes(benefit) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.benefits_offered || []).includes(benefit) ? 'bg-amber-500' : ''}`}
              onClick={() => toggleArrayItem('benefits_offered', benefit)}
            >
              {benefit}
            </Badge>
          ))}
        </div>
      </div>

      {/* Founder Match Facilitation */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-900">Founder Matching</p>
          <p className="text-sm text-slate-500">Help facilitate co-founder matching</p>
        </div>
        <Switch
          checked={profile.founder_match_facilitation || false}
          onCheckedChange={(checked) => setProfile(p => ({ ...p, founder_match_facilitation: checked }))}
        />
      </div>
    </motion.div>
  );
}
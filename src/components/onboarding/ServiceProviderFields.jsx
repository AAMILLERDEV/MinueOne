import React from 'react';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const serviceTypes = [
  'Legal', 'Accounting', 'Marketing', 'Design', 'Development', 
  'HR & Recruitment', 'PR & Communications', 'Strategy Consulting', 
  'Fundraising Advisory', 'CFO Services', 'Tax Advisory', 'IP & Patents'
];

const stageFocus = ['Idea', 'Discovery', 'Validation', 'Efficiency', 'Scaling', 'All Stages'];

export default function ServiceProviderFields({ profile, setProfile, toggleArrayItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Service Provider Details</h2>
        <p className="text-slate-500 mt-1">Tell us about your services</p>
      </div>

      {/* Service Types */}
      <div>
        <Label>Services Offered</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {serviceTypes.map(service => (
            <Badge
              key={service}
              variant={(profile.service_types || []).includes(service) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.service_types || []).includes(service) ? 'bg-rose-500' : ''}`}
              onClick={() => toggleArrayItem('service_types', service)}
            >
              {service}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stage Focus */}
      <div>
        <Label>Startup Stage Focus</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {stageFocus.map(stage => (
            <Badge
              key={stage}
              variant={(profile.service_stage_focus || []).includes(stage) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.service_stage_focus || []).includes(stage) ? 'bg-rose-500' : ''}`}
              onClick={() => toggleArrayItem('service_stage_focus', stage)}
            >
              {stage}
            </Badge>
          ))}
        </div>
      </div>

      {/* Past Clients */}
      <div>
        <Label>Past Startup Clients</Label>
        <Textarea
          value={profile.past_clients || ''}
          onChange={(e) => setProfile(p => ({ ...p, past_clients: e.target.value }))}
          placeholder="Notable startups you've worked with..."
          className="mt-1.5 h-20"
        />
      </div>

      {/* Certifications */}
      <div>
        <Label>Certifications / Regulatory Status</Label>
        <Input
          value={profile.certifications || ''}
          onChange={(e) => setProfile(p => ({ ...p, certifications: e.target.value }))}
          placeholder="e.g. CPA, Licensed Attorney, etc."
          className="mt-1.5"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-900">Free Intro Call</p>
            <p className="text-sm text-slate-500">Offer free introductory calls</p>
          </div>
          <Switch
            checked={profile.free_intro_call || false}
            onCheckedChange={(checked) => setProfile(p => ({ ...p, free_intro_call: checked }))}
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-900">Startup Discounts</p>
            <p className="text-sm text-slate-500">Offer special pricing for startups</p>
          </div>
          <Switch
            checked={profile.startup_discounts || false}
            onCheckedChange={(checked) => setProfile(p => ({ ...p, startup_discounts: checked }))}
          />
        </div>
      </div>
    </motion.div>
  );
}
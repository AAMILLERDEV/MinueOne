import React from 'react';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, AlertCircle } from 'lucide-react';

const eventTags = [
  'Startup', 'VC & Investing', 'Tech', 'AI/ML', 'Web3', 'SaaS', 
  'Networking', 'Demo Day', 'Hackathon', 'Conference', 'Summit', 'Pitch Competition'
];

export default function EventOrganizerFields({ profile, setProfile, toggleArrayItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Event Details</h2>
        <p className="text-slate-500 mt-1">Tell attendees about your event</p>
      </div>

      {/* Verification Notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Verification Required</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Event organizer profiles require identity and event verification before going live. Our team will reach out within 24 hours.
          </p>
        </div>
      </div>

      <div>
        <Label>Event Name</Label>
        <Input
          value={profile.event_name || ''}
          onChange={e => setProfile(p => ({ ...p, event_name: e.target.value }))}
          placeholder="e.g. TechCrunch Disrupt 2026"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Event Date</Label>
        <div className="flex items-center gap-2 mt-1.5">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <Input
            type="date"
            value={profile.event_date || ''}
            onChange={e => setProfile(p => ({ ...p, event_date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Event Description</Label>
        <Textarea
          value={profile.event_description || ''}
          onChange={e => setProfile(p => ({ ...p, event_description: e.target.value }))}
          placeholder="What is your event about? Who should attend?"
          className="mt-1.5 h-24"
        />
      </div>

      <div>
        <Label>Event Website</Label>
        <Input
          value={profile.event_website || ''}
          onChange={e => setProfile(p => ({ ...p, event_website: e.target.value }))}
          placeholder="https://yourevent.com"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Expected Attendees</Label>
        <Input
          type="number"
          value={profile.expected_attendees || ''}
          onChange={e => setProfile(p => ({ ...p, expected_attendees: Number(e.target.value) || null }))}
          placeholder="e.g. 500"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Event Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {eventTags.map(tag => (
            <Badge
              key={tag}
              variant={(profile.tags || []).includes(tag) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.tags || []).includes(tag) ? 'bg-cyan-600' : ''}`}
              onClick={() => toggleArrayItem('tags', tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <p className="font-medium text-sm">Attendee Networking</p>
          <p className="text-xs text-slate-500">Enable attendees to discover each other on Minus1</p>
        </div>
        <Switch
          checked={profile.founder_match_facilitation || false}
          onCheckedChange={checked => setProfile(p => ({ ...p, founder_match_facilitation: checked }))}
        />
      </div>
    </motion.div>
  );
}
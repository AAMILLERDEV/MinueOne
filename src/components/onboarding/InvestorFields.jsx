import React from 'react';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const investmentStages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];
const investmentInstruments = ['Equity', 'SAFE', 'Convertible Note', 'Revenue-based', 'Debt'];
const focusAreas = ['Tech', 'Healthcare', 'Fintech', 'CleanTech', 'Consumer', 'B2B SaaS', 'DeepTech', 'Social Impact', 'E-commerce', 'EdTech'];
const geographicRegions = ['North America', 'Europe', 'Asia', 'Latin America', 'Middle East', 'Africa', 'Global'];

export default function InvestorFields({ profile, setProfile, toggleArrayItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Investor Details</h2>
        <p className="text-slate-500 mt-1">Define your investment criteria</p>
      </div>

      {/* Investment Thesis */}
      <div>
        <Label>Investment Thesis</Label>
        <Textarea
          value={profile.investment_thesis || ''}
          onChange={(e) => setProfile(p => ({ ...p, investment_thesis: e.target.value }))}
          placeholder="What's your investment focus and approach?"
          className="mt-1.5 h-24"
        />
      </div>

      {/* Investment Stages */}
      <div>
        <Label>Investment Stages</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {investmentStages.map(stage => (
            <Badge
              key={stage}
              variant={(profile.investment_stages || []).includes(stage) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.investment_stages || []).includes(stage) ? 'bg-violet-500' : ''}`}
              onClick={() => toggleArrayItem('investment_stages', stage)}
            >
              {stage}
            </Badge>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div>
        <Label>Industries / Focus Areas</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {focusAreas.map(area => (
            <Badge
              key={area}
              variant={(profile.investment_industries || []).includes(area) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.investment_industries || []).includes(area) ? 'bg-violet-500' : ''}`}
              onClick={() => toggleArrayItem('investment_industries', area)}
            >
              {area}
            </Badge>
          ))}
        </div>
      </div>

      {/* Ticket Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Ticket Size ($)</Label>
          <Input
            type="number"
            value={profile.ticket_size_min || ''}
            onChange={(e) => setProfile(p => ({ ...p, ticket_size_min: Number(e.target.value) || null }))}
            placeholder="e.g. 50000"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Max Ticket Size ($)</Label>
          <Input
            type="number"
            value={profile.ticket_size_max || ''}
            onChange={(e) => setProfile(p => ({ ...p, ticket_size_max: Number(e.target.value) || null }))}
            placeholder="e.g. 500000"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Investment Instruments */}
      <div>
        <Label>Investment Instruments</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {investmentInstruments.map(instrument => (
            <Badge
              key={instrument}
              variant={(profile.investment_instruments || []).includes(instrument) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.investment_instruments || []).includes(instrument) ? 'bg-violet-500' : ''}`}
              onClick={() => toggleArrayItem('investment_instruments', instrument)}
            >
              {instrument}
            </Badge>
          ))}
        </div>
      </div>

      {/* Geographic Focus */}
      <div>
        <Label>Geographic Focus</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {geographicRegions.map(region => (
            <Badge
              key={region}
              variant={(profile.geographic_focus || []).includes(region) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.geographic_focus || []).includes(region) ? 'bg-violet-500' : ''}`}
              onClick={() => toggleArrayItem('geographic_focus', region)}
            >
              {region}
            </Badge>
          ))}
        </div>
      </div>

      {/* Portfolio Highlights */}
      <div>
        <Label>Portfolio Highlights</Label>
        <Textarea
          value={profile.portfolio_highlights || ''}
          onChange={(e) => setProfile(p => ({ ...p, portfolio_highlights: e.target.value }))}
          placeholder="Notable investments or portfolio companies..."
          className="mt-1.5 h-20"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium text-sm">Office Hours Available</p>
            <p className="text-xs text-slate-500">Open to scheduling office hours</p>
          </div>
          <Switch
            checked={profile.office_hours_available || false}
            onCheckedChange={(checked) => setProfile(p => ({ ...p, office_hours_available: checked }))}
          />
        </div>
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium text-sm">Open to Co-founder Introductions</p>
            <p className="text-xs text-slate-500">Help connect founders with co-founders</p>
          </div>
          <Switch
            checked={profile.open_to_intros || false}
            onCheckedChange={(checked) => setProfile(p => ({ ...p, open_to_intros: checked }))}
          />
        </div>
      </div>
    </motion.div>
  );
}
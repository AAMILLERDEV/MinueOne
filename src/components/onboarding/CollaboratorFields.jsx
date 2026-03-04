import React from 'react';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const skillOptions = [
  'Software Development', 'Mobile Development', 'Data Science', 'AI/ML',
  'Product Management', 'UX/UI Design', 'Marketing', 'Sales', 'Business Development',
  'Finance', 'Legal', 'Operations', 'HR', 'Content Creation', 'Growth Hacking'
];

const experienceOptions = [
  { id: 'none', label: 'None', desc: 'New to startups' },
  { id: 'early_employee', label: 'Early Employee', desc: 'Joined a startup early' },
  { id: 'cofounder', label: 'Co-founder', desc: 'Co-founded a startup' },
  { id: 'exit', label: 'Exit', desc: 'Had a successful exit' },
];

const riskOptions = [
  { id: 'low', label: 'Low', desc: 'Prefer stability' },
  { id: 'medium', label: 'Medium', desc: 'Balanced approach' },
  { id: 'high', label: 'High', desc: 'High risk, high reward' },
];

const motivationOptions = [
  { id: 'learning', label: 'Learning', desc: 'Want to grow and learn' },
  { id: 'building_wealth', label: 'Building Wealth', desc: 'Financial opportunity' },
  { id: 'solving_problem', label: 'Solving Problems', desc: 'Passionate about the mission' },
  { id: 'networking', label: 'Networking', desc: 'Building connections' },
];

const archetypes = [
  { id: 'visionary', label: 'Visionary' },
  { id: 'hacker', label: 'Hacker' },
  { id: 'hustler', label: 'Hustler' },
  { id: 'designer', label: 'Designer' },
  { id: 'any', label: 'Any' },
];

export default function CollaboratorFields({ profile, setProfile, toggleArrayItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Collaborator Details</h2>
        <p className="text-slate-500 mt-1">Tell us about your skills and preferences</p>
      </div>

      {/* Primary Skills */}
      <div>
        <Label>Primary Skills (select top 3)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {skillOptions.map(skill => (
            <Badge
              key={skill}
              variant={(profile.primary_skills || []).includes(skill) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.primary_skills || []).includes(skill) ? 'bg-blue-600' : ''}`}
              onClick={() => {
                const skills = profile.primary_skills || [];
                if (skills.includes(skill)) {
                  setProfile(p => ({ ...p, primary_skills: skills.filter(s => s !== skill) }));
                } else if (skills.length < 3) {
                  setProfile(p => ({ ...p, primary_skills: [...skills, skill] }));
                }
              }}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Secondary Skills */}
      <div>
        <Label>Secondary Skills</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {skillOptions.filter(s => !(profile.primary_skills || []).includes(s)).map(skill => (
            <Badge
              key={skill}
              variant={(profile.secondary_skills || []).includes(skill) ? 'default' : 'outline'}
              className={`cursor-pointer ${(profile.secondary_skills || []).includes(skill) ? 'bg-slate-600' : ''}`}
              onClick={() => toggleArrayItem('secondary_skills', skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Startup Experience */}
      <div>
        <Label>Past Startup Experience</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {experienceOptions.map(exp => (
            <button
              key={exp.id}
              onClick={() => setProfile(p => ({ ...p, startup_experience: exp.id }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                profile.startup_experience === exp.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm">{exp.label}</p>
              <p className="text-xs text-slate-500">{exp.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Risk Tolerance */}
      <div>
        <Label>Risk Tolerance</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {riskOptions.map(risk => (
            <button
              key={risk.id}
              onClick={() => setProfile(p => ({ ...p, risk_tolerance: risk.id }))}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                profile.risk_tolerance === risk.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm">{risk.label}</p>
              <p className="text-xs text-slate-500">{risk.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Motivation */}
      <div>
        <Label>Primary Motivation</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {motivationOptions.map(mot => (
            <button
              key={mot.id}
              onClick={() => setProfile(p => ({ ...p, motivation: mot.id }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                profile.motivation === mot.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm">{mot.label}</p>
              <p className="text-xs text-slate-500">{mot.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Archetype */}
      <div>
        <Label>Preferred Founder Archetype</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {archetypes.map(a => (
            <Badge
              key={a.id}
              variant={profile.preferred_archetype === a.id ? 'default' : 'outline'}
              className={`cursor-pointer ${profile.preferred_archetype === a.id ? 'bg-blue-600' : ''}`}
              onClick={() => setProfile(p => ({ ...p, preferred_archetype: a.id }))}
            >
              {a.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Open to Co-founder */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-900">Open to Co-founder Role</p>
          <p className="text-sm text-slate-500">Interested in becoming a co-founder</p>
        </div>
        <Switch
          checked={profile.open_to_cofounder || false}
          onCheckedChange={(checked) => setProfile(p => ({ ...p, open_to_cofounder: checked }))}
        />
      </div>
    </motion.div>
  );
}
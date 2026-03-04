import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Briefcase, Building2, Wrench, Banknote, CalendarDays } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const profileTypes = [
  {
    id: 'founder',
    label: 'Founder',
    description: 'I have an idea and looking for co-founders or collaborators',
    icon: Lightbulb,
    color: '#6366f1',
    lightBg: 'bg-indigo-50',
  },
  {
    id: 'collaborator',
    label: 'Collaborator',
    description: 'Open to co-founding, ready to join the right project',
    icon: Briefcase,
    color: '#10b981',
    lightBg: 'bg-emerald-50',
  },
  {
    id: 'accelerator',
    label: 'Accelerator',
    description: 'Innovation center, incubator, or accelerator program',
    icon: Building2,
    color: '#f59e0b',
    lightBg: 'bg-amber-50',
  },
  {
    id: 'service_provider',
    label: 'Service Provider',
    description: 'Offering services that startups need (legal, marketing, etc.)',
    icon: Wrench,
    color: '#f43f5e',
    lightBg: 'bg-rose-50',
  },
  {
    id: 'investor',
    label: 'Investor',
    description: 'Angel, VC, or other capital investor',
    icon: Banknote,
    color: '#8b5cf6',
    lightBg: 'bg-violet-50',
  },
  {
    id: 'event_organizer',
    label: 'Event Organizer',
    description: 'Host events and connect your attendees with each other',
    icon: CalendarDays,
    color: '#06b6d4',
    lightBg: 'bg-cyan-50',
    requiresVerification: true,
    requiresPayment: true,
  },
];

export default function ProfileTypeSelector({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      {profileTypes.map((type, index) => {
        const Icon = type.icon;
        const isSelected = selected === type.id;
        
        return (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(type.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4
              ${isSelected 
                ? 'border-slate-900 bg-slate-50 shadow-lg' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl ${type.lightBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6" style={{ color: type.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900">{type.label}</h3>
                {type.requiresVerification && <Badge className="bg-amber-500 text-xs px-1.5 py-0">Verification Required</Badge>}
                {type.requiresPayment && <Badge className="bg-cyan-600 text-xs px-1.5 py-0">Paid</Badge>}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{type.description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all
              ${isSelected 
                ? 'border-slate-900 bg-slate-900' 
                : 'border-slate-300'
              }`}
            >
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
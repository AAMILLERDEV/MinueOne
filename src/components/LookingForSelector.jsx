import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Briefcase, Building2, Wrench, Banknote, Check } from 'lucide-react';

const profileTypes = [
  { id: 'founder', label: 'Founders', icon: Lightbulb, color: 'indigo', desc: 'Connect with entrepreneurs building startups near you' },
  { id: 'collaborator', label: 'Collaborators', icon: Briefcase, color: 'emerald', desc: 'Find people near you who are open to being a co-founder' },
  { id: 'accelerator', label: 'Accelerators', icon: Building2, color: 'amber', desc: 'Find accelerators, innovation centres and more around you' },
  { id: 'service_provider', label: 'Service Providers', icon: Wrench, color: 'rose', desc: 'Discover legal, marketing, and other startup services nearby' },
  { id: 'investor', label: 'Investors', icon: Banknote, color: 'violet', desc: 'Meet angel investors and VCs looking to fund startups like yours' },
];

const colorClasses = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', selectedBg: 'bg-indigo-500' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', selectedBg: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', selectedBg: 'bg-amber-500' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', selectedBg: 'bg-rose-500' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', selectedBg: 'bg-violet-500' },
};

export default function LookingForSelector({ selected = [], onToggle }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {profileTypes.map((type, index) => {
        const Icon = type.icon;
        const isSelected = selected.includes(type.id);
        const colors = colorClasses[type.color];
        
        return (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onToggle(type.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left relative
              ${isSelected 
                ? 'border-slate-900 bg-slate-50 shadow-md' 
                : 'border-slate-200 hover:border-slate-300'
              }`}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <p className="text-sm font-medium text-slate-900">{type.label}</p>
            <p className="text-xs text-slate-500 mt-1 leading-tight">{type.desc}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
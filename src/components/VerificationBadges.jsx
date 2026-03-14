import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Linkedin, Mail, XCircle } from 'lucide-react';

const badgeConfig = {
  linkedin_verified: {
    label: 'LinkedIn Verified',
    icon: Linkedin,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  email_verified: {
    label: 'Email Verified',
    icon: Mail,
    color: 'bg-green-100 text-green-700 border-green-200'
  },
};

export default function VerificationBadges({ badges = [], size = 'default', showLabels = true }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(badgeId => {
        const config = badgeConfig[badgeId];
        if (!config) return null;
        
        const Icon = config.icon;
        
        if (size === 'small') {
          return (
            <div
              key={badgeId}
              className={`w-5 h-5 rounded-full flex items-center justify-center ${config.color}`}
              title={config.label}
            >
              <Icon className="w-3 h-3" />
            </div>
          );
        }
        
        return (
          <Badge 
            key={badgeId} 
            variant="outline" 
            className={`${config.color} text-xs`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {showLabels && config.label}
          </Badge>
        );
      })}
    </div>
  );
}

export function VerificationStatus({ profile, user }) {
  // Derive verification state from Supabase auth user
  const emailVerified = !!user?.email_confirmed_at;
  const linkedinVerified = user?.identities?.some(i => i.provider === 'linkedin_oidc') ?? false;

  const statuses = {
    email_verified: emailVerified,
    linkedin_verified: linkedinVerified,
  };

  const earnedBadges = Object.values(statuses).filter(Boolean).length;
  const totalBadges = Object.keys(statuses).length;
  const percentage = Math.round((earnedBadges / totalBadges) * 100);

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm text-slate-900">Profile Verification</h4>
        <span className="text-sm text-slate-500">{earnedBadges}/{totalBadges} verified</span>
      </div>

      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-2">
        {Object.entries(badgeConfig).map(([id, config]) => {
          const Icon = config.icon;
          const isVerified = statuses[id];

          return (
            <div key={id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isVerified ? 'text-green-600' : 'text-slate-400'}`} />
                <span className={`text-sm ${isVerified ? 'text-slate-900' : 'text-slate-500'}`}>
                  {config.label}
                </span>
              </div>
              {isVerified ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
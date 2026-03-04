import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Building2, Crown, MessageCircle, Calendar, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CORPORATE_TYPES = ['accelerator', 'service_provider', 'investor'];

export function isCorporateProfile(profileType) {
  return CORPORATE_TYPES.includes(profileType);
}

export function canContactProfile(myProfile, otherProfile) {
  // Corporate profiles need to be paid to contact anyone
  if (isCorporateProfile(myProfile?.profile_type)) {
    return myProfile?.is_premium || ['business', 'enterprise'].includes(myProfile?.subscription_tier);
  }
  
  // Non-corporate can't contact unpaid corporate profiles
  if (isCorporateProfile(otherProfile?.profile_type)) {
    const otherPaid = otherProfile?.is_premium || ['business', 'enterprise'].includes(otherProfile?.subscription_tier);
    return otherPaid;
  }
  
  return true;
}

export default function CorporatePaywall({ profileType, onUpgrade }) {
  const typeLabels = {
    accelerator: 'Accelerator',
    service_provider: 'Service Provider',
    investor: 'Investor'
  };

  const features = [
    { icon: MessageCircle, label: 'Message founders directly' },
    { icon: Calendar, label: 'Schedule meetings in-app' },
    { icon: Users, label: 'Get matched with relevant startups' },
    { icon: Crown, label: 'Featured profile placement' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Unlock {typeLabels[profileType]} Features</h3>
          <p className="text-sm text-slate-400">Upgrade to connect with founders</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4">
        As a {typeLabels[profileType]?.toLowerCase()}, you can browse profiles for free. 
        Upgrade to Business to unlock messaging and full platform access.
      </p>

      <div className="space-y-2 mb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200">{feature.label}</span>
            </div>
          );
        })}
      </div>

      <Button 
        onClick={onUpgrade}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
      >
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Business
      </Button>

      <p className="text-xs text-slate-500 text-center mt-3">
        Starting at $99/month
      </p>
    </motion.div>
  );
}

export function CorporateContactBlockedBanner({ otherProfileType }) {
  const typeLabels = {
    accelerator: 'accelerator',
    service_provider: 'service provider',
    investor: 'investor'
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
      <Lock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
      <p className="text-sm text-amber-800">
        This {typeLabels[otherProfileType]} hasn't upgraded yet and can't receive messages.
      </p>
    </div>
  );
}
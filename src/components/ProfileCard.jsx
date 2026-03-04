import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { MapPin, Linkedin, Globe, Briefcase, Lightbulb, TrendingUp, Building2, Banknote, Flag, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ReportProfileModal from './ReportProfileModal';

const profileTypeConfig = {
  founder: { label: 'Founder', color: 'bg-indigo-500', icon: Lightbulb },
  collaborator: { label: 'Collaborator', color: 'bg-emerald-500', icon: Briefcase },
  accelerator: { label: 'Accelerator', color: 'bg-amber-500', icon: Building2 },
  service_provider: { label: 'Service Provider', color: 'bg-rose-500', icon: TrendingUp },
  investor: { label: 'Investor', color: 'bg-violet-500', icon: Banknote },
};

const stageLabels = {
  idea: 'Idea Stage',
  discovery: 'Discovery',
  validation: 'Validation',
  efficiency: 'Efficiency',
  scaling: 'Scaling',
};

const archetypeLabels = {
  visionary: 'Visionary',
  hacker: 'Hacker',
  hustler: 'Hustler',
  designer: 'Designer',
};

// Check if corporate profile requires verification
const requiresVerification = (profileType) => {
  return ['investor', 'accelerator', 'service_provider'].includes(profileType);
};

const isVerified = (profile) => {
  return profile.verification_badges?.length > 0 || 
    profile.verification_badges?.includes('linkedin_verified') ||
    profile.verification_badges?.includes('email_verified');
};

export default function ProfileCard({ profile, onSwipe, isTop, myProfileId }) {
  const [showReport, setShowReport] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const config = profileTypeConfig[profile.profile_type] || profileTypeConfig.founder;
  const TypeIcon = config.icon;

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipe('like');
    } else if (info.offset.x < -100) {
      onSwipe('pass');
    }
  };

  const formatTicketSize = (min, max) => {
    const format = (n) => {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
      return `$${n}`;
    };
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `${format(min)}+`;
    if (max) return `Up to ${format(max)}`;
    return null;
  };

  return (
    <motion.div
      className={`absolute w-full ${isTop ? 'z-10' : 'z-0'}`}
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4">
        {/* Swipe Indicators */}
        <motion.div 
          className="absolute top-8 left-8 z-20 bg-cyan-500 text-white px-6 py-2 rounded-full font-bold text-xl rotate-[-15deg]"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </motion.div>
        <motion.div 
          className="absolute top-8 right-8 z-20 bg-rose-500 text-white px-6 py-2 rounded-full font-bold text-xl rotate-[15deg]"
          style={{ opacity: passOpacity }}
        >
          PASS
        </motion.div>

        {/* Profile Image */}
        <div className="relative h-80 bg-gradient-to-br from-slate-100 to-slate-200">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-24 h-24 text-slate-300" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${config.color} text-white border-0`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              {profile.is_premium && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                  Premium
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{profile.display_name}</h2>
            {profile.location && (
              <p className="text-white/80 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4">
          {/* Bio */}
          {profile.bio && (
            <p className="text-slate-600 leading-relaxed line-clamp-3">{profile.bio}</p>
          )}

          {/* Founder/Collaborator specific */}
          {(profile.profile_type === 'founder' || profile.profile_type === 'collaborator') && (
            <div className="flex flex-wrap gap-2">
              {profile.stage && (
                <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                  {stageLabels[profile.stage]}
                </Badge>
              )}
              {profile.archetype && (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  {archetypeLabels[profile.archetype]}
                </Badge>
              )}
              {profile.tags?.map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-slate-100">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Investor specific */}
          {profile.profile_type === 'investor' && (
            <div className="space-y-2">
              {profile.investment_stages?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.investment_stages.map((stage, i) => (
                    <Badge key={i} variant="outline" className="border-violet-200 text-violet-700 text-xs">
                      {stage}
                    </Badge>
                  ))}
                </div>
              )}
              {formatTicketSize(profile.ticket_size_min, profile.ticket_size_max) && (
                <p className="text-sm text-slate-500">
                  Ticket: {formatTicketSize(profile.ticket_size_min, profile.ticket_size_max)}
                </p>
              )}
              {profile.investment_industries?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.investment_industries.slice(0, 4).map((ind, i) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-xs">
                      {ind}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Service Provider specific */}
          {profile.profile_type === 'service_provider' && profile.service_types?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.service_types.map((service, i) => (
                <Badge key={i} variant="outline" className="border-rose-200 text-rose-700">
                  {service}
                </Badge>
              ))}
            </div>
          )}

          {/* Accelerator specific */}
          {profile.profile_type === 'accelerator' && profile.focus_areas?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.focus_areas.map((area, i) => (
                <Badge key={i} variant="outline" className="border-amber-200 text-amber-700">
                  {area}
                </Badge>
              ))}
            </div>
          )}

          {/* Verification Warning */}
          {requiresVerification(profile.profile_type) && !isVerified(profile) && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700">Unverified {profileTypeConfig[profile.profile_type]?.label}</span>
            </div>
          )}

          {/* Links */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-4">
              {profile.linkedin_url && (
                <a 
                  href={profile.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {profile.website_url && (
                <a 
                  href={profile.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
              className="text-slate-400 hover:text-red-500"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ReportProfileModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        reportedProfile={profile}
        myProfileId={myProfileId}
      />
    </motion.div>
  );
}
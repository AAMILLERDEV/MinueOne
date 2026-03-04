import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, MessageSquare, Zap, ShieldCheck } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DirectMessageButton from '@/components/DirectMessageButton';

const urgencyConfig = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Act Soon' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Timely' },
  low: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Anytime' },
};

const profileTypeColors = {
  founder: 'bg-indigo-100 text-indigo-700',
  collaborator: 'bg-emerald-100 text-emerald-700',
  investor: 'bg-violet-100 text-violet-700',
  accelerator: 'bg-amber-100 text-amber-700',
  service_provider: 'bg-rose-100 text-rose-700',
};

export default function NetworkingConnectionCard({ suggestion, myProfile, index }) {
  const [expanded, setExpanded] = useState(false);
  const { profile, connection_type, compatibility_score, why_connect, talking_points, optimal_outreach, urgency } = suggestion;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                {profile?.display_name?.[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{profile?.display_name}</h3>
              {profile?.verification_badges?.length > 0 && (
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${profileTypeColors[profile?.profile_type]} text-xs border-0`}>
                {profile?.profile_type?.replace('_', ' ')}
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs border-0">
                <Zap className="w-3 h-3 mr-1" />
                {connection_type}
              </Badge>
              {urgency && (
                <Badge variant="outline" className={`text-xs ${urgencyConfig[urgency]?.color}`}>
                  {urgencyConfig[urgency]?.label}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">{compatibility_score}%</p>
              <p className="text-xs text-slate-400">match</p>
            </div>
          </div>
        </div>

        {/* Why Connect */}
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">{why_connect}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-blue-600 text-sm mt-2 hover:text-blue-700"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Hide details' : 'Talking points & timing'}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
              {/* Talking Points */}
              {talking_points?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700">Conversation Starters</p>
                  </div>
                  <ul className="space-y-2">
                    {talking_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">
                          {i + 1}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimal Outreach */}
              {optimal_outreach && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">Best Time to Reach Out</p>
                  </div>
                  <p className="text-sm text-amber-700 font-medium">
                    {optimal_outreach.day} · {optimal_outreach.time}
                  </p>
                  {optimal_outreach.rationale && (
                    <p className="text-xs text-amber-600 mt-1">{optimal_outreach.rationale}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <DirectMessageButton
                  myProfile={myProfile}
                  targetProfile={profile}
                  onUpgrade={() => {}}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
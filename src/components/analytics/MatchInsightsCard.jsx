import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, MessageSquare, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function MatchInsightsCard({ insight, isPremium = false, onUpgrade }) {
  const [expanded, setExpanded] = useState(false);

  if (!isPremium) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">AI Match Insights</p>
            <p className="text-sm text-slate-500">Upgrade to see compatibility analysis</p>
          </div>
          <Button size="sm" onClick={onUpgrade} className="bg-purple-600 hover:bg-purple-700">
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  const breakdown = insight.compatibility_breakdown 
    ? JSON.parse(insight.compatibility_breakdown) 
    : {};

  const scoreColor = insight.compatibility_score >= 80 
    ? 'text-green-600' 
    : insight.compatibility_score >= 60 
      ? 'text-blue-600' 
      : 'text-amber-600';

  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-slate-900">AI Match Analysis</p>
          <p className="text-sm text-slate-500">{insight.recommendation_reason?.substring(0, 50)}...</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-bold ${scoreColor}`}>{insight.compatibility_score}%</p>
            <p className="text-xs text-slate-500">compatibility</p>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100"
          >
            <div className="p-4 space-y-4">
              {/* Compatibility Breakdown */}
              {Object.keys(breakdown).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Compatibility Breakdown</p>
                  {Object.entries(breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24 capitalize">{key.replace('_', ' ')}</span>
                      <Progress value={value} className="flex-1 h-2" />
                      <span className="text-xs font-medium text-slate-700 w-8">{value}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Talking Points */}
              {insight.talking_points?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-slate-700">Conversation Starters</p>
                  </div>
                  <div className="space-y-1">
                    {insight.talking_points.map((point, i) => (
                      <p key={i} className="text-sm text-slate-600 pl-6">• {point}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Synergies */}
              {insight.potential_synergies?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-slate-700">Potential Synergies</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {insight.potential_synergies.map((synergy, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-50 text-green-700">
                        {synergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {insight.risk_factors?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-slate-700">Things to Consider</p>
                  </div>
                  <div className="space-y-1">
                    {insight.risk_factors.map((risk, i) => (
                      <p key={i} className="text-sm text-slate-600 pl-6">• {risk}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
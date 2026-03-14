import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Bot, ChevronDown, ChevronUp, Clock, MessageSquare, Users, RefreshCw, Lock, Crown, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import NetworkingConnectionCard from '@/components/networking/NetworkingConnectionCard';
import NetworkingChatPanel from '@/components/networking/NetworkingChatPanel';

const profileTypeColors = {
  founder: 'bg-indigo-100 text-indigo-700',
  collaborator: 'bg-emerald-100 text-emerald-700',
  investor: 'bg-violet-100 text-violet-700',
  accelerator: 'bg-amber-100 text-amber-700',
  service_provider: 'bg-rose-100 text-rose-700',
};

export default function NetworkingAssistant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [outreachTiming, setOutreachTiming] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

  const isPremium = myProfile?.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(myProfile?.subscription_tier);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await minus1.auth.me();
      const profiles = await minus1.entities.Profile.filter({ user_id: user.id });
      if (!profiles.length) { navigate(createPageUrl('Onboarding')); return; }
      setMyProfile(profiles[0]);

      const all = await minus1.entities.Profile.list('-last_active', 50);
      setAllProfiles(all.filter(p => p.id !== profiles[0].id && p.is_complete));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!isPremium || analyzing) return;
    setAnalyzing(true);

    try {
      const myData = {
        type: myProfile.profile_type,
        display_name: myProfile.display_name,
        bio: myProfile.bio,
        stage: myProfile.stage,
        archetype: myProfile.archetype,
        primary_skills: myProfile.primary_skills,
        secondary_skills: myProfile.secondary_skills,
        help_needed: myProfile.help_needed,
        problem_statement: myProfile.problem_statement,
        looking_for: myProfile.looking_for,
        location: myProfile.location,
        remote_friendly: myProfile.remote_friendly,
        investment_stages: myProfile.investment_stages,
        investment_industries: myProfile.investment_industries,
        focus_areas: myProfile.focus_areas,
        service_types: myProfile.service_types,
        tags: myProfile.tags,
        availability: myProfile.availability,
        collaboration_type: myProfile.collaboration_type,
        timeline_urgency: myProfile.timeline_urgency,
      };

      const candidateProfiles = allProfiles.slice(0, 30).map(p => ({
        id: p.id,
        display_name: p.display_name,
        type: p.profile_type,
        bio: p.bio?.substring(0, 150),
        stage: p.stage,
        archetype: p.archetype,
        primary_skills: p.primary_skills,
        tags: p.tags,
        location: p.location,
        remote_friendly: p.remote_friendly,
        investment_stages: p.investment_stages,
        investment_industries: p.investment_industries,
        focus_areas: p.focus_areas,
        service_types: p.service_types,
        availability: p.availability,
        is_premium: p.is_premium,
        verification_badges: p.verification_badges,
        last_active: p.last_active,
      }));

      const result = await minus1.integrations.Core.InvokeLLM({
        prompt: `You are an expert startup networking AI for the Minus1 platform. Analyze the user's profile and suggest the most strategically valuable connections — not just obvious matches, but also cross-type connections (e.g. a founder connecting with an accelerator, or a collaborator connecting with an investor for future opportunities).

User Profile:
${JSON.stringify(myData, null, 2)}

Candidate Profiles (pool to choose from):
${JSON.stringify(candidateProfiles, null, 2)}

Instructions:
1. Suggest exactly 5 connections. Go beyond direct match types — consider ecosystem value, complementary skills, stage alignment, and strategic timing.
2. For each connection, write 3 specific talking points the user can use to initiate contact. Make them personalized and natural-sounding, not generic.
3. Suggest the optimal outreach timing based on what you know about startup networking patterns and the candidate's last_active data (if available). Use day-of-week and time-of-day insights.
4. Also provide 1 overall outreach strategy insight for this user based on their profile.

Be specific, actionable, and insightful. Do not return vague advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  profile_id: { type: "string" },
                  connection_type: { type: "string", description: "e.g. Strategic Partner, Potential Investor, Technical Co-founder, etc." },
                  compatibility_score: { type: "number", description: "0-100" },
                  why_connect: { type: "string", description: "2-3 sentence strategic rationale" },
                  talking_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 personalized conversation starters"
                  },
                  optimal_outreach: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      time: { type: "string" },
                      rationale: { type: "string" }
                    }
                  },
                  urgency: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            strategy_insight: { type: "string", description: "Overall networking strategy recommendation for this user" },
            best_outreach_window: { type: "string", description: "Best general time window for this user to do outreach" }
          }
        }
      });

      const enriched = (result.suggestions || []).map(s => ({
        ...s,
        profile: allProfiles.find(p => p.id === s.profile_id)
      })).filter(s => s.profile);

      setSuggestions(enriched);
      setOutreachTiming({
        strategy: result.strategy_insight,
        best_window: result.best_outreach_window
      });
      setLastAnalyzed(new Date());
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              AI Networking
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Smart connections beyond your feed</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(true)}
            className="text-blue-600 border-blue-200"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Ask AI
          </Button>
        </div>

        {!isPremium ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center shadow-xl shadow-blue-500/20"
          >
            <Crown className="w-10 h-10 mx-auto mb-3 text-amber-300" />
            <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
            <p className="text-blue-100 text-sm mb-4">
              The AI Networking Assistant analyzes your profile and suggests strategic connections with talking points and optimal outreach timing.
            </p>
            <ul className="text-left text-sm text-blue-100 space-y-2 mb-6">
              {['5 AI-curated strategic connections', 'Personalized conversation starters', 'Optimal outreach timing', 'Chat with your AI advisor'].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300" />
                  {f}
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate(createPageUrl('Settings'))} className="w-full bg-white text-blue-700 hover:bg-blue-50">
              Upgrade to Premium
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Strategy Insight */}
            {outreachTiming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Your Outreach Window</p>
                    <p className="text-xs text-slate-600">{outreachTiming.best_window}</p>
                    <p className="text-xs text-slate-500 mt-2">{outreachTiming.strategy}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Run Analysis */}
            {suggestions.length === 0 && !analyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to analyze your network</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                  The AI will scan {allProfiles.length} profiles and find your top 5 strategic connections with personalized outreach advice.
                </p>
                <Button onClick={runAnalysis} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze My Network
                </Button>
              </motion.div>
            )}

            {analyzing && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <p className="text-slate-700 font-medium">Analyzing {allProfiles.length} profiles...</p>
                <p className="text-sm text-slate-500 mt-1">Finding your best strategic connections</p>
              </div>
            )}

            {suggestions.length > 0 && !analyzing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{suggestions.length} connections suggested</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={runAnalysis} className="text-blue-600">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>

                {suggestions.map((suggestion, i) => (
                  <NetworkingConnectionCard
                    key={suggestion.profile_id || i}
                    suggestion={suggestion}
                    myProfile={myProfile}
                    index={i}
                  />
                ))}

                {lastAnalyzed && (
                  <p className="text-xs text-slate-400 text-center">
                    Last analyzed {lastAnalyzed.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Panel */}
      <NetworkingChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        myProfile={myProfile}
        allProfiles={allProfiles}
        isPremium={isPremium}
      />
    </div>
  );
}
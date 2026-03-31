import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ChevronRight, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AIRecommendations({ myProfile, profiles, onViewProfile }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPaidUser = myProfile?.is_premium || ['pro', 'business', 'enterprise'].includes(myProfile?.subscription_tier);

  useEffect(() => {
    if (isPaidUser && profiles.length > 0) {
      generateRecommendations();
    }
  }, [myProfile, profiles]);

  const generateRecommendations = async () => {
    if (!isPaidUser || profiles.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileSummaries = profiles.slice(0, 20).map(p => ({
        id: p.id,
        name: p.display_name,
        type: p.profile_type,
        stage: p.stage,
        archetype: p.archetype,
        skills: p.primary_skills,
        tags: p.tags,
        location: p.location,
        bio: p.bio?.substring(0, 200)
      }));

      const myProfileSummary = {
        type: myProfile.profile_type,
        stage: myProfile.stage,
        archetype: myProfile.archetype,
        skills: myProfile.primary_skills,
        tags: myProfile.tags,
        help_needed: myProfile.help_needed,
        problem_statement: myProfile.problem_statement,
        looking_for: myProfile.looking_for
      };

      const response = await minus1.integrations.Core.InvokeLLM({
        prompt: `You are a startup matchmaking AI. Analyze these profiles and recommend the top 3 best matches for the user.

User Profile:
${JSON.stringify(myProfileSummary, null, 2)}

Available Profiles:
${JSON.stringify(profileSummaries, null, 2)}

For each recommendation, explain WHY they would be a good match based on complementary skills, aligned goals, or strategic value.

Return exactly 3 recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  profile_id: { type: "string" },
                  match_score: { type: "number" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      const recs = response.recommendations || [];
      const enrichedRecs = recs.map(rec => ({
        ...rec,
        profile: profiles.find(p => p.id === rec.profile_id)
      })).filter(rec => rec.profile);

      setRecommendations(enrichedRecs);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) return null;

  if (!isPaidUser) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">AI Match Recommendations</p>
            <p className="text-sm text-slate-500">Upgrade to Premium for AI-powered match suggestions</p>
          </div>
          <Badge className="bg-blue-600">Premium</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">AI Recommendations</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-500">Analyzing profiles...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.profile_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onViewProfile(rec.profile)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                  {rec.profile?.avatar_url ? (
                    <img src={rec.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                      {rec.profile?.display_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{rec.profile?.display_name}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    {Math.round(rec.match_score * 100)}% match
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No recommendations yet. Keep swiping to build your profile!</p>
      )}

      {!loading && recommendations.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-blue-600"
          onClick={generateRecommendations}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Refresh Recommendations
        </Button>
      )}
    </div>
  );
}
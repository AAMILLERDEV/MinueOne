import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Loader2, Lock, TrendingUp, Users, MessageSquare, Calendar, 
  Eye, Heart, Sparkles, Target, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [matchData, setMatchData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.Profile.filter({ user_id: user.id });
      
      if (!profiles.length) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      const profile = profiles[0];
      setMyProfile(profile);
      setIsPremium(profile.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(profile.subscription_tier));

      if (profile.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(profile.subscription_tier)) {
        await loadAnalytics(profile);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (profile) => {
    try {
      // Load swipe actions
      const mySwipes = await base44.entities.SwipeAction.filter({ from_profile_id: profile.id });
      const swipesOnMe = await base44.entities.SwipeAction.filter({ to_profile_id: profile.id });
      
      // Load matches
      const myMatches = await base44.entities.Match.filter({ from_profile_id: profile.id, status: 'matched' });
      const matchesWithMe = await base44.entities.Match.filter({ to_profile_id: profile.id, status: 'matched' });
      const totalMatches = myMatches.length + matchesWithMe.length;

      // Load messages
      const allMessages = [];
      for (const match of [...myMatches, ...matchesWithMe]) {
        const messages = await base44.entities.Message.filter({ match_id: match.id });
        allMessages.push(...messages);
      }

      // Load meetings
      const meetings = await base44.entities.Meeting.filter({ organizer_profile_id: profile.id });
      const meetingsAttending = await base44.entities.Meeting.filter({ attendee_profile_id: profile.id });

      // Calculate stats
      const likes = mySwipes.filter(s => s.action === 'like').length;
      const passes = mySwipes.filter(s => s.action === 'pass').length;
      const likesReceived = swipesOnMe.filter(s => s.action === 'like').length;

      setStats({
        totalSwipes: mySwipes.length,
        likes,
        passes,
        likeRate: mySwipes.length > 0 ? Math.round((likes / mySwipes.length) * 100) : 0,
        matches: totalMatches,
        matchRate: likes > 0 ? Math.round((totalMatches / likes) * 100) : 0,
        profileViews: likesReceived + swipesOnMe.filter(s => s.action === 'pass').length,
        likesReceived,
        messages: allMessages.length,
        messagesSent: allMessages.filter(m => m.sender_profile_id === profile.id).length,
        meetings: meetings.length + meetingsAttending.length,
        meetingsCompleted: [...meetings, ...meetingsAttending].filter(m => m.status === 'completed').length
      });

      // Generate mock engagement data for chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          views: Math.floor(Math.random() * 20) + 5,
          likes: Math.floor(Math.random() * 10) + 2,
          matches: Math.floor(Math.random() * 3)
        };
      });
      setEngagementData(last7Days);

      // Match breakdown by type
      const allProfiles = await base44.entities.Profile.filter({ is_complete: true });
      const matchedProfileIds = [...myMatches, ...matchesWithMe].map(m => 
        m.from_profile_id === profile.id ? m.to_profile_id : m.from_profile_id
      );
      const matchedProfiles = allProfiles.filter(p => matchedProfileIds.includes(p.id));
      
      const typeBreakdown = matchedProfiles.reduce((acc, p) => {
        acc[p.profile_type] = (acc[p.profile_type] || 0) + 1;
        return acc;
      }, {});

      setMatchData(Object.entries(typeBreakdown).map(([name, value]) => ({ name, value })));

      // Load AI insights
      const matchInsights = await base44.entities.MatchInsight.filter({ profile_id: profile.id });
      setInsights(matchInsights.slice(0, 5));

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics</h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white text-center"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h2>
            <p className="text-white/80 mb-6">
              Get AI-powered insights, compatibility analysis, and detailed engagement metrics
            </p>
            <ul className="text-left text-sm space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Match Compatibility Scores
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Engagement Analytics
              </li>
              <li className="flex items-center gap-2">
                <Target className="w-4 h-4" /> Profile Performance Insights
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Conversation Starters
              </li>
            </ul>
            <Button 
              onClick={() => navigate(createPageUrl('Settings'))}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              Upgrade to Premium
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <Badge className="bg-purple-100 text-purple-700">
            <Sparkles className="w-3 h-3 mr-1" /> Premium
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Eye className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />12%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.profileViews || 0}</p>
              <p className="text-xs text-slate-500">Profile Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Heart className="w-5 h-5 text-pink-500" />
                <Badge variant="outline" className="text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />8%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.likesReceived || 0}</p>
              <p className="text-xs text-slate-500">Likes Received</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-slate-500">{stats?.matchRate || 0}% rate</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.matches || 0}</p>
              <p className="text-xs text-slate-500">Total Matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calendar className="w-5 h-5 text-cyan-500" />
                <span className="text-xs text-slate-500">{stats?.meetingsCompleted || 0} done</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.meetings || 0}</p>
              <p className="text-xs text-slate-500">Meetings</p>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="matches" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-500">Views</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-xs text-slate-500">Likes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-slate-500">Matches</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Breakdown */}
        {matchData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Matches by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={matchData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {matchData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {matchData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-slate-500 capitalize">{entry.name.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Like Rate</span>
                <span className="font-medium">{stats?.likeRate || 0}%</span>
              </div>
              <Progress value={stats?.likeRate || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Match Rate</span>
                <span className="font-medium">{stats?.matchRate || 0}%</span>
              </div>
              <Progress value={stats?.matchRate || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Response Rate</span>
                <span className="font-medium">
                  {stats?.messages > 0 ? Math.round((stats.messagesSent / stats.messages) * 100) : 0}%
                </span>
              </div>
              <Progress value={stats?.messages > 0 ? Math.round((stats.messagesSent / stats.messages) * 100) : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Preview */}
        {insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI Match Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {insight.insight_type?.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-bold text-purple-600">
                        {insight.compatibility_score}% match
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{insight.recommendation_reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
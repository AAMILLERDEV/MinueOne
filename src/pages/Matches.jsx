import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, MessageCircle, Shield, FileCheck, Building2, Lock, Clock, Check, X, Mail } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SafetyModal from '@/components/SafetyModal';
import VerificationBadges from '@/components/VerificationBadges';
import { canContactProfile, isCorporateProfile } from '@/components/CorporatePaywall';
import DirectMessageButton from '@/components/DirectMessageButton';
import { useUnread } from '@/lib/UnreadContext';
import { Sparkles } from 'lucide-react';
import GroupChatPanel from '@/components/GroupChatPanel';

const profileTypeConfig = {
  founder: { label: 'Founder', color: 'bg-indigo-100 text-indigo-700' },
  collaborator: { label: 'Collaborator', color: 'bg-emerald-100 text-emerald-700' },
  accelerator: { label: 'Accelerator', color: 'bg-amber-100 text-amber-700' },
  service_provider: { label: 'Service Provider', color: 'bg-rose-100 text-rose-700' },
  investor: { label: 'Investor', color: 'bg-violet-100 text-violet-700' },
  event_organizer: { label: 'Event Organizer', color: 'bg-cyan-100 text-cyan-700' },
};

export default function Matches() {
  const navigate = useNavigate();
  const { unreadByMatch, pendingRequestCount, refreshPendingRequests } = useUnread();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState({});
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'group-chat'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await minus1.auth.me();
      const myProfiles = await minus1.entities.Profile.filter({ user_id: user.id });
      
      if (!myProfiles.length) {
        navigate(createPageUrl('Onboarding'));
        return;
      }
      
      setMyProfile(myProfiles[0]);
      
      // Load matches where I'm either from or to (both matched and pending)
      const allMatches = await minus1.entities.Match.list();
      const myMatches = allMatches.filter(m => 
        (m.from_profile_id === myProfiles[0].id || m.to_profile_id === myProfiles[0].id) &&
        (m.status === 'matched' || m.status === 'pending')
      );
      
      setMatches(myMatches);
      
      // Load all matched profiles
      const profileIds = new Set();
      myMatches.forEach(m => {
        profileIds.add(m.from_profile_id);
        profileIds.add(m.to_profile_id);
      });
      
      const allProfiles = await minus1.entities.Profile.list();
      const profileMap = {};
      allProfiles.forEach(p => {
        if (profileIds.has(p.id)) {
          profileMap[p.id] = p;
        }
      });
      
      setMatchProfiles(profileMap);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchedProfile = (match) => {
    const otherId = match.from_profile_id === myProfile?.id 
      ? match.to_profile_id 
      : match.from_profile_id;
    return matchProfiles[otherId];
  };

  const handleChatClick = (match) => {
    setSelectedMatch(match);
    if (myProfile?.safety_acknowledged) {
      navigate(createPageUrl('Chat') + `?matchId=${match.id}`);
    } else {
      setShowSafetyModal(true);
    }
  };

  const handleFindAccelerators = () => {
    setShowSafetyModal(false);
    navigate(createPageUrl('Discover') + '?filter=accelerator');
  };

  const handleSendNDA = async () => {
    if (!selectedMatch) return;
    
    await minus1.entities.Match.update(selectedMatch.id, {
      nda_sent: true
    });
    
    // Refresh matches
    loadData();
  };

  const handleOpenChat = () => {
    if (!selectedMatch) return;
    navigate(createPageUrl('Chat') + `?matchId=${selectedMatch.id}`);
  };

  const handleAcceptMatch = async (match) => {
    try {
      await minus1.entities.Match.update(match.id, { status: 'matched' });
      refreshPendingRequests();
      loadData();
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  const handleDeclineMatch = async (match) => {
    try {
      await minus1.entities.Match.update(match.id, { status: 'declined' });
      setMatches(prev => prev.filter(m => m.id !== match.id));
      refreshPendingRequests();
    } catch (error) {
      console.error('Error declining match:', error);
    }
  };

  // Separate pending requests (where I need to accept) from confirmed matches
  const pendingRequests = matches.filter(m => 
    m.status === 'pending' && m.to_profile_id === myProfile?.id
  );
  const confirmedMatches = matches
    .filter(m => m.status === 'matched')
    .sort((a, b) => (unreadByMatch[b.id]?.count ?? 0) - (unreadByMatch[a.id]?.count ?? 0));
  const sentRequests = matches.filter(m => 
    m.status === 'pending' && m.from_profile_id === myProfile?.id
  );

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
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Matches</h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
          {[
            { id: 'matches', label: 'Matches' },
            { id: 'group-chat', label: 'Group Chat' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Group Chat tab */}
        {activeTab === 'group-chat' && myProfile && (
          <GroupChatPanel myProfile={myProfile} />
        )}

        {/* Matches tab content */}
        {activeTab === 'matches' && <>

        {/* Possible matches teaser — shown when there are incoming requests the user hasn't acted on */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-md"
          >
            <Sparkles className="w-6 h-6 text-white flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-bold text-base leading-tight">
                {pendingRequests.length === 1
                  ? '1 possible match waiting!'
                  : `${pendingRequests.length} possible matches waiting!`}
              </p>
              <p className="text-blue-100 text-sm mt-0.5">
                Someone's interested — see who below.
              </p>
            </div>
          </motion.div>
        )}

        {confirmedMatches.length === 0 && pendingRequests.length === 0 && sentRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No matches yet</h3>
            <p className="text-slate-500 mb-6">
              Keep swiping to find your perfect co-founder or collaborator!
            </p>
            <Button 
              onClick={() => navigate(createPageUrl('Discover'))}
              className="bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              Start Discovering
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Requests ({pendingRequests.length})
                </h2>
                <div className="space-y-3">
                  {pendingRequests.map((match, index) => {
                    const profile = getMatchedProfile(match);
                    if (!profile) return null;
                    const config = profileTypeConfig[profile.profile_type];
                    
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-amber-50 rounded-xl p-4 border border-amber-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                {profile.display_name?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{profile.display_name}</h3>
                            <Badge className={`${config?.color} text-xs`}>{config?.label}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleDeclineMatch(match)}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAcceptMatch(match)}>
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Sent Requests ({sentRequests.length})
                </h2>
                <div className="space-y-3">
                  {sentRequests.map((match, index) => {
                    const profile = getMatchedProfile(match);
                    if (!profile) return null;
                    const config = profileTypeConfig[profile.profile_type];
                    
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                {profile.display_name?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{profile.display_name}</h3>
                            <Badge className={`${config?.color} text-xs`}>{config?.label}</Badge>
                          </div>
                          <Badge variant="outline" className="text-slate-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirmed Matches */}
            {confirmedMatches.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Matches ({confirmedMatches.length})
                </h2>
                <div className="space-y-3">
                  {confirmedMatches.map((match, index) => {
                    const profile = getMatchedProfile(match);
                    if (!profile) return null;
                    const config = profileTypeConfig[profile.profile_type];
                    const unreadData = unreadByMatch[match.id];
                    const unreadCount = unreadData?.count ?? 0;
                    const unreadPreview = unreadData?.preview ?? '';
                    const hasUnread = unreadCount > 0;

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-xl p-4 shadow-sm border transition-colors ${
                          hasUnread
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                  {profile.display_name?.[0]}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`truncate ${hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>
                                {profile.display_name}
                              </h3>
                              {match.nda_sent && (
                                <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                  <FileCheck className="w-3 h-3 mr-1" />NDA
                                </Badge>
                              )}
                            </div>
                            <Badge className={`${config?.color} text-xs`}>{config?.label}</Badge>
                            {hasUnread && (
                              <p className="text-xs text-blue-600 font-medium mt-1 truncate max-w-[200px]">
                                {unreadPreview}
                              </p>
                            )}
                            {profile.verification_badges?.length > 0 && (
                              <div className="mt-1">
                                <VerificationBadges badges={profile.verification_badges} size="small" />
                              </div>
                            )}
                          </div>
                          {canContactProfile(myProfile, profile) ? (
                            <div className="relative flex-shrink-0">
                              <Button
                                size="sm"
                                onClick={() => handleChatClick(match)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              {hasUnread && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="text-slate-400">
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        </> /* end activeTab === 'matches' */}
      </div>

      <SafetyModal
        isOpen={showSafetyModal}
        onClose={async () => {
          setShowSafetyModal(false);
          if (!myProfile?.safety_acknowledged) {
            await minus1.entities.Profile.update(myProfile.id, { safety_acknowledged: true });
            setMyProfile(prev => ({ ...prev, safety_acknowledged: true }));
          }
          handleOpenChat();
        }}
        onFindAccelerators={handleFindAccelerators}
        isPremium={myProfile?.is_premium && myProfile?.profile_type === 'founder'}
        onSendNDA={handleSendNDA}
      />
    </div>
  );
}
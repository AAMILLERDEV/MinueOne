import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Users, Search, CalendarDays, X } from 'lucide-react';
import ProfileCard from '@/components/ProfileCard';
import SwipeButtons from '@/components/SwipeButtons';
import MatchModal from '@/components/MatchModal';
import DiscoverFilters from '@/components/DiscoverFilters';
import AIRecommendations from '@/components/AIRecommendations';
import EventLink from '@/components/EventLink';
import EventFilterPicker from '@/components/EventFilterPicker';
import CorporatePaywall, { isCorporateProfile, canContactProfile } from '@/components/CorporatePaywall';
import { AnalyticsService } from '@/components/analytics/AnalyticsService';

export default function Discover() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedProfiles, setSwipedProfiles] = useState([]);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [lastSwipe, setLastSwipe] = useState(null);
  const [filters, setFilters] = useState({
    stages: [],
    archetypes: [],
    tags: [],
    investmentStages: [],
    industries: [],
    serviceTypes: []
  });
  const [activeEventId, setActiveEventId] = useState(null);
  const [eventAttendeeProfileIds, setEventAttendeeProfileIds] = useState(null); // null = no filter
  const [showEventLink, setShowEventLink] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [profileViewStart, setProfileViewStart] = useState(null);

  // Re-apply event filter when eventAttendeeProfileIds changes
  useEffect(() => {
    if (allProfiles.length > 0) applyFilters(allProfiles, filters);
  }, [eventAttendeeProfileIds]);

  useEffect(() => {
    loadData();
    AnalyticsService.trackSessionStart();
    return () => {
      AnalyticsService.trackSessionEnd();
    };
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const myProfiles = await base44.entities.Profile.filter({ user_id: user.id });
      
      if (!myProfiles.length || !myProfiles[0].is_complete) {
        navigate(createPageUrl('Onboarding'));
        return;
      }
      
      setMyProfile(myProfiles[0]);
      
      // Load profiles to discover
      await loadProfiles(myProfiles[0]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async (profile) => {
    try {
      // Get all profiles of types I'm looking for
      const fetchedProfiles = await base44.entities.Profile.filter({ is_complete: true });
      
      // Get my swipe history
      const mySwipes = await base44.entities.SwipeAction.filter({ from_profile_id: profile.id });
      const swipedIds = new Set(mySwipes.map(s => s.to_profile_id));
      
      // Filter profiles (base filtering)
      const baseFiltered = fetchedProfiles.filter(p => {
        // Not myself
        if (p.id === profile.id) return false;
        // Not already swiped
        if (swipedIds.has(p.id)) return false;
        // Must be a type I'm looking for
        if (!profile.looking_for.includes(p.profile_type)) return false;
        // Stealth mode check - only show if not in stealth or if I'm premium
        if (p.stealth_mode && !profile.is_premium) return false;
        return true;
      });
      
      // Sort by distance if we have location
      if (profile.latitude && profile.longitude) {
        baseFiltered.sort((a, b) => {
          const distA = getDistance(profile, a);
          const distB = getDistance(profile, b);
          return distA - distB;
        });
      }
      
      setAllProfiles(baseFiltered);
      applyFilters(baseFiltered, filters);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleEventFilter = async (eventId) => {
    if (!eventId) {
      setActiveEventId(null);
      setEventAttendeeProfileIds(null);
      applyFilters(allProfiles, filters);
      return;
    }
    setActiveEventId(eventId);
    const attendees = await base44.entities.EventAttendee.filter({ event_id: eventId, is_matched: true });
    const ids = new Set(attendees.map(a => a.profile_id).filter(Boolean));
    setEventAttendeeProfileIds(ids);
  };

  const applyFilters = (profileList, activeFilters) => {
    let filtered = [...profileList];
    
    // Filter by startup stage
    if (activeFilters.stages?.length > 0) {
      filtered = filtered.filter(p => 
        p.stage && activeFilters.stages.includes(p.stage)
      );
    }
    
    // Filter by archetype
    if (activeFilters.archetypes?.length > 0) {
      filtered = filtered.filter(p => 
        p.archetype && activeFilters.archetypes.includes(p.archetype)
      );
    }
    
    // Filter by tags
    if (activeFilters.tags?.length > 0) {
      filtered = filtered.filter(p => 
        p.tags?.some(tag => activeFilters.tags.includes(tag))
      );
    }
    
    // Filter by investment stages (for investors)
    if (activeFilters.investmentStages?.length > 0) {
      filtered = filtered.filter(p => 
        p.investment_stages?.some(stage => activeFilters.investmentStages.includes(stage))
      );
    }
    
    // Filter by industries/focus areas
    if (activeFilters.industries?.length > 0) {
      filtered = filtered.filter(p => 
        p.investment_industries?.some(ind => activeFilters.industries.includes(ind)) ||
        p.focus_areas?.some(area => activeFilters.industries.includes(area))
      );
    }
    
    // Filter by service types
    if (activeFilters.serviceTypes?.length > 0) {
      filtered = filtered.filter(p => 
        p.service_types?.some(service => activeFilters.serviceTypes.includes(service))
      );
    }

    // Event attendee filter
    if (eventAttendeeProfileIds) {
      filtered = filtered.filter(p => eventAttendeeProfileIds.has(p.id));
    }
    
    setProfiles(filtered);
    setCurrentIndex(0);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(allProfiles, newFilters);
    
    // Track filter usage
    Object.entries(newFilters).forEach(([key, values]) => {
      if (values?.length > 0) {
        AnalyticsService.trackFilterApplied(key);
      }
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, arr) => count + (arr?.length || 0), 0);
  };

  const getDistance = (p1, p2) => {
    if (!p1.latitude || !p1.longitude || !p2.latitude || !p2.longitude) return Infinity;
    
    const R = 6371; // Earth's radius in km
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSwipe = async (action) => {
    if (currentIndex >= profiles.length) return;
    
    const targetProfile = profiles[currentIndex];
    
    // Track analytics
    const viewDuration = profileViewStart ? Math.floor((Date.now() - profileViewStart) / 1000) : 5;
    AnalyticsService.trackSwipe(action, targetProfile.profile_type, viewDuration);
    setProfileViewStart(Date.now());
    
    // Save swipe action
    await base44.entities.SwipeAction.create({
      from_profile_id: myProfile.id,
      to_profile_id: targetProfile.id,
      action: action
    });
    
    // Save for undo
    setLastSwipe({ index: currentIndex, profile: targetProfile, action });
    setSwipedProfiles(prev => [...prev, targetProfile.id]);
    
    if (action === 'like') {
      // Check if they also liked me
      const theirSwipes = await base44.entities.SwipeAction.filter({
        from_profile_id: targetProfile.id,
        to_profile_id: myProfile.id,
        action: 'like'
      });
      
      if (theirSwipes.length > 0) {
        // Mutual interest - create pending match for the other party to accept
        await base44.entities.Match.create({
          from_profile_id: myProfile.id,
          to_profile_id: targetProfile.id,
          status: 'pending'  // Requires acceptance
        });
        
        setMatchedProfile(targetProfile);
        setShowMatch(true);
      }
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  const handleUndo = async () => {
    if (!lastSwipe) return;
    
    // Delete the swipe action
    const swipes = await base44.entities.SwipeAction.filter({
      from_profile_id: myProfile.id,
      to_profile_id: lastSwipe.profile.id
    });
    
    for (const swipe of swipes) {
      await base44.entities.SwipeAction.delete(swipe.id);
    }
    
    setCurrentIndex(lastSwipe.index);
    setSwipedProfiles(prev => prev.filter(id => id !== lastSwipe.profile.id));
    setLastSwipe(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentProfiles = profiles.slice(currentIndex, currentIndex + 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Minus1
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEventLink(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${activeEventId ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <CalendarDays className="w-4 h-4" />
              {activeEventId ? 'Event' : 'Events'}
            </button>
            <DiscoverFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              activeCount={getActiveFilterCount()}
            />
            <div className="text-sm text-slate-500">
              {profiles.length - currentIndex} left
            </div>
          </div>
        </div>

        {/* Corporate Paywall for unpaid corporate profiles */}
        {isCorporateProfile(myProfile?.profile_type) && !myProfile?.is_premium && !['business', 'enterprise'].includes(myProfile?.subscription_tier) && (
          <div className="px-4 mb-4">
            <CorporatePaywall 
              profileType={myProfile.profile_type}
              onUpgrade={() => navigate(createPageUrl('Settings'))}
            />
          </div>
        )}

        {/* Event Filter Banner */}
        {activeEventId && (
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2 text-sm text-cyan-800">
              <CalendarDays className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span className="flex-1 font-medium">Showing event attendees only</span>
              <button onClick={() => handleEventFilter(null)} className="text-cyan-600 hover:text-cyan-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Event Link Panel */}
        {showEventLink && (
          <div className="px-4 mb-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <EventLink
                myProfile={myProfile}
                onLinkedEventsChange={() => {}}
              />
              {/* Quick event filter buttons */}
              <EventFilterPicker myProfile={myProfile} activeEventId={activeEventId} onSelect={(id) => { handleEventFilter(id); setShowEventLink(false); }} />
            </div>
          </div>
        )}

        {/* AI Recommendations for paid users */}
        <div className="px-4">
          <AIRecommendations 
            myProfile={myProfile}
            profiles={allProfiles}
            onViewProfile={(profile) => {
              const index = profiles.findIndex(p => p.id === profile.id);
              if (index !== -1) setCurrentIndex(index);
            }}
          />
        </div>

        {/* Card Stack */}
        <div className="relative h-[600px] px-4">
          {currentProfiles.length > 0 ? (
            <AnimatePresence>
              {currentProfiles.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isTop={index === 0}
                  onSwipe={handleSwipe}
                  myProfileId={myProfile?.id}
                />
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No more profiles
              </h3>
              <p className="text-slate-500 mb-6">
                You've seen everyone matching your criteria. Check back later or update your preferences.
              </p>
              <button
                onClick={() => navigate(createPageUrl('Settings'))}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Update Preferences
              </button>
            </motion.div>
          )}
        </div>

        {/* Swipe Buttons */}
        {currentProfiles.length > 0 && (
          <SwipeButtons
            onPass={() => handleSwipe('pass')}
            onLike={() => handleSwipe('like')}
            onUndo={handleUndo}
            canUndo={!!lastSwipe}
          />
        )}
      </div>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatch}
        onClose={() => setShowMatch(false)}
        matchedProfile={matchedProfile}
        myProfile={myProfile}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Users, Search, CalendarDays, X, Sparkles } from 'lucide-react';
import ProfileCard from '@/components/ProfileCard';
import SwipeButtons from '@/components/SwipeButtons';
import MatchModal from '@/components/MatchModal';
import DiscoverFilters from '@/components/DiscoverFilters';
import BrandLogo from '@/components/BrandLogo';
import AIRecommendations from '@/components/AIRecommendations';
import EventLink from '@/components/EventLink';
import EventFilterPicker from '@/components/EventFilterPicker';
import CorporatePaywall, { isCorporateProfile, canContactProfile } from '@/components/CorporatePaywall';
import { AnalyticsService } from '@/components/analytics/AnalyticsService';
import { useToast } from '@/components/ui/use-toast';
import DiscoveryPreferencesModal from '@/components/DiscoveryPreferencesModal';
import DiscoveryPreferencesEditor from '@/components/DiscoveryPreferencesEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Discover() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [eventAttendeeProfileIds, setEventAttendeeProfileIds] = useState(null);
  const [showEventLink, setShowEventLink] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [profileViewStart, setProfileViewStart] = useState(null);
  // Store swipe history in state so pass time-gate logic can reference it in handleSwipe
  const [mySwipes, setMySwipes] = useState([]);
  // Preferences gate: shown when looking_for is unset
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  // Inline preferences editor dialog (accessible from the empty state)
  const [showPrefsEditor, setShowPrefsEditor] = useState(false);
  const [prefsEditorValue, setPrefsEditorValue] = useState([]);

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
      const user = await minus1.auth.me();
      const myProfiles = await minus1.entities.Profile.filter({ user_id: user.id });

      if (!myProfiles.length || !myProfiles[0].is_complete) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      setMyProfile(myProfiles[0]);

      // Gate: require the user to set their discovery preferences before showing profiles
      if (!myProfiles[0].looking_for?.length) {
        setShowPrefsModal(true);
        return; // loadProfiles called after modal saves
      }

      await loadProfiles(myProfiles[0]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Interleave profiles by the user's priority order.
   * lookingFor is an ordered array: index 0 = highest priority.
   * Weight per position: N, N-1, ..., 1 (where N = number of selected types).
   * Profiles are drawn in weighted round-robin cycles so the highest-priority
   * type appears proportionally more often without completely drowning out others.
   */
  const interleaveByPriority = (profiles, lookingFor) => {
    if (!lookingFor?.length) return profiles;

    const n = lookingFor.length;
    const byType = {};
    for (const type of lookingFor) byType[type] = [];

    const unlisted = []; // types not in looking_for (shouldn't normally appear but safety net)
    for (const p of profiles) {
      if (byType[p.profile_type] !== undefined) {
        byType[p.profile_type].push(p);
      } else {
        unlisted.push(p);
      }
    }

    const weights = lookingFor.map((_, i) => n - i); // [N, N-1, ..., 1]
    const cursors = lookingFor.map(() => 0);
    const result = [];

    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (let i = 0; i < lookingFor.length; i++) {
        const pool = byType[lookingFor[i]];
        for (let w = 0; w < weights[i] && cursors[i] < pool.length; w++) {
          result.push(pool[cursors[i]++]);
          hasMore = true;
        }
      }
    }

    return [...result, ...unlisted];
  };

  const loadProfiles = async (profile) => {
    try {
      const fetchedProfiles = await minus1.entities.Profile.filter({ is_complete: true });

      // Get my full swipe history
      const swipes = await minus1.entities.SwipeAction.filter({ from_profile_id: profile.id });
      setMySwipes(swipes);

      const now = new Date();

      // Build exclusion sets based on swipe type
      const likedIds = new Set();
      const gatedPassIds = new Set();

      for (const s of swipes) {
        if (s.action === 'like') {
          likedIds.add(s.to_profile_id);
        } else if (s.action === 'pass') {
          if (s.gated_until) {
            // Explicitly time-gated: exclude until gate expires
            if (new Date(s.gated_until) > now) {
              gatedPassIds.add(s.to_profile_id);
            }
            // Gate expired — profile is eligible to reappear
          } else {
            // Legacy pass without gated_until — retroactively apply 7-day gate
            const createdAt = new Date(s.created_date ?? s.created_at ?? 0);
            const retroGate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (retroGate > now) {
              gatedPassIds.add(s.to_profile_id);
            }
          }
        }
      }

      // Get profiles that have sent me a pending match request (for priority boost)
      const pendingRequestsToMe = await minus1.entities.Match.filter({
        to_profile_id: profile.id,
        status: 'pending'
      });
      const requestorIds = new Set(pendingRequestsToMe.map(m => m.from_profile_id));

      // Base filter
      const baseFiltered = fetchedProfiles.filter(p => {
        if (p.id === profile.id) return false;
        if (likedIds.has(p.id)) return false;
        if (gatedPassIds.has(p.id)) return false;
        if (!profile.looking_for?.includes(p.profile_type)) return false;
        if (p.stealth_mode && !profile.is_premium) return false;
        return true;
      });

      // Sort: profiles who have already sent a request get a mild priority boost,
      // then sort by distance within each group.
      baseFiltered.sort((a, b) => {
        const aRequested = requestorIds.has(a.id);
        const bRequested = requestorIds.has(b.id);

        if (aRequested !== bRequested) {
          return aRequested ? -1 : 1;
        }

        if (profile.latitude && profile.longitude) {
          return getDistance(profile, a) - getDistance(profile, b);
        }
        return 0;
      });

      // Interleave by priority order before storing
      const interleaved = interleaveByPriority(baseFiltered, profile.looking_for);
      setAllProfiles(interleaved);
      applyFilters(interleaved, filters);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handlePrefsSaved = async (orderedTypes) => {
    const updated = await minus1.entities.Profile.update(myProfile.id, { looking_for: orderedTypes });
    setMyProfile(updated);
    setShowPrefsModal(false);
    await loadProfiles(updated);
  };

  const handleEventFilter = async (eventId) => {
    if (!eventId) {
      setActiveEventId(null);
      setEventAttendeeProfileIds(null);
      applyFilters(allProfiles, filters);
      return;
    }
    setActiveEventId(eventId);
    const attendees = await minus1.entities.EventAttendee.filter({ event_id: eventId, is_matched: true });
    const ids = new Set(attendees.map(a => a.profile_id).filter(Boolean));
    setEventAttendeeProfileIds(ids);
  };

  const applyFilters = (profileList, activeFilters) => {
    let filtered = [...profileList];

    if (activeFilters.stages?.length > 0) {
      filtered = filtered.filter(p => p.stage && activeFilters.stages.includes(p.stage));
    }
    if (activeFilters.archetypes?.length > 0) {
      filtered = filtered.filter(p => p.archetype && activeFilters.archetypes.includes(p.archetype));
    }
    if (activeFilters.tags?.length > 0) {
      filtered = filtered.filter(p => p.tags?.some(tag => activeFilters.tags.includes(tag)));
    }
    if (activeFilters.investmentStages?.length > 0) {
      filtered = filtered.filter(p => p.investment_stages?.some(stage => activeFilters.investmentStages.includes(stage)));
    }
    if (activeFilters.industries?.length > 0) {
      filtered = filtered.filter(p =>
        p.investment_industries?.some(ind => activeFilters.industries.includes(ind)) ||
        p.focus_areas?.some(area => activeFilters.industries.includes(area))
      );
    }
    if (activeFilters.serviceTypes?.length > 0) {
      filtered = filtered.filter(p => p.service_types?.some(service => activeFilters.serviceTypes.includes(service)));
    }
    if (eventAttendeeProfileIds) {
      filtered = filtered.filter(p => eventAttendeeProfileIds.has(p.id));
    }

    setProfiles(filtered);
    setCurrentIndex(0);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(allProfiles, newFilters);
    Object.entries(newFilters).forEach(([key, values]) => {
      if (values?.length > 0) AnalyticsService.trackFilterApplied(key);
    });
  };

  const getActiveFilterCount = () =>
    Object.values(filters).reduce((count, arr) => count + (arr?.length || 0), 0);

  const getDistance = (p1, p2) => {
    if (!p1.latitude || !p1.longitude || !p2.latitude || !p2.longitude) return Infinity;
    const R = 6371;
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSwipe = async (action) => {
    if (currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];

    const viewDuration = profileViewStart ? Math.floor((Date.now() - profileViewStart) / 1000) : 5;
    AnalyticsService.trackSwipe(action, targetProfile.profile_type, viewDuration);
    setProfileViewStart(Date.now());

    // Save for undo before any async work
    setLastSwipe({ index: currentIndex, profile: targetProfile, action });
    setSwipedProfiles(prev => [...prev, targetProfile.id]);
    setCurrentIndex(prev => prev + 1);

    if (action === 'like') {
      await handleLike(targetProfile);
    } else if (action === 'pass') {
      await handlePass(targetProfile);
    }
  };

  const handleLike = async (targetProfile) => {
    // Record the swipe action
    await minus1.entities.SwipeAction.create({
      from_profile_id: myProfile.id,
      to_profile_id: targetProfile.id,
      action: 'like'
    });

    // Check if they already sent me a pending match request
    const theirRequestToMe = await minus1.entities.Match.filter({
      from_profile_id: targetProfile.id,
      to_profile_id: myProfile.id,
      status: 'pending'
    });

    if (theirRequestToMe.length > 0) {
      // Mutual interest confirmed — auto-match
      await minus1.entities.Match.update(theirRequestToMe[0].id, { status: 'matched' });
      setMatchedProfile(targetProfile);
      setShowMatch(true);
    } else {
      // Check we haven't already sent a request to avoid duplicates
      const myExistingRequest = await minus1.entities.Match.filter({
        from_profile_id: myProfile.id,
        to_profile_id: targetProfile.id,
        status: 'pending'
      });

      if (myExistingRequest.length === 0) {
        await minus1.entities.Match.create({
          from_profile_id: myProfile.id,
          to_profile_id: targetProfile.id,
          status: 'pending'
        });
      }

      toast({
        title: 'Request sent!',
        description: `Your request has been sent to ${targetProfile.display_name}. You'll be notified if they accept.`,
      });
    }
  };

  const handlePass = async (targetProfile) => {
    // Look up any existing pass swipe for this profile (gate may have expired and they're showing again)
    const existingPass = mySwipes.find(
      s => s.to_profile_id === targetProfile.id && s.action === 'pass'
    );

    const gateSchedule = { 1: 7, 2: 14 }; // decline_count → days; 3+ gets 28

    if (existingPass) {
      // Stacking gate: increment decline_count and extend gate
      const newCount = (existingPass.decline_count || 0) + 1;
      const days = gateSchedule[newCount] ?? 28;
      const gatedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await minus1.entities.SwipeAction.update(existingPass.id, {
        decline_count: newCount,
        gated_until: gatedUntil,
      });
      // Update local swipe cache
      setMySwipes(prev => prev.map(s =>
        s.id === existingPass.id ? { ...s, decline_count: newCount, gated_until: gatedUntil } : s
      ));
    } else {
      // First decline — 7-day gate
      const gatedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const newSwipe = await minus1.entities.SwipeAction.create({
        from_profile_id: myProfile.id,
        to_profile_id: targetProfile.id,
        action: 'pass',
        decline_count: 1,
        gated_until: gatedUntil,
      });
      setMySwipes(prev => [...prev, newSwipe]);
    }
  };

  const handleUndo = async () => {
    if (!lastSwipe) return;

    // Remove the swipe action(s) for this profile
    const swipesToDelete = mySwipes.filter(s => s.to_profile_id === lastSwipe.profile.id);
    for (const swipe of swipesToDelete) {
      await minus1.entities.SwipeAction.delete(swipe.id);
    }

    // If a match request was created for this like, remove it too
    if (lastSwipe.action === 'like') {
      const pendingMatch = await minus1.entities.Match.filter({
        from_profile_id: myProfile.id,
        to_profile_id: lastSwipe.profile.id,
        status: 'pending'
      });
      for (const m of pendingMatch) {
        await minus1.entities.Match.delete(m.id);
      }
    }

    setMySwipes(prev => prev.filter(s => s.to_profile_id !== lastSwipe.profile.id));
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
          <BrandLogo />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEventLink(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                activeEventId
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
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

        {/* Corporate Paywall */}
        {isCorporateProfile(myProfile?.profile_type) &&
          !myProfile?.is_premium &&
          !['business', 'enterprise'].includes(myProfile?.subscription_tier) && (
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
              <EventLink myProfile={myProfile} onLinkedEventsChange={() => {}} />
              <EventFilterPicker
                myProfile={myProfile}
                activeEventId={activeEventId}
                onSelect={(id) => { handleEventFilter(id); setShowEventLink(false); }}
              />
            </div>
          </div>
        )}

        {/* AI Recommendations (premium) */}
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
        <div className="relative h-[600px]">
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
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No more profiles</h3>
              <p className="text-slate-500 mb-6">
                You've seen everyone matching your criteria. Check back later or update your preferences.
              </p>
              <button
                onClick={() => {
                  setPrefsEditorValue(myProfile?.looking_for ?? []);
                  setShowPrefsEditor(true);
                }}
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

      {/* Match Modal — shown when a pending request from them gets auto-accepted */}
      <MatchModal
        isOpen={showMatch}
        onClose={() => setShowMatch(false)}
        matchedProfile={matchedProfile}
        myProfile={myProfile}
      />

      {/* Discovery preferences gate — blocks view until looking_for is set */}
      <DiscoveryPreferencesModal
        isOpen={showPrefsModal}
        onSave={handlePrefsSaved}
      />

      {/* Inline preferences editor — accessible from empty state */}
      <Dialog open={showPrefsEditor} onOpenChange={setShowPrefsEditor}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discovery Preferences</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-sm text-slate-500">
              Choose who you want to discover and drag to set your priority order.
            </p>
            <DiscoveryPreferencesEditor
              value={prefsEditorValue}
              onChange={setPrefsEditorValue}
            />
            <button
              onClick={async () => {
                await handlePrefsSaved(prefsEditorValue);
                setShowPrefsEditor(false);
              }}
              disabled={prefsEditorValue.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              Save Preferences
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

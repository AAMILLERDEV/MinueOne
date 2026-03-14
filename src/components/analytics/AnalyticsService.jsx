import { minus1 } from '@/api/minus1Client';

// Generate anonymous ID from user ID (one-way hash simulation)
const generateAnonId = (userId) => {
  // In production, use proper cryptographic hashing
  let hash = 0;
  const str = `anon_${userId}_${new Date().getFullYear()}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `anon_${Math.abs(hash).toString(36)}`;
};

// Get time bucket from hour
const getHourBucket = (hour) => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Get duration bucket
const getDurationBucket = (seconds) => {
  if (seconds < 5) return '<5s';
  if (seconds < 15) return '5-15s';
  if (seconds < 30) return '15-30s';
  if (seconds < 60) return '30-60s';
  if (seconds < 180) return '1-3m';
  if (seconds < 300) return '3-5m';
  return '5m+';
};

// Get platform
const getPlatform = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mobile/.test(ua)) return 'mobile_web';
  return 'web';
};

// Session management
let currentSessionId = null;
let sessionStartTime = null;

const getSessionId = () => {
  if (!currentSessionId) {
    currentSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStartTime = Date.now();
  }
  return currentSessionId;
};

// Analytics Service
export const AnalyticsService = {
  // Check if user has consented
  async hasConsent(consentType = 'analytics') {
    try {
      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      const profiles = await minus1.entities.AnonymousProfile.filter({ anon_id: anonId });
      if (profiles.length === 0) return false;
      
      switch (consentType) {
        case 'analytics': return profiles[0].consent_analytics;
        case 'research': return profiles[0].consent_research;
        case 'third_party': return profiles[0].consent_third_party;
        default: return false;
      }
    } catch {
      return false;
    }
  },

  // Initialize anonymous profile
  async initializeAnonymousProfile(profile, consents = {}) {
    try {
      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      
      const existing = await minus1.entities.AnonymousProfile.filter({ anon_id: anonId });
      
      const anonData = {
        anon_id: anonId,
        profile_type: profile.profile_type,
        subscription_tier: profile.subscription_tier || 'free',
        consent_analytics: consents.analytics ?? false,
        consent_research: consents.research ?? false,
        consent_third_party: consents.third_party ?? false,
        cohort_month: new Date().toISOString().slice(0, 7),
        first_seen_date: new Date().toISOString().split('T')[0]
      };

      if (existing.length > 0) {
        await minus1.entities.AnonymousProfile.update(existing[0].id, anonData);
      } else {
        await minus1.entities.AnonymousProfile.create(anonData);
      }
    } catch (error) {
      console.error('Analytics init error:', error);
    }
  },

  // Update demographic data (optional fields)
  async updateDemographics(demographics) {
    try {
      const hasConsent = await this.hasConsent('analytics');
      if (!hasConsent) return;

      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      const profiles = await minus1.entities.AnonymousProfile.filter({ anon_id: anonId });
      
      if (profiles.length > 0) {
        await minus1.entities.AnonymousProfile.update(profiles[0].id, demographics);
      }
    } catch (error) {
      console.error('Demographics update error:', error);
    }
  },

  // Track behavioral event
  async trackEvent(eventType, metadata = {}) {
    try {
      const hasConsent = await this.hasConsent('analytics');
      if (!hasConsent) return;

      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      const now = new Date();

      await minus1.entities.BehaviorEvent.create({
        anon_id: anonId,
        event_type: eventType,
        event_date: now.toISOString().split('T')[0],
        day_of_week: now.getDay(),
        hour_bucket: getHourBucket(now.getHours()),
        session_id_hash: getSessionId(),
        platform: getPlatform(),
        ...metadata
      });
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  },

  // Track swipe with target profile type (no IDs)
  async trackSwipe(action, targetProfileType, viewDurationSeconds) {
    await this.trackEvent(action === 'like' ? 'swipe_like' : 'swipe_pass', {
      target_profile_type: targetProfileType,
      duration_bucket: getDurationBucket(viewDurationSeconds)
    });
  },

  // Track profile view
  async trackProfileView(targetProfileType, durationSeconds) {
    const eventType = durationSeconds > 15 ? 'profile_view_extended' : 'profile_view';
    await this.trackEvent(eventType, {
      target_profile_type: targetProfileType,
      duration_bucket: getDurationBucket(durationSeconds)
    });
  },

  // Track feature usage
  async trackFeatureUsage(featureName) {
    await this.trackEvent('feature_used', { feature_name: featureName });
  },

  // Track filter applied
  async trackFilterApplied(filterCategory) {
    await this.trackEvent('filter_applied', { filter_category: filterCategory });
  },

  // Track session start
  async trackSessionStart() {
    currentSessionId = null; // Reset session
    getSessionId(); // Generate new session
    await this.trackEvent('session_start');
  },

  // Track session end
  async trackSessionEnd() {
    if (sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      await this.trackEvent('session_end', {
        duration_bucket: getDurationBucket(duration)
      });
    }
    currentSessionId = null;
    sessionStartTime = null;
  },

  // Track monetization event
  async trackMonetization(eventType, details = {}) {
    try {
      const hasConsent = await this.hasConsent('analytics');
      if (!hasConsent) return;

      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      const profiles = await minus1.entities.AnonymousProfile.filter({ anon_id: anonId });
      
      await minus1.entities.MonetizationEvent.create({
        anon_id: anonId,
        event_type: eventType,
        event_date: new Date().toISOString().split('T')[0],
        profile_type: profiles[0]?.profile_type,
        ...details
      });
    } catch (error) {
      console.error('Monetization tracking error:', error);
    }
  },

  // Update consent settings
  async updateConsent(consents) {
    try {
      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      const profiles = await minus1.entities.AnonymousProfile.filter({ anon_id: anonId });
      
      if (profiles.length > 0) {
        await minus1.entities.AnonymousProfile.update(profiles[0].id, {
          consent_analytics: consents.analytics ?? profiles[0].consent_analytics,
          consent_research: consents.research ?? profiles[0].consent_research,
          consent_third_party: consents.third_party ?? profiles[0].consent_third_party
        });
      }
    } catch (error) {
      console.error('Consent update error:', error);
    }
  },

  // Get current consent status
  async getConsentStatus() {
    try {
      const user = await minus1.auth.me();
      const anonId = generateAnonId(user.id);
      const profiles = await minus1.entities.AnonymousProfile.filter({ anon_id: anonId });
      
      if (profiles.length > 0) {
        return {
          analytics: profiles[0].consent_analytics,
          research: profiles[0].consent_research,
          third_party: profiles[0].consent_third_party
        };
      }
      return { analytics: false, research: false, third_party: false };
    } catch {
      return { analytics: false, research: false, third_party: false };
    }
  }
};

export default AnalyticsService;
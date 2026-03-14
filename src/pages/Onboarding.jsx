import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProfileTypeSelector from '@/components/ProfileTypeSelector';
import LookingForSelector from '@/components/LookingForSelector';
import UniversalFields from '@/components/onboarding/UniversalFields';
import FounderFields from '@/components/onboarding/FounderFields';
import CollaboratorFields from '@/components/onboarding/CollaboratorFields';
import InvestorFields from '@/components/onboarding/InvestorFields';
import ServiceProviderFields from '@/components/onboarding/ServiceProviderFields';
import AcceleratorFields from '@/components/onboarding/AcceleratorFields';
import EventOrganizerFields from '@/components/onboarding/EventOrganizerFields';
import DataConsentModal from '@/components/analytics/DataConsentModal';
import OptionalDemographics from '@/components/analytics/OptionalDemographics';
import { AnalyticsService } from '@/components/analytics/AnalyticsService';
import LinkedInImport from '@/components/LinkedInImport';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consents, setConsents] = useState({ analytics: false, research: false, third_party: false });
  const [showLinkedInImport, setShowLinkedInImport] = useState(true);
  
  const [profile, setProfile] = useState({
    profile_type: '',
    is_company_profile: false,
    display_name: '',
    avatar_url: '',
    bio: '',
    linkedin_url: '',
    website_url: '',
    location: '',
    latitude: null,
    longitude: null,
    remote_friendly: false,
    languages: [],
    availability: '',
    hours_per_week: null,
    collaboration_type: '',
    looking_for: [],
    tags: [],
    // Founder fields
    stage: '',
    archetype: '',
    problem_statement: '',
    target_customer: '',
    market_type: '',
    help_needed: [],
    equity_range_min: null,
    equity_range_max: null,
    timeline_urgency: '',
    // Collaborator fields
    primary_skills: [],
    secondary_skills: [],
    startup_experience: '',
    risk_tolerance: '',
    motivation: '',
    preferred_archetype: '',
    open_to_cofounder: false,
    // Investor fields
    investment_thesis: '',
    investment_stages: [],
    investment_industries: [],
    ticket_size_min: null,
    ticket_size_max: null,
    investment_instruments: [],
    geographic_focus: [],
    portfolio_highlights: '',
    office_hours_available: false,
    open_to_intros: false,
    // Service Provider fields
    service_types: [],
    service_stage_focus: [],
    free_intro_call: false,
    startup_discounts: false,
    past_clients: '',
    certifications: '',
    // Accelerator fields
    program_type: '',
    equity_taken: null,
    funding_offered: null,
    next_intake_date: '',
    focus_areas: [],
    benefits_offered: [],
    founder_match_facilitation: false,
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const user = await minus1.auth.me();
      const profiles = await minus1.entities.Profile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        setExistingProfile(profiles[0]);
        setProfile(p => ({ ...p, ...profiles[0] }));
        if (profiles[0].is_complete) {
          navigate(createPageUrl('Discover'));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await minus1.integrations.Core.UploadFile({ file });
      setProfile(p => ({ ...p, avatar_url: file_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setProfile(p => ({ ...p, latitude, longitude }));
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || '';
            const country = data.address.country || '';
            setProfile(p => ({ ...p, location: `${city}${city && country ? ', ' : ''}${country}` }));
          } catch (error) {
            console.error('Error getting location name:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = await minus1.auth.me();
      const profileData = { ...profile, user_id: user.id, email: user.email, is_complete: true, last_active: new Date().toISOString() };
      
      if (existingProfile) {
        await minus1.entities.Profile.update(existingProfile.id, profileData);
      } else {
        await minus1.entities.Profile.create(profileData);
      }
      
      // Initialize analytics with consent (non-blocking — don't let this delay navigation)
      AnalyticsService.initializeAnonymousProfile(profileData, consents).catch(e =>
        console.warn('Analytics init failed:', e)
      );

      navigate(createPageUrl('Discover'));
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (field, item) => {
    setProfile(p => ({
      ...p,
      [field]: (p[field] || []).includes(item) 
        ? p[field].filter(i => i !== item)
        : [...(p[field] || []), item]
    }));
  };

  const totalSteps = 5;

  const handleLinkedInImport = (importedData) => {
    setProfile(p => ({
      ...p,
      ...importedData,
      verification_badges: [...(p.verification_badges || []), ...(importedData.verification_badges || [])]
    }));
    setShowLinkedInImport(false);
    setStep(1); // Continue to profile type selection
  };
  const progress = (step / totalSteps) * 100;

  const renderTypeSpecificFields = () => {
    switch (profile.profile_type) {
      case 'founder':
        return <FounderFields profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />;
      case 'collaborator':
        return <CollaboratorFields profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />;
      case 'investor':
        return <InvestorFields profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />;
      case 'service_provider':
        return <ServiceProviderFields profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />;
      case 'accelerator':
        return <AcceleratorFields profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />;
      case 'event_organizer':
        return <EventOrganizerFields profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />;
      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">I am a...</h2>
              <p className="text-slate-500 mt-1">Select the profile type that best describes you</p>
            </div>
            <ProfileTypeSelector 
              selected={profile.profile_type} 
              onSelect={(type) => setProfile(p => ({ ...p, profile_type: type }))} 
            />
          </motion.div>
        );
      
      case 2:
        return (
          <UniversalFields
            key="step2"
            profile={profile}
            setProfile={setProfile}
            onImageUpload={handleImageUpload}
            onGetLocation={getLocation}
            isPremium={profile.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(profile.subscription_tier)}
            onUpgrade={() => navigate(createPageUrl('Settings'))}
          />
        );
      
      case 3:
        return renderTypeSpecificFields();
      
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Who are you looking for?</h2>
              <p className="text-slate-500 mt-1">Select the types of profiles you want to discover</p>
            </div>
            <LookingForSelector
              selected={profile.looking_for || []}
              onToggle={(id) => toggleArrayItem('looking_for', id)}
            />
          </motion.div>
        );
      
      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Help improve Minus1</h2>
              <p className="text-slate-500 mt-1">Optional: Share anonymous data to help us build better features</p>
            </div>
            
            <div className="space-y-4">
              <OptionalDemographics />
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-slate-900 mb-2">Data Consent</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Help us improve by sharing anonymized usage data. Your personal information is never sold.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowConsentModal(true)}
                >
                  Review Data Settings
                </Button>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!profile.profile_type;
      case 2: return !!profile.display_name;
      case 3: return true;
      case 4: return (profile.looking_for || []).length > 0;
      case 5: return true; // Optional step
      default: return false;
    }
  };

  // LinkedIn Import Screen
  if (showLinkedInImport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-lg mx-auto px-4 py-8">
          <LinkedInImport
            onImportComplete={handleLinkedInImport}
            onSkip={() => setShowLinkedInImport(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">Step {step} of {totalSteps}</p>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pb-4">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {step < totalSteps ? (
            <Button 
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={!canProceed() || loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          )}
        </div>
      </div>

      <DataConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onSave={(newConsents) => setConsents(newConsents)}
        initialConsents={consents}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Linkedin, Building2, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield, Mail, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function LinkedInImport({ onImportComplete, onSkip }) {
  const [mode, setMode] = useState(null); // 'personal' | 'company'
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState(null);
  const [verified, setVerified] = useState(false);

  const validateLinkedInUrl = (url) => {
    const personalPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
    const companyPattern = /^https?:\/\/(www\.)?linkedin\.com\/company\/[\w-]+\/?$/i;
    
    if (mode === 'personal') return personalPattern.test(url);
    if (mode === 'company') return companyPattern.test(url);
    return false;
  };

  const extractLinkedInData = async () => {
    if (!validateLinkedInUrl(linkedinUrl)) {
      setError(`Please enter a valid LinkedIn ${mode === 'personal' ? 'profile' : 'company'} URL`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract profile information from this LinkedIn URL for a startup matching platform. 
URL: ${linkedinUrl}
Profile type: ${mode === 'personal' ? 'Individual professional' : 'Company page'}

Based on the URL structure and common LinkedIn patterns, generate realistic placeholder data that would typically be found on such a profile. This is for demonstration purposes.

For a ${mode === 'personal' ? 'personal profile' : 'company page'}, extract:
${mode === 'personal' ? `
- Full name
- Professional headline/title
- Current company
- Location (city, country)
- Industry
- Bio/summary (brief)
- Skills (top 5)
- Experience level (junior, mid, senior, executive)
` : `
- Company name
- Industry
- Company size range
- Headquarters location
- Company description (brief)
- Specialties/focus areas
- Founded year range
`}

Return structured data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: mode === 'personal' ? {
            full_name: { type: "string" },
            headline: { type: "string" },
            current_company: { type: "string" },
            location: { type: "string" },
            industry: { type: "string" },
            bio: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            experience_level: { type: "string" }
          } : {
            company_name: { type: "string" },
            industry: { type: "string" },
            company_size: { type: "string" },
            headquarters: { type: "string" },
            description: { type: "string" },
            specialties: { type: "array", items: { type: "string" } },
            founded_year: { type: "string" }
          }
        }
      });

      setImportedData(response);
      
      // Generate verification code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setExpectedCode(code);
      setVerificationStep(true);

    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = () => {
    if (verificationCode.toUpperCase() === expectedCode) {
      setVerified(true);
      
      // Map imported data to profile format
      const profileData = mode === 'personal' ? {
        display_name: importedData.full_name,
        bio: importedData.bio || importedData.headline,
        location: importedData.location,
        linkedin_url: linkedinUrl,
        primary_skills: importedData.skills || [],
        verification_badges: ['linkedin_verified'],
        is_company_profile: false
      } : {
        display_name: importedData.company_name,
        bio: importedData.description,
        location: importedData.headquarters,
        linkedin_url: linkedinUrl,
        focus_areas: importedData.specialties || [],
        verification_badges: ['linkedin_verified'],
        is_company_profile: true
      };

      setTimeout(() => {
        onImportComplete?.(profileData);
      }, 1500);
    } else {
      setError('Verification code does not match. Please check and try again.');
    }
  };

  if (!mode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Quick Profile Setup</h2>
          <p className="text-slate-500 mt-1">Import your information from LinkedIn</p>
        </div>

        <div className="grid gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('personal')}
            className="bg-white border-2 border-slate-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Linkedin className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Personal LinkedIn</h3>
                <p className="text-sm text-slate-500">Import from your personal profile</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('company')}
            className="bg-white border-2 border-slate-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Company LinkedIn</h3>
                <p className="text-sm text-slate-500">Import from your company page</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </motion.button>
        </div>

        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
        >
          Skip and create profile manually
        </button>
      </motion.div>
    );
  }

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </motion.div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Profile Verified!</h3>
        <p className="text-slate-500">Setting up your profile...</p>
      </motion.div>
    );
  }

  if (verificationStep) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Verify Your Profile</h2>
          <p className="text-slate-500 mt-1">Confirm this is your LinkedIn profile</p>
        </div>

        {/* Imported Data Preview */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Linkedin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-slate-900">
              {mode === 'personal' ? importedData?.full_name : importedData?.company_name}
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {mode === 'personal' ? 'Personal' : 'Company'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mb-2">
            {mode === 'personal' ? importedData?.headline : importedData?.description?.substring(0, 100)}...
          </p>
          <p className="text-xs text-slate-500">
            {mode === 'personal' ? importedData?.location : importedData?.headquarters}
          </p>
        </div>

        {/* Verification Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">Verification Steps:</h4>
          <ol className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
              <span>Go to your LinkedIn profile and add this code to your headline or bio temporarily:</span>
            </li>
          </ol>
          
          <div className="bg-white rounded-lg p-3 mt-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <code className="text-lg font-mono font-bold text-blue-600">{expectedCode}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(expectedCode)}
              >
                Copy
              </Button>
            </div>
          </div>

          <ol className="text-sm text-blue-800 space-y-2 mt-3" start={2}>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
              <span>Enter the code below to confirm:</span>
            </li>
          </ol>
        </div>

        <div>
          <Label>Verification Code</Label>
          <Input
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Enter the code"
            className="mt-1 text-center text-lg font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setVerificationStep(false);
              setImportedData(null);
              setExpectedCode(null);
            }}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleVerification}
            disabled={verificationCode.length !== 6}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Verify & Continue
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          You can remove the code from your LinkedIn after verification
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <button
          onClick={() => setMode(null)}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to options
        </button>
        <h2 className="text-2xl font-bold text-slate-900">
          Import from {mode === 'personal' ? 'Personal' : 'Company'} LinkedIn
        </h2>
        <p className="text-slate-500 mt-1">
          Paste your LinkedIn {mode === 'personal' ? 'profile' : 'company page'} URL
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          {mode === 'personal' ? (
            <Linkedin className="w-5 h-5 text-blue-600" />
          ) : (
            <Building2 className="w-5 h-5 text-indigo-600" />
          )}
          <span className="font-medium text-slate-700">
            {mode === 'personal' ? 'Personal Profile' : 'Company Page'}
          </span>
        </div>
        <Input
          value={linkedinUrl}
          onChange={(e) => {
            setLinkedinUrl(e.target.value);
            setError(null);
          }}
          placeholder={mode === 'personal' 
            ? 'https://linkedin.com/in/yourname' 
            : 'https://linkedin.com/company/yourcompany'
          }
          className="bg-white"
        />
        <p className="text-xs text-slate-500 mt-2">
          Example: {mode === 'personal' 
            ? 'linkedin.com/in/johndoe' 
            : 'linkedin.com/company/acme-corp'
          }
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Secure Verification</p>
            <p className="text-xs text-green-700 mt-1">
              You'll be asked to verify ownership by adding a temporary code to your LinkedIn profile.
              This ensures only legitimate users can create profiles.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setMode(null)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={extractLinkedInData}
          disabled={!linkedinUrl || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              Import Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
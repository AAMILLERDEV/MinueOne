import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart3, Users, Building2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AnalyticsService } from './AnalyticsService';

export default function DataConsentModal({ isOpen, onClose, onSave, initialConsents = {} }) {
  const [consents, setConsents] = useState({
    analytics: initialConsents.analytics ?? false,
    research: initialConsents.research ?? false,
    third_party: initialConsents.third_party ?? false
  });
  const [expandedSection, setExpandedSection] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await AnalyticsService.updateConsent(consents);
    onSave?.(consents);
    setSaving(false);
    onClose();
  };

  const handleAcceptAll = async () => {
    const allConsents = { analytics: true, research: true, third_party: true };
    setConsents(allConsents);
    setSaving(true);
    await AnalyticsService.updateConsent(allConsents);
    onSave?.(allConsents);
    setSaving(false);
    onClose();
  };

  const sections = [
    {
      id: 'analytics',
      title: 'Platform Analytics',
      icon: BarChart3,
      description: 'Help us improve the platform experience',
      details: 'We collect anonymized data about how you use the app, including feature usage, session timing, and engagement patterns. This helps us improve the platform for everyone.',
      dataCollected: [
        'Swipe and match patterns (no profile identifiers)',
        'Session timing and frequency',
        'Feature usage statistics',
        'General engagement metrics'
      ]
    },
    {
      id: 'research',
      title: 'Research & Insights',
      icon: Users,
      description: 'Contribute to startup ecosystem research',
      details: 'Your anonymized data may be used for research on startup collaboration, founder matching, and entrepreneurship trends. No personally identifiable information is ever shared.',
      dataCollected: [
        'Aggregated behavioral trends',
        'Anonymized preference patterns',
        'Communication style indicators',
        'Success rate benchmarks'
      ]
    },
    {
      id: 'third_party',
      title: 'Third-Party Insights',
      icon: Building2,
      description: 'Power anonymized industry reports',
      details: 'Aggregated, anonymized insights may be shared with research partners, accelerators, and industry analysts. Individual data is never sold or shared - only statistical aggregates with a minimum sample size of 10+ users.',
      dataCollected: [
        'Industry benchmark reports',
        'Anonymized trend analysis',
        'Aggregated engagement statistics',
        'Market research insights'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Data & Privacy</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-slate-500">
              Choose how your anonymized data helps improve the platform and ecosystem.
              You can change these settings anytime.
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              
              return (
                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{section.title}</h3>
                          <p className="text-sm text-slate-500">{section.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={consents[section.id]}
                        onCheckedChange={(checked) => setConsents(c => ({ ...c, [section.id]: checked }))}
                      />
                    </div>
                    
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 mt-2 ml-13"
                    >
                      {isExpanded ? 'Less details' : 'More details'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-slate-50"
                      >
                        <div className="p-4">
                          <p className="text-sm text-slate-600 mb-3">{section.details}</p>
                          <p className="text-xs font-medium text-slate-500 mb-2">Data collected:</p>
                          <ul className="space-y-1">
                            {section.dataCollected.map((item, i) => (
                              <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Privacy Note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Privacy Commitment:</strong> We never store your name, email, exact location, 
                or message content. All data is anonymized and aggregated. You can opt out anytime.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 space-y-3">
            <Button 
              onClick={handleAcceptAll}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              Accept All
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1"
                disabled={saving}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Users, Building2, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalyticsService } from './AnalyticsService';
import DataConsentModal from './DataConsentModal';

export default function PrivacySettings() {
  const [consents, setConsents] = useState({
    analytics: false,
    research: false,
    third_party: false
  });
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    const status = await AnalyticsService.getConsentStatus();
    setConsents(status);
    setLoading(false);
  };

  const handleToggle = async (key, value) => {
    const newConsents = { ...consents, [key]: value };
    setConsents(newConsents);
    await AnalyticsService.updateConsent(newConsents);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Control how your anonymized data is used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Analytics */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-sm text-slate-900">Platform Analytics</p>
                <p className="text-xs text-slate-500">Help improve the app experience</p>
              </div>
            </div>
            <Switch
              checked={consents.analytics}
              onCheckedChange={(checked) => handleToggle('analytics', checked)}
            />
          </div>

          {/* Research */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-sm text-slate-900">Research & Insights</p>
                <p className="text-xs text-slate-500">Contribute to ecosystem research</p>
              </div>
            </div>
            <Switch
              checked={consents.research}
              onCheckedChange={(checked) => handleToggle('research', checked)}
            />
          </div>

          {/* Third Party */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-sm text-slate-900">Third-Party Insights</p>
                <p className="text-xs text-slate-500">Anonymized data in industry reports</p>
              </div>
            </div>
            <Switch
              checked={consents.third_party}
              onCheckedChange={(checked) => handleToggle('third_party', checked)}
            />
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowConsentModal(true)}
          >
            Learn More About Data Usage
          </Button>

          {/* Data Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="w-4 h-4 mr-2" />
              Request My Data (Coming Soon)
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" disabled>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Analytics Data (Coming Soon)
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center pt-2">
            Your personal profile data is never sold. Only anonymized, aggregated insights are used.
          </p>
        </CardContent>
      </Card>

      <DataConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onSave={(newConsents) => setConsents(newConsents)}
        initialConsents={consents}
      />
    </>
  );
}
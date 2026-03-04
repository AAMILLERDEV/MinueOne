import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, CheckCircle2, AlertCircle, Users, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AttendeeUploader({ eventId, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!eventId) { setError('Please save your event first.'); return; }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract attendee data
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            attendees: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  linkedin_url: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extracted.status !== 'success') {
        setError('Could not parse the file. Please use CSV or Excel with columns: name, email, linkedin_url');
        return;
      }

      const attendees = extracted.output?.attendees || [];

      // Load all profiles for matching
      const allProfiles = await base44.entities.Profile.list();
      const emailMap = {};
      const linkedinMap = {};
      allProfiles.forEach(p => {
        if (p.email) emailMap[p.email.toLowerCase()] = p;
        if (p.linkedin_url) {
          const key = p.linkedin_url.toLowerCase().replace(/\/$/, '');
          linkedinMap[key] = p;
        }
      });

      let matched = 0;
      const attendeeRecords = [];

      for (const a of attendees) {
        let matchedProfile = null;
        if (a.email) matchedProfile = emailMap[a.email.toLowerCase()];
        if (!matchedProfile && a.linkedin_url) {
          const key = a.linkedin_url.toLowerCase().replace(/\/$/, '');
          matchedProfile = linkedinMap[key];
        }

        attendeeRecords.push({
          event_id: eventId,
          profile_id: matchedProfile?.id || '',
          email: a.email || '',
          linkedin_url: a.linkedin_url || '',
          name: a.name || '',
          is_matched: !!matchedProfile,
          has_linked: false,
          source: 'csv_upload'
        });

        if (matchedProfile) matched++;
      }

      // Bulk create
      if (attendeeRecords.length > 0) {
        await base44.entities.EventAttendee.bulkCreate(attendeeRecords);
      }

      // Update event counts
      await base44.entities.Event.update(eventId, {
        total_attendee_count: attendees.length,
        matched_attendee_count: matched,
        attendee_csv_url: file_url
      });

      setResult({ total: attendees.length, matched });
      onComplete?.({ total: attendees.length, matched });
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Upload Attendee List</h3>
        <p className="text-sm text-slate-500">
          Upload a CSV or Excel file with columns: <code className="bg-slate-100 px-1 rounded text-xs">name, email, linkedin_url</code>
        </p>
      </div>

      {/* Download template hint */}
      <div className="text-xs text-slate-400 flex items-center gap-1">
        <Download className="w-3 h-3" />
        Tip: Export your attendee list from Eventbrite, Luma, or any ticketing platform
      </div>

      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${loading ? 'border-slate-200 bg-slate-50' : 'border-blue-200 bg-blue-50 hover:border-blue-400'}`}>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" disabled={loading} />
        {loading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-slate-600 font-medium">Processing attendees...</p>
            <p className="text-xs text-slate-400 mt-1">Matching emails & LinkedIn profiles</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">Drop file here or click to upload</p>
            <p className="text-xs text-slate-400 mt-1">CSV or Excel (.csv, .xlsx)</p>
          </>
        )}
      </label>

      {result && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">Upload complete!</p>
            <p className="text-sm text-green-700 mt-0.5">
              <span className="font-medium">{result.matched}</span> of <span className="font-medium">{result.total}</span> attendees matched to Minus1 profiles.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Users className="w-4 h-4 text-green-600" />
              <Badge className="bg-green-600 text-xs">{result.matched} on platform</Badge>
              <Badge variant="outline" className="text-xs">{result.total - result.matched} invited</Badge>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { minus1 } from '@/api/minus1Client';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const reportReasons = [
  { id: 'fake_profile', label: 'Fake Profile', description: 'Profile appears to be fake or misleading' },
  { id: 'harassment', label: 'Harassment', description: 'Abusive or threatening behavior' },
  { id: 'spam', label: 'Spam', description: 'Promotional or repetitive content' },
  { id: 'inappropriate_content', label: 'Inappropriate Content', description: 'Offensive or inappropriate material' },
  { id: 'scam', label: 'Scam', description: 'Fraudulent or deceptive activity' },
  { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { id: 'other', label: 'Other', description: 'Other violation' },
];

export default function ReportProfileModal({ 
  isOpen, 
  onClose, 
  reportedProfile, 
  myProfileId 
}) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    
    setSubmitting(true);
    try {
      await minus1.entities.ProfileReport.create({
        reporter_profile_id: myProfileId,
        reported_profile_id: reportedProfile.id,
        reason,
        description
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report Profile
          </DialogTitle>
          <DialogDescription>
            Report {reportedProfile?.display_name} for violating our community guidelines
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Report Submitted</h3>
            <p className="text-sm text-slate-500">We'll review this report and take appropriate action.</p>
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((r) => (
                <div key={r.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value={r.id} id={r.id} className="mt-0.5" />
                  <Label htmlFor={r.id} className="cursor-pointer flex-1">
                    <p className="font-medium text-slate-900">{r.label}</p>
                    <p className="text-sm text-slate-500">{r.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div>
              <Label>Additional Details (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context..."
                className="mt-1.5 h-20"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!reason || submitting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
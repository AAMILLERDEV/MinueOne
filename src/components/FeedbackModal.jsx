import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquarePlus, Loader2, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const feedbackTypes = [
  { id: 'bug', label: 'Bug Report', icon: '🐛' },
  { id: 'feature_request', label: 'Feature Request', icon: '✨' },
  { id: 'complaint', label: 'Complaint', icon: '😞' },
  { id: 'praise', label: 'Praise', icon: '🎉' },
  { id: 'other', label: 'Other', icon: '💬' },
];

export default function FeedbackModal({ isOpen, onClose, myProfileId }) {
  const [feedbackType, setFeedbackType] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType || !content) return;
    
    setSubmitting(true);
    try {
      await base44.entities.UserFeedback.create({
        profile_id: myProfileId,
        feedback_type: feedbackType,
        subject,
        content
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedbackType('');
    setSubject('');
    setContent('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-blue-500" />
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve Minus1 with your feedback
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Thank You!</h3>
            <p className="text-sm text-slate-500">Your feedback helps us build a better platform.</p>
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Feedback Type</Label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject (optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary..."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Your Feedback</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell us more..."
                className="mt-1.5 h-28"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!feedbackType || !content || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
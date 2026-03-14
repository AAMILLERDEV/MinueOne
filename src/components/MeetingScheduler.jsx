import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Video, Phone, Users, X, Check, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const meetingTypes = [
  { id: 'video', label: 'Video Call', icon: Video },
  { id: 'phone', label: 'Phone Call', icon: Phone },
  { id: 'in_person', label: 'In Person', icon: Users },
];

const durations = [15, 30, 45, 60];

export default function MeetingScheduler({ isOpen, onClose, matchId, myProfile, otherProfile, onScheduled }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [meeting, setMeeting] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    meeting_type: 'video',
    location: ''
  });

  const isPaidUser = myProfile?.is_premium || ['pro', 'business', 'enterprise'].includes(myProfile?.subscription_tier);

  useEffect(() => {
    if (isOpen && matchId) {
      loadMeetings();
    }
  }, [isOpen, matchId]);

  const loadMeetings = async () => {
    const allMeetings = await minus1.entities.Meeting.filter({ match_id: matchId });
    setMeetings(allMeetings);
  };

  const handleSchedule = async () => {
    if (!meeting.scheduled_date || !meeting.scheduled_time) return;
    
    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${meeting.scheduled_date}T${meeting.scheduled_time}`);
      
      await minus1.entities.Meeting.create({
        match_id: matchId,
        organizer_profile_id: myProfile.id,
        attendee_profile_id: otherProfile.id,
        title: meeting.title || `Meeting with ${otherProfile.display_name}`,
        description: meeting.description,
        scheduled_date: scheduledDateTime.toISOString(),
        duration_minutes: meeting.duration_minutes,
        meeting_type: meeting.meeting_type,
        location: meeting.location,
        status: 'pending'
      });

      onScheduled?.();
      onClose();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToMeeting = async (meetingId, status) => {
    await minus1.entities.Meeting.update(meetingId, { status });
    loadMeetings();
  };

  if (!isOpen) return null;

  const pendingMeetings = meetings.filter(m => m.status === 'pending' && m.attendee_profile_id === myProfile?.id);
  const upcomingMeetings = meetings.filter(m => m.status === 'confirmed' && new Date(m.scheduled_date) > new Date());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Schedule Meeting</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[70vh]">
            {!isPaidUser ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="font-semibold text-slate-900 mb-2">Meeting Scheduling</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Upgrade to Pro to schedule meetings directly in the app
                </p>
                <Badge className="bg-blue-600">Pro Feature</Badge>
              </div>
            ) : (
              <>
                {/* Pending Meeting Requests */}
                {pendingMeetings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-sm text-slate-700 mb-2">Meeting Requests</h4>
                    {pendingMeetings.map(m => (
                      <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(m.scheduled_date).toLocaleDateString()} at {new Date(m.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRespondToMeeting(m.id, 'confirmed')}>
                            <Check className="w-3 h-3 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRespondToMeeting(m.id, 'declined')}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming Meetings */}
                {upcomingMeetings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-sm text-slate-700 mb-2">Upcoming Meetings</h4>
                    {upcomingMeetings.map(m => (
                      <div key={m.id} className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <p className="font-medium text-sm">{m.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(m.scheduled_date).toLocaleDateString()} at {new Date(m.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {m.location && <p className="text-xs text-slate-500">{m.location}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Schedule New Meeting */}
                <h4 className="font-medium text-sm text-slate-700 mb-3">Schedule New Meeting</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label>Meeting Title</Label>
                    <Input
                      value={meeting.title}
                      onChange={(e) => setMeeting(m => ({ ...m, title: e.target.value }))}
                      placeholder={`Meeting with ${otherProfile?.display_name}`}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={meeting.scheduled_date}
                        onChange={(e) => setMeeting(m => ({ ...m, scheduled_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={meeting.scheduled_time}
                        onChange={(e) => setMeeting(m => ({ ...m, scheduled_time: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Duration</Label>
                    <div className="flex gap-2 mt-1">
                      {durations.map(d => (
                        <button
                          key={d}
                          onClick={() => setMeeting(m => ({ ...m, duration_minutes: d }))}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            meeting.duration_minutes === d
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Meeting Type</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {meetingTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setMeeting(m => ({ ...m, meeting_type: type.id }))}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              meeting.meeting_type === type.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-xs">{type.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Location / Meeting Link</Label>
                    <Input
                      value={meeting.location}
                      onChange={(e) => setMeeting(m => ({ ...m, location: e.target.value }))}
                      placeholder={meeting.meeting_type === 'video' ? 'Zoom/Google Meet link' : 'Address'}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={meeting.description}
                      onChange={(e) => setMeeting(m => ({ ...m, description: e.target.value }))}
                      placeholder="What would you like to discuss?"
                      className="mt-1 h-20"
                    />
                  </div>

                  <Button 
                    onClick={handleSchedule}
                    disabled={!meeting.scheduled_date || !meeting.scheduled_time || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                    Send Meeting Request
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
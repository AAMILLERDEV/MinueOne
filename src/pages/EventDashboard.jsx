import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, CalendarDays, Users, CheckCircle2, AlertCircle, Upload, Settings, Plus, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AttendeeUploader from '@/components/AttendeeUploader';

export default function EventDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', event_date: '', location: '', description: '', website_url: '' });
  const [createdEventId, setCreatedEventId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.Profile.filter({ user_id: user.id });
      if (!profiles.length || profiles[0].profile_type !== 'event_organizer') {
        navigate(createPageUrl('Discover'));
        return;
      }
      setMyProfile(profiles[0]);
      const myEvents = await base44.entities.Event.filter({ organizer_profile_id: profiles[0].id });
      setEvents(myEvents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.event_date || !myProfile) return;
    setSaving(true);
    try {
      const evt = await base44.entities.Event.create({
        ...newEvent,
        organizer_profile_id: myProfile.id,
        is_verified: false,
        is_active: true,
        matched_attendee_count: 0,
        total_attendee_count: 0
      });
      setEvents(prev => [evt, ...prev]);
      setCreatedEventId(evt.id);
      setCreating(false);
      setNewEvent({ name: '', event_date: '', location: '', description: '', website_url: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Discover'))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Event Dashboard</h1>
            <p className="text-sm text-slate-500">Manage your events and attendees</p>
          </div>
        </div>

        {/* Verification notice */}
        {!myProfile?.verification_badges?.includes('event_organizer') && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Verification Pending</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your organizer profile is under review. Events will go live once verified. Our team will contact you within 24h.
              </p>
            </div>
          </div>
        )}

        {/* Create Event Button */}
        {!creating && (
          <Button
            onClick={() => setCreating(true)}
            className="w-full mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
        )}

        {/* Create Event Form */}
        {creating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4"
          >
            <h2 className="font-semibold text-slate-900">New Event</h2>

            <div>
              <Label>Event Name *</Label>
              <Input value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Startup Summit 2026" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={newEvent.event_date} onChange={e => setNewEvent(p => ({ ...p, event_date: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="City or Online" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} placeholder="What is the event about?" className="mt-1.5 h-20" />
            </div>
            <div>
              <Label>Event Website</Label>
              <Input value={newEvent.website_url} onChange={e => setNewEvent(p => ({ ...p, website_url: e.target.value }))} placeholder="https://..." className="mt-1.5" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCreating(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateEvent} disabled={saving || !newEvent.name || !newEvent.event_date} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No events yet. Create your first event!</p>
            </div>
          ) : (
            events.map(event => (
              <motion.div key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{event.name}</h3>
                      <p className="text-sm text-slate-500">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <Badge className={event.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {event.is_verified ? <><CheckCircle2 className="w-3 h-3 mr-1" />Verified</> : 'Pending Verification'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{event.total_attendee_count} uploaded</span>
                    <span className="flex items-center gap-1 text-blue-600"><CheckCircle2 className="w-4 h-4" />{event.matched_attendee_count} on Minus1</span>
                  </div>

                  {/* Attendee Uploader for this event */}
                  <div className="border-t pt-4">
                    <AttendeeUploader
                      eventId={event.id}
                      onComplete={() => loadData()}
                    />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Show uploader for newly created event */}
        {createdEventId && !events.find(e => e.id === createdEventId) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
            <p className="font-medium text-slate-900 mb-4">Upload attendees for your new event</p>
            <AttendeeUploader eventId={createdEventId} onComplete={() => { setCreatedEventId(null); loadData(); }} />
          </div>
        )}
      </div>
    </div>
  );
}
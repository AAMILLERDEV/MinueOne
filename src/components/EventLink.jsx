import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Search, Link2, CheckCircle2, Loader2, Users, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function EventLink({ myProfile, onLinkedEventsChange }) {
  const [events, setEvents] = useState([]);
  const [linkedEventIds, setLinkedEventIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [myProfile]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await minus1.entities.Event.filter({ is_active: true, is_verified: true });
      setEvents(allEvents);

      // Find events this user already linked to
      if (myProfile?.id) {
        const myLinks = await minus1.entities.EventAttendee.filter({ profile_id: myProfile.id });
        setLinkedEventIds(new Set(myLinks.map(l => l.event_id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (event) => {
    if (!myProfile?.id) return;
    setLinking(event.id);
    try {
      if (linkedEventIds.has(event.id)) {
        // Unlink
        const existing = await minus1.entities.EventAttendee.filter({ event_id: event.id, profile_id: myProfile.id });
        for (const ea of existing) {
          await minus1.entities.EventAttendee.delete(ea.id);
        }
        setLinkedEventIds(prev => { const s = new Set(prev); s.delete(event.id); return s; });
      } else {
        // Link
        await minus1.entities.EventAttendee.create({
          event_id: event.id,
          profile_id: myProfile.id,
          email: myProfile.email || '',
          linkedin_url: myProfile.linkedin_url || '',
          name: myProfile.display_name,
          is_matched: true,
          has_linked: true,
          source: 'self_linked'
        });
        setLinkedEventIds(prev => new Set([...prev, event.id]));
      }
      onLinkedEventsChange?.([...linkedEventIds]);
    } catch (e) {
      console.error(e);
    } finally {
      setLinking(null);
    }
  };

  const filtered = events.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Link to Events</h3>
        <p className="text-sm text-slate-500">Join verified events to discover fellow attendees on Minus1</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const isLinked = linkedEventIds.has(event.id);
            const isLoading = linking === event.id;
            const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

            return (
              <motion.div
                key={event.id}
                layout
                className={`rounded-xl border p-4 transition-all ${isLinked ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}
              >
                <div className="flex items-start gap-3">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt={event.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{event.name}</h4>
                      {isLinked && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{eventDate}{event.location ? ` · ${event.location}` : ''}</p>
                    {event.matched_attendee_count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">{event.matched_attendee_count} on Minus1</span>
                      </div>
                    )}
                    {event.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {event.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isLinked ? 'outline' : 'default'}
                    onClick={() => handleLink(event)}
                    disabled={isLoading}
                    className={isLinked ? 'border-green-300 text-green-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600' : 'bg-blue-600 hover:bg-blue-700'}
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                      isLinked ? <><X className="w-3 h-3 mr-1" />Unlink</> : <><Link2 className="w-3 h-3 mr-1" />Link</>}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
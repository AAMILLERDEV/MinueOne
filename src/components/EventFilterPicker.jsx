import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { CalendarDays, Check, Loader2 } from 'lucide-react';

export default function EventFilterPicker({ myProfile, activeEventId, onSelect }) {
  const [linkedEvents, setLinkedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinked();
  }, [myProfile]);

  const loadLinked = async () => {
    if (!myProfile?.id) { setLoading(false); return; }
    try {
      const myLinks = await minus1.entities.EventAttendee.filter({ profile_id: myProfile.id });
      if (myLinks.length === 0) { setLoading(false); return; }
      const eventIds = [...new Set(myLinks.map(l => l.event_id))];
      const allEvents = await minus1.entities.Event.filter({ is_active: true });
      setLinkedEvents(allEvents.filter(e => eventIds.includes(e.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  if (linkedEvents.length === 0) return (
    <p className="text-xs text-slate-400 text-center py-3 mt-3 border-t">
      Link to events above to filter by attendees
    </p>
  );

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-xs font-semibold text-slate-500 mb-2">Filter by event attendees:</p>
      <div className="space-y-2">
        {linkedEvents.map(event => (
          <button
            key={event.id}
            onClick={() => onSelect(activeEventId === event.id ? null : event.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${activeEventId === event.id ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-slate-200 hover:border-cyan-200'}`}
          >
            <CalendarDays className={`w-4 h-4 flex-shrink-0 ${activeEventId === event.id ? 'text-cyan-600' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${activeEventId === event.id ? 'text-cyan-900' : 'text-slate-700'}`}>{event.name}</p>
              <p className="text-xs text-slate-400">{event.matched_attendee_count} on Minus1</p>
            </div>
            {activeEventId === event.id && <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

// unreadByMatch shape: { [matchId]: { count: number, preview: string } }
// unreadByTeam shape:  { [teamId]:  { count: number, preview: string } }
const UnreadContext = createContext({
  unreadCount: 0, unreadByMatch: {}, markMatchRead: () => {},
  teamUnreadCount: 0, unreadByTeam: {}, markTeamRead: () => {},
});

export function UnreadProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadByMatch, setUnreadByMatch] = useState({});
  const [unreadByTeam, setUnreadByTeam] = useState({});
  const profileIdRef = useRef(null);
  const matchIdsRef = useRef([]);
  const teamIdsRef = useRef([]);
  const channelRef = useRef(null);

  const unreadCount = Object.keys(unreadByMatch).length;
  const teamUnreadCount = Object.keys(unreadByTeam).length;

  useEffect(() => {
    if (isAuthenticated) {
      init();
    } else {
      setUnreadByMatch({});
      setUnreadByTeam({});
      profileIdRef.current = null;
      matchIdsRef.current = [];
      teamIdsRef.current = [];
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      if (!profiles?.length) return;

      const profileId = profiles[0].id;
      profileIdRef.current = profileId;

      // ── Match messages ──────────────────────────────────────────────────────
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`)
        .eq('status', 'matched');

      const matchIds = (matches ?? []).map(m => m.id);
      matchIdsRef.current = matchIds;

      if (matchIds.length) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('match_id, sender_profile_id, content, created_date')
          .in('match_id', matchIds)
          .neq('sender_profile_id', profileId)
          .order('created_date', { ascending: true });

        const matchResult = {};
        for (const matchId of matchIds) {
          const lastRead = localStorage.getItem(`last_read_${matchId}`);
          const unreadMsgs = (msgs ?? []).filter(m =>
            m.match_id === matchId &&
            (!lastRead || new Date(m.created_date) > new Date(lastRead))
          );
          if (unreadMsgs.length > 0) {
            const latest = unreadMsgs[unreadMsgs.length - 1];
            matchResult[matchId] = { count: unreadMsgs.length, preview: latest.content };
          }
        }
        setUnreadByMatch(matchResult);
      }

      // ── Team messages ───────────────────────────────────────────────────────
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('profile_id', profileId);

      const teamIds = (memberships ?? []).map(m => m.team_id);
      teamIdsRef.current = teamIds;

      if (teamIds.length) {
        const { data: teamMsgs } = await supabase
          .from('team_group_messages')
          .select('team_id, sender_profile_id, content, created_at')
          .in('team_id', teamIds)
          .neq('sender_profile_id', profileId)
          .order('created_at', { ascending: true });

        const teamResult = {};
        for (const teamId of teamIds) {
          const lastRead = localStorage.getItem(`last_read_team_${teamId}`);
          const unreadMsgs = (teamMsgs ?? []).filter(m =>
            m.team_id === teamId &&
            (!lastRead || new Date(m.created_at) > new Date(lastRead))
          );
          if (unreadMsgs.length > 0) {
            const latest = unreadMsgs[unreadMsgs.length - 1];
            teamResult[teamId] = { count: unreadMsgs.length, preview: latest.content };
          }
        }
        setUnreadByTeam(teamResult);
      }

      // ── Realtime ────────────────────────────────────────────────────────────
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      const channel = supabase
        .channel('global_unread')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new;
          if (!matchIdsRef.current.includes(msg.match_id)) return;
          if (msg.sender_profile_id === profileIdRef.current) return;
          const lastRead = localStorage.getItem(`last_read_${msg.match_id}`);
          const msgTime = new Date(msg.created_date ?? msg.created_at);
          if (!lastRead || msgTime > new Date(lastRead)) {
            setUnreadByMatch(prev => ({
              ...prev,
              [msg.match_id]: {
                count: (prev[msg.match_id]?.count ?? 0) + 1,
                preview: msg.content,
              },
            }));
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_group_messages' }, (payload) => {
          const msg = payload.new;
          if (!teamIdsRef.current.includes(msg.team_id)) return;
          if (msg.sender_profile_id === profileIdRef.current) return;
          const lastRead = localStorage.getItem(`last_read_team_${msg.team_id}`);
          const msgTime = new Date(msg.created_at);
          if (!lastRead || msgTime > new Date(lastRead)) {
            setUnreadByTeam(prev => ({
              ...prev,
              [msg.team_id]: {
                count: (prev[msg.team_id]?.count ?? 0) + 1,
                preview: msg.content,
              },
            }));
          }
        })
        .subscribe();
      channelRef.current = channel;
    } catch (err) {
      console.error('[UnreadContext] init error:', err);
    }
  };

  const markMatchRead = (matchId) => {
    localStorage.setItem(`last_read_${matchId}`, new Date().toISOString());
    setUnreadByMatch(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  };

  const markTeamRead = (teamId) => {
    localStorage.setItem(`last_read_team_${teamId}`, new Date().toISOString());
    setUnreadByTeam(prev => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  };

  return (
    <UnreadContext.Provider value={{
      unreadCount, unreadByMatch, markMatchRead,
      teamUnreadCount, unreadByTeam, markTeamRead,
    }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}

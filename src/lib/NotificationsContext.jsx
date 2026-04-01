import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  createNotification: async () => {},
});

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const profileIdRef = useRef(null);
  const channelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isAuthenticated) {
      init();
    } else {
      setNotifications([]);
      profileIdRef.current = null;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
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
        .from('profiles').select('id').eq('user_id', user.id).limit(1);
      if (!profiles?.length) return;

      const profileId = profiles[0].id;
      profileIdRef.current = profileId;

      await loadNotifications(profileId);

      // Realtime: new notifications pushed to this user
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      const channel = supabase
        .channel(`notifications:${profileId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `profile_id=eq.${profileId}`,
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();
      channelRef.current = channel;
    } catch (err) {
      console.error('[NotificationsContext] init error:', err);
    }
  };

  const loadNotifications = async (profileId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!profileIdRef.current) return;
    await supabase.from('notifications')
      .update({ read: true })
      .eq('profile_id', profileIdRef.current)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Helper other parts of the app can call to create a notification for another user
  const createNotification = async ({ profileId, type, title, body, data }) => {
    try {
      await supabase.from('notifications').insert({
        profile_id: profileId, type, title, body: body ?? null, data: data ?? {},
      });
    } catch (err) {
      console.error('[NotificationsContext] createNotification error:', err);
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, markRead, markAllRead, createNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

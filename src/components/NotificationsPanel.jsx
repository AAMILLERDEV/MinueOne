import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, Check, Users, Zap, ClipboardList, MessageSquare, CheckCheck,
} from 'lucide-react';
import { useNotifications } from '@/lib/NotificationsContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TYPE_CONFIG = {
  team_invite:          { icon: Users,         color: 'text-purple-600', bg: 'bg-purple-100' },
  match_request:        { icon: Zap,           color: 'text-blue-600',   bg: 'bg-blue-100'   },
  match_waiting:        { icon: Zap,           color: 'text-cyan-600',   bg: 'bg-cyan-100'   },
  checklist_assignment: { icon: ClipboardList, color: 'text-green-600',  bg: 'bg-green-100'  },
  admin_message:        { icon: MessageSquare, color: 'text-amber-600',  bg: 'bg-amber-100'  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationItem({ notification, onRead }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.admin_message;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notification.read) onRead(notification.id);
    // Navigate based on type
    const d = notification.data ?? {};
    if (notification.type === 'team_invite' || notification.type === 'checklist_assignment') {
      navigate(createPageUrl('Company'));
    } else if (notification.type === 'match_request' || notification.type === 'match_waiting') {
      navigate(createPageUrl('Matches'));
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${!notification.read ? 'bg-blue-50/60' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{notification.body}</p>
        )}
        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </motion.button>
  );
}

export default function NotificationsPanel() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors bg-white"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      title="Mark all read"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Bell className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={markRead}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

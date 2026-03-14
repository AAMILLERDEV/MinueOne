import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useUnread } from '@/lib/UnreadContext';
import { motion } from 'framer-motion';
import { Compass, MessageCircle, Settings, BarChart3, Rss, Users } from 'lucide-react';

const navItems = [
  { name: 'Discover', icon: Compass, page: 'Discover' },
  { name: 'Matches', icon: MessageCircle, page: 'Matches' },
  { name: 'Feed', icon: Rss, page: 'Feed' },
  { name: 'Team', icon: Users, page: 'Team' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();
  const { unreadCount, teamUnreadCount } = useUnread();

  // Pages that don't show navigation
  const hideNav = ['Home', 'Onboarding', 'Chat', 'Login', 'PublicProfile', 'ResetPassword'].includes(currentPageName);

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {children}

      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40">
          <div className="max-w-lg mx-auto flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className="flex flex-col items-center py-2 px-4"
                >
                  <div className={`relative ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Icon className="w-6 h-6" />
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                      />
                    )}
                    {item.name === 'Matches' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {item.name === 'Team' && teamUnreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-0.5">
                        {teamUnreadCount > 9 ? '9+' : teamUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

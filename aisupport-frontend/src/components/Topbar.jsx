import { useState } from 'react';
import { Search, Bell, ChevronDown, Moon, Sun, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifications } from '../data/dummyData';

export default function Topbar({ title }) {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="topbar sticky top-0 z-30 flex items-center justify-between px-6 py-3 gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white hidden md:block">{title}</h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets, customers..."
            className="pl-9 pr-4 py-2 text-sm w-64 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#94a3b8' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="relative w-9 h-9 rounded-lg card-glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unread}</span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 card-glass rounded-xl shadow-2xl border border-purple-900/30 z-50">
              <div className="p-4 border-b border-purple-900/20">
                <div className="font-semibold text-white text-sm">Notifications</div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-purple-900/10 ${!n.read ? 'bg-purple-900/10' : ''}`}>
                    <div className="text-sm text-slate-300">{n.message}</div>
                    <div className="text-xs text-slate-500 mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg card-glass hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.role}</div>
            </div>
            <ChevronDown size={12} className="text-slate-500" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-48 card-glass rounded-xl shadow-2xl border border-purple-900/30 z-50 py-1">
              <button className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                <Settings size={14} /> Profile Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { Search, Bell, ChevronDown, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifications } from '../data/dummyData';

export default function Topbar({ title }) {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="topbar sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 md:px-6">
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <h1 className="text-lg font-black tracking-tight text-white">{title}</h1>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-200"><ShieldCheck size={12} /> All Systems Operational</div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets, customers..."
            className="w-52 py-2.5 pl-9 pr-4 text-sm md:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="card-glass relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:text-white"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unread}</span>
            )}
          </button>
          {showNotifs && (
            <div className="card-glass absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 shadow-2xl">
              <div className="border-b border-white/10 p-4">
                <div className="font-semibold text-white text-sm">Notifications</div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`border-b border-white/5 px-4 py-3 ${!n.read ? 'bg-cyan-400/5' : ''}`}>
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
            className="card-glass flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 text-xs font-black text-white">
              {user?.name?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.role}</div>
            </div>
            <ChevronDown size={12} className="text-slate-500" />
          </button>
          {showProfile && (
            <div className="card-glass absolute right-0 top-12 z-50 w-52 rounded-2xl border border-white/10 py-1 shadow-2xl">
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

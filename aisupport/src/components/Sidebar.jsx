import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, Bot, BarChart3,
  Users, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Lightbulb, Home, PlusCircle, Database, Search
} from 'lucide-react';
import logo from '../assets/ai-support-logo.png';

const navConfigs = {
  'Support Agent': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/agent/dashboard' },
    { label: 'Tickets', icon: Ticket, path: '/agent/tickets' },
    { label: 'AI Analysis', icon: Bot, path: '/agent/ai-analysis' },
  ],
  'Team Manager': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/team-manager/dashboard' },
    { label: 'All Tickets', icon: Ticket, path: '/team-manager/all-tickets' },
    { label: 'Performance', icon: Users, path: '/team-manager/performance' },
    { label: 'Dataset Management', icon: Database, path: '/team-manager/dataset-management' },
    { label: 'QuickSight', icon: BarChart3, path: '/team-manager/quicksight' },
  ],
  'Business Executive': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/executive/dashboard' },
    { label: 'Analytics', icon: TrendingUp, path: '/executive/analytics' },
    { label: 'QuickSight', icon: BarChart3, path: '/executive/quicksight' },
    { label: 'Insights', icon: Lightbulb, path: '/executive/analytics' },
  ],
  'Customer Portal User': [
    { label: 'Home', icon: Home, path: '/customer/my-tickets' },
    { label: 'Raise Ticket', icon: PlusCircle, path: '/customer/raise-ticket' },
    { label: 'Track Ticket', icon: Search, path: '/customer/track-ticket' },
    { label: 'My Tickets', icon: Ticket, path: '/customer/my-tickets' },
  ],
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = navConfigs[user?.role] || navConfigs['Support Agent'];

  return (
    <aside
      className="sidebar-glass z-40 flex h-screen flex-col transition-all duration-300"
      style={{ width: collapsed ? 76 : 280, minWidth: collapsed ? 76 : 280 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <img src={logo} alt="AI Support Intelligence" className="h-10 w-10 flex-shrink-0 rounded-2xl object-cover ring-1 ring-cyan-300/25" />
        {!collapsed && (
          <div>
            <div className="text-sm font-black leading-tight text-white">AI Support</div>
            <div className="text-xs text-cyan-200/80">Intelligence Cloud</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.split('/').length > 2);
          return (
            <div
              key={item.path}
              className={`nav-item flex items-center gap-3 px-3 py-3 ${active ? 'active' : 'text-slate-400'}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="space-y-2 border-t border-white/10 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 text-xs font-black text-white">
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-white">{user?.name}</div>
              <div className="truncate text-xs text-slate-500">{user?.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="nav-item flex items-center gap-3 px-3 py-2 w-full text-red-400 hover:text-red-300"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, Bot, BookOpen, Bell, BarChart3,
  Users, Settings, Shield, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, AlertTriangle, Lightbulb, UserCheck, Activity,
  Home, HelpCircle, Star, PlusCircle
} from 'lucide-react';
import logo from '../assets/ai-support-logo.png';

const navConfigs = {
  'Support Agent': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/agent' },
    { label: 'My Tickets', icon: Ticket, path: '/agent/tickets' },
    { label: 'AI Analysis', icon: Bot, path: '/agent/ai-analysis' },
    { label: 'Knowledge Base', icon: BookOpen, path: '/agent/knowledge' },
    { label: 'Notifications', icon: Bell, path: '/agent/notifications' },
    { label: 'Performance', icon: BarChart3, path: '/agent/performance' },
  ],
  'Team Manager': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/manager' },
    { label: 'My Team', icon: Users, path: '/manager/team' },
    { label: 'All Tickets', icon: Ticket, path: '/manager/tickets' },
    { label: 'Performance', icon: BarChart3, path: '/manager/performance' },
    { label: 'Reports', icon: TrendingUp, path: '/manager/reports' },
    { label: 'Settings', icon: Settings, path: '/manager/settings' },
  ],
  'Business Executive': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/executive' },
    { label: 'Analytics', icon: TrendingUp, path: '/executive/analytics' },
    { label: 'Reports', icon: BarChart3, path: '/executive/reports' },
    { label: 'Insights', icon: Lightbulb, path: '/executive/insights' },
    { label: 'Settings', icon: Settings, path: '/executive/settings' },
  ],
  'System Admin': [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Roles', icon: UserCheck, path: '/admin/roles' },
    { label: 'Security', icon: Shield, path: '/admin/security' },
    { label: 'System', icon: Activity, path: '/admin/system' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ],
  'Customer Portal User': [
    { label: 'Home', icon: Home, path: '/customer' },
    { label: 'Raise Ticket', icon: PlusCircle, path: '/customer/raise-ticket' },
    { label: 'My Tickets', icon: Ticket, path: '/customer/tickets' },
    { label: 'Knowledge Base', icon: HelpCircle, path: '/customer/faq' },
    { label: 'Feedback', icon: Star, path: '/customer/feedback' },
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
      className="sidebar-glass flex flex-col h-screen sticky top-0 transition-all duration-300 z-40"
      style={{ width: collapsed ? 64 : 240, minWidth: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-purple-900/30">
        <img src={logo} alt="AI Support Intelligence" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-white leading-tight">AI Support</div>
            <div className="text-xs text-purple-400">Intelligence</div>
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
              className={`nav-item flex items-center gap-3 px-3 py-2.5 ${active ? 'active' : 'text-slate-400'}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-purple-900/30 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.role}</div>
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
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

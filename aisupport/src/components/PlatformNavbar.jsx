import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifications } from '../data/dummyData';
import logo from '../assets/ai-support-logo.png';

const labels = {
  customer: 'Customer Portal',
  org: 'Organization Portal',
  login: 'Login',
  register: 'Register',
  'role-select': 'Role Selection',
  'ai-command-center': 'AI Command Center',
  'conversational-bi': 'Conversational BI',
  'governance-center': 'Governance Center',
  'root-cause-analyzer': 'Root Cause Analyzer',
  agent: 'Support Agent',
  'team-manager': 'Team Manager',
  executive: 'Business Executive',
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  'my-tickets': 'My Tickets',
  'raise-ticket': 'Raise Ticket',
  'track-ticket': 'Track Ticket',
  'ai-analysis': 'AI Analysis',
  knowledge: 'Knowledge Assistant',
  performance: 'Performance',
  'all-tickets': 'All Tickets',
  'dataset-management': 'Dataset Management',
  'sla-monitoring': 'SLA Monitoring',
  quicksight: 'QuickSight',
  analytics: 'Analytics',
  reports: 'Reports',
  insights: 'Insights',
  admin: 'Admin',
  users: 'Users',
  roles: 'Roles',
  security: 'Security',
  system: 'System',
  settings: 'Settings',
};

const roleHome = {
  'Customer Portal User': '/customer',
  'Support Agent': '/agent/dashboard',
  'Team Manager': '/team-manager/dashboard',
  'Business Executive': '/executive/dashboard',
};

const publicTabs = [
  { label: 'Customer Portal', path: '/customer/login' },
  { label: 'Organization Portal', path: '/org/login' },
];

const orgTabs = [
  { label: 'Agent', path: '/agent/dashboard' },
  { label: 'Manager', path: '/team-manager/dashboard' },
  { label: 'Executive', path: '/executive/dashboard' },
];

const customerTabs = [
  { label: 'My Tickets', path: '/customer/my-tickets' },
  { label: 'Raise Ticket', path: '/customer/raise-ticket' },
  { label: 'Track Ticket', path: '/customer/track-ticket' },
];

function buildBreadcrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return [{ label: 'Home', path: '/' }];
  return [
    { label: 'Home', path: '/' },
    ...parts.map((part, index) => ({
      label: labels[part] || part.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      path: `/${parts.slice(0, index + 1).join('/')}`,
    })),
  ];
}

export default function PlatformNavbar({ title, compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const unread = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const idx = window.history.state?.idx ?? 0;
    const max = Math.max(Number(sessionStorage.getItem('navMaxIdx') || 0), idx);
    sessionStorage.setItem('navMaxIdx', String(max));
    setCanGoBack(idx > 0);
    setCanGoForward(idx < max);
    setMenuOpen(false);
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);
  const tabs = user?.role === 'Customer Portal User' ? customerTabs : user ? orgTabs : publicTabs;
  const dashboardPath = roleHome[user?.role] || '/';

  const goHome = () => navigate('/');
  const goDashboard = () => navigate(dashboardPath);
  const navigatePortal = (path) => {
    const isCustomerPath = path.startsWith('/customer');
    const isOrgPath = path.startsWith('/org');
    const isCustomerUser = user?.role === 'Customer Portal User';
    if ((isOrgPath && isCustomerUser) || (isCustomerPath && user && !isCustomerUser)) {
      logout();
    }
    navigate(path);
  };
  const doLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className={`topbar sticky top-0 z-40 border-b border-white/10 px-3 py-3 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-2xl md:px-5 ${compact ? 'bg-slate-950/55' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="nav-icon-btn lg:hidden" aria-label="Open navigation">
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
            <button type="button" onClick={goHome} className="flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-white/[0.04]" title="Home">
              <img src={logo} alt="AI Support Intelligence" className="h-10 w-10 rounded-2xl object-cover ring-1 ring-cyan-300/25" />
              <div className="hidden min-w-0 text-left sm:block">
                <div className="truncate text-sm font-black text-white">AI Support Intelligence</div>
                <div className="truncate text-xs text-cyan-200/75">{title || 'Enterprise Support Cloud'}</div>
              </div>
            </button>
            <nav className="hidden min-w-0 items-center gap-1 text-xs text-slate-400 xl:flex">
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.path}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight size={12} className="text-slate-600" /> : null}
                  <Link to={crumb.path} className={`max-w-40 truncate rounded-lg px-2 py-1 transition hover:bg-white/[0.06] hover:text-white ${index === breadcrumbs.length - 1 ? 'text-cyan-100' : ''}`}>
                    {crumb.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1 lg:flex">
            <button type="button" onClick={goDashboard} className="quick-tab">
              <LayoutDashboard size={14} /> Dashboard
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigatePortal(tab.path)}
                className={`quick-tab ${location.pathname.startsWith(tab.path) ? 'quick-tab-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} disabled={!canGoBack} title="Go Back" className="nav-icon-btn disabled:cursor-not-allowed disabled:opacity-35">
              <ArrowLeft size={17} />
            </button>
            <button type="button" onClick={() => navigate(1)} disabled={!canGoForward} title="Go Forward" className="nav-icon-btn disabled:cursor-not-allowed disabled:opacity-35">
              <ArrowRight size={17} />
            </button>
            <button type="button" onClick={goHome} title="Home" className="nav-icon-btn">
              <Home size={17} />
            </button>
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} title="Notifications" className="nav-icon-btn relative">
                <Bell size={17} />
                {unread > 0 ? <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread}</span> : null}
              </button>
              <AnimatePresence>
                {showNotifs ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="card-glass absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="border-b border-white/10 p-4 text-sm font-semibold text-white">Notifications</div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map((item) => (
                        <div key={item.id} className={`border-b border-white/5 px-4 py-3 ${!item.read ? 'bg-cyan-400/5' : ''}`}>
                          <div className="text-sm text-slate-300">{item.message}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.time}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="relative hidden md:block">
              <button type="button" onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }} title="Profile" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:border-cyan-300/35 hover:bg-white/[0.08]">
                {user ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 text-xs font-black text-white">{user.name?.[0] || 'U'}</div>
                ) : <UserCircle size={20} className="text-cyan-100" />}
                <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-100 xl:inline">{user?.name || 'Guest'}</span>
              </button>
              <AnimatePresence>
                {showProfile ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="card-glass absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/10 p-2 shadow-2xl">
                    <div className="px-3 py-2 text-xs text-slate-400">{user?.role || 'Public Access'}</div>
                    {user ? <button type="button" onClick={doLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"><LogOut size={15} /> Logout</button> : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            {user ? (
              <button type="button" onClick={doLogout} title="Logout" className="nav-icon-btn hidden sm:inline-flex">
                <LogOut size={17} />
              </button>
            ) : null}
          </div>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden lg:hidden">
              <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                <button type="button" onClick={goDashboard} className="mobile-nav-item"><LayoutDashboard size={15} /> Dashboard</button>
                {tabs.map((tab) => <button key={tab.path} type="button" onClick={() => navigatePortal(tab.path)} className="mobile-nav-item">{tab.label}</button>)}
                {user ? <button type="button" onClick={doLogout} className="mobile-nav-item text-rose-200"><LogOut size={15} /> Logout</button> : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/75 p-2 shadow-2xl backdrop-blur-2xl md:hidden">
        <button type="button" onClick={() => navigate(-1)} disabled={!canGoBack} className="nav-icon-btn disabled:opacity-35"><ArrowLeft size={17} /></button>
        <button type="button" onClick={goHome} className="nav-icon-btn"><Home size={17} /></button>
        <button type="button" onClick={() => navigate(1)} disabled={!canGoForward} className="nav-icon-btn disabled:opacity-35"><ArrowRight size={17} /></button>
      </div>
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Headphones,
  HelpCircle,
  Lock,
  LockKeyhole,
  Activity,
  Settings,
  Shield,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import logo from '../assets/ai-support-logo.png';

const roles = [
  {
    key: 'agent',
    label: 'Support Agent',
    desc: 'Handle and resolve customer tickets',
    icon: Headphones,
    path: '/agent',
    ring: 'border-purple-500/60 hover:shadow-purple-500/20',
    iconBg: 'from-purple-500/30 to-purple-700/20',
    accent: 'text-purple-300',
  },
  {
    key: 'manager',
    label: 'Team Manager',
    desc: 'Monitor team performance and tickets',
    icon: Users,
    path: '/manager',
    ring: 'border-blue-500/60 hover:shadow-blue-500/20',
    iconBg: 'from-blue-500/30 to-blue-700/20',
    accent: 'text-blue-300',
  },
  {
    key: 'executive',
    label: 'Business Executive',
    desc: 'View business analytics and insights',
    icon: BarChart3,
    path: '/executive',
    ring: 'border-emerald-500/60 hover:shadow-emerald-500/20',
    iconBg: 'from-emerald-500/30 to-emerald-700/20',
    accent: 'text-emerald-300',
  },
  {
    key: 'admin',
    label: 'System Admin',
    desc: 'Manage users and system settings',
    icon: Settings,
    path: '/admin',
    ring: 'border-amber-500/60 hover:shadow-amber-500/20',
    iconBg: 'from-amber-500/30 to-amber-700/20',
    accent: 'text-amber-300',
  },
  {
    key: 'customer',
    label: 'Customer Portal',
    desc: 'Track tickets and raise new requests',
    icon: UserCircle,
    path: '/customer',
    ring: 'border-pink-500/60 hover:shadow-pink-500/20',
    iconBg: 'from-pink-500/30 to-pink-700/20',
    accent: 'text-pink-300',
  },
];

const nextSteps = ['Select your role', 'Open your dashboard', 'Start managing tickets'];

const statusBadges = [
  { label: 'System Online', icon: null, dot: true, color: 'text-emerald-300' },
  { label: 'Secure Access', icon: Lock, color: 'text-blue-300' },
  { label: 'Live Environment', icon: Activity, color: 'text-purple-300' },
];

export default function RoleSelect() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleRole = (role) => {
    selectRole(role.key);
    navigate(role.path);
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 0% 24%, rgba(124,58,237,0.34), transparent 34%), radial-gradient(circle at 100% 0%, rgba(37,99,235,0.30), transparent 36%), linear-gradient(135deg, #090719 0%, #11133a 46%, #07152e 100%)',
      }}
    >
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 lg:px-8 lg:py-6">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AI Support Intelligence" className="h-11 w-11 rounded-xl object-cover ring-1 ring-purple-400/30" />
            <div>
              <div className="font-bold leading-tight text-white">AI Support Intelligence</div>
              <div className="text-xs text-purple-300">Customer Support Intelligence Platform</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {statusBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 shadow-lg shadow-black/10"
                  style={{ background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(12px)' }}
                >
                  {badge.dot ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/40" />
                  ) : (
                    <Icon size={14} className={badge.color} />
                  )}
                  {badge.label}
                </div>
              );
            })}
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(340px,0.4fr)] lg:items-center">
          <div className="min-w-0">
            <div className="mb-5 max-w-3xl">
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-100"
                style={{ background: 'rgba(139,92,246,0.14)' }}
              >
                <Shield size={13} />
                Role-Based Workspace Access
              </div>
              <h1 className="mb-3 text-4xl font-bold tracking-tight text-white lg:text-5xl">Select Your Role</h1>
              <p className="mb-3 max-w-3xl text-base leading-relaxed text-slate-300">
                Choose the workspace experience that matches your responsibility in the support intelligence system.
              </p>
              <p className="text-sm leading-relaxed text-slate-400">
                Select a role to open the dashboard designed for your workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isCustomer = role.key === 'customer';
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => handleRole(role)}
                    className={`group cursor-pointer rounded-2xl border p-4 text-left shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-400/60 ${role.ring} ${isCustomer ? 'md:col-span-2 md:mx-auto md:w-[54%]' : ''}`}
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(14,34,70,0.58))' }}
                  >
                    <div className="flex min-h-[112px] items-center gap-4">
                      <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${role.iconBg} ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105`}>
                        <Icon size={28} className={role.accent} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="mb-1.5 text-base font-bold text-white">{role.label}</h3>
                        <p className="text-sm leading-snug text-slate-300">{role.desc}</p>
                      </div>
                    </div>
                    <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${role.accent}`}>
                      Select <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <section className="rounded-2xl border border-white/15 p-5 shadow-2xl shadow-blue-950/20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(30,64,175,0.12))' }}>
              <div className="flex gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 ring-1 ring-purple-300/30">
                  <LockKeyhole size={25} className="text-purple-300" />
                </div>
                <div>
                  <h2 className="mb-2 text-lg font-bold text-white">Role-Based Access</h2>
                  <p className="mb-3 text-sm leading-relaxed text-slate-300">
                    Each user gets a dashboard based on their responsibility.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex gap-2"><span className="text-purple-300">•</span>Agents manage tickets</li>
                    <li className="flex gap-2"><span className="text-purple-300">•</span>Managers track performance</li>
                    <li className="flex gap-2"><span className="text-purple-300">•</span>Admins control access</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 p-5 shadow-xl shadow-blue-950/10" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(37,99,235,0.12))' }}>
              <div className="flex gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-300/30">
                  <ClipboardList size={25} className="text-blue-300" />
                </div>
                <div>
                  <h2 className="mb-3 text-lg font-bold text-white">What happens next?</h2>
                  <div className="space-y-2.5">
                    {nextSteps.map((step, index) => (
                      <div key={step} className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">{index + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 p-5 shadow-xl shadow-emerald-950/10" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(16,185,129,0.1))' }}>
              <div className="flex gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-300/30">
                  <ShieldCheck size={25} className="text-emerald-300" />
                </div>
                <div>
                  <h2 className="mb-2 text-lg font-bold text-white">Secure Access</h2>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Permissions can be updated later by the system administrator.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-start gap-3 text-sm leading-relaxed text-slate-400">
                <HelpCircle size={18} className="mt-0.5 flex-shrink-0 text-purple-300" />
                <p className="text-sm leading-relaxed text-slate-300">
                  Not sure which role to choose? <span className="text-purple-300">Contact your administrator.</span>
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

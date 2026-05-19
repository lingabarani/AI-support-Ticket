import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Route,
  Shield,
  Smile,
  Sparkles,
  TicketCheck,
  Users,
} from 'lucide-react';
import logo from '../assets/ai-support-logo.png';

const features = [
  {
    title: 'AI Ticket Intelligence',
    text: 'Automatically categorize, prioritize, and route tickets with AI accuracy.',
    icon: TicketCheck,
    color: 'text-blue-300',
  },
  {
    title: 'Sentiment Analysis',
    text: 'Understand customer emotions and improve interactions in real time.',
    icon: Smile,
    color: 'text-emerald-300',
  },
  {
    title: 'Churn Prediction',
    text: 'Identify at-risk customers early and take proactive actions to retain them.',
    icon: BarChart3,
    color: 'text-purple-300',
  },
  {
    title: 'Real-time Analytics',
    text: 'Live dashboards and metrics to drive faster, data-informed decisions.',
    icon: Route,
    color: 'text-sky-300',
  },
];

const stats = [
  { title: '24/7', text: 'Ticket Monitoring', icon: Clock },
  { title: 'AI-Powered', text: 'Insights', icon: BrainCircuit },
  { title: 'Role-Based', text: 'Dashboards', icon: Users },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/role-select');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 100% 0%, rgba(124,58,237,0.44), transparent 34%), radial-gradient(circle at 0% 100%, rgba(14,165,233,0.24), transparent 36%), linear-gradient(135deg, #081122 0%, #0d1030 44%, #12091f 100%)',
      }}
    >
      <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 py-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.88fr)] lg:px-10">
        <section className="order-2 lg:order-1">
          <div className="mb-10 hidden items-center gap-4 lg:flex">
            <img src={logo} alt="AI Support Intelligence" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-blue-300/30" />
            <div>
              <div className="text-2xl font-bold text-white">AI Support Intelligence</div>
              <div className="text-base text-slate-400">Enterprise Platform</div>
            </div>
          </div>

          <div className="max-w-2xl">
            <h2 className="mb-5 text-4xl font-bold leading-tight text-white lg:text-5xl">
              Intelligent Insights<br />
              <span className="gradient-text">Better Decisions</span><br />
              Happier Customers
            </h2>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-slate-300">
              AI-powered customer experience platform with real-time analytics, sentiment analysis, and intelligent ticket management.
            </p>

            <div className="mb-6 space-y-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex gap-4 rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <Icon size={22} className={feature.color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{feature.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.text} className="rounded-xl border border-white/10 p-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.13), rgba(139,92,246,0.08))' }}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                      <Icon size={20} className="text-blue-300" />
                    </div>
                    <div className="text-sm font-bold text-white">{stat.title}</div>
                    <div className="text-xs text-slate-400">{stat.text}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20">
                <Shield size={17} className="text-purple-300" />
              </div>
              Secure access for agents, managers, admins, and customers.
            </div>
          </div>
        </section>

        <section className="order-1 flex justify-center lg:order-2">
          <div className="w-full max-w-xl rounded-[28px] border border-white/15 p-6 shadow-2xl shadow-purple-950/40 lg:p-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(30,27,75,0.38))', backdropFilter: 'blur(18px)' }}>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <img src={logo} alt="AI Support Intelligence" className="h-11 w-11 rounded-xl object-cover" />
                <div>
                  <div className="font-bold text-white">AI Support Intelligence</div>
                  <div className="text-xs text-purple-300">Enterprise Platform</div>
                </div>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/20 px-3 py-2 text-xs font-medium text-blue-100" style={{ background: 'rgba(59,130,246,0.18)' }}>
                <Shield size={15} className="text-blue-200" />
                Secure Login
              </div>
              <div className="inline-flex w-fit items-center gap-2 text-xs text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                System Status: <span className="text-emerald-300">Online</span>
              </div>
            </div>

            <div className="mb-7 text-center">
              <h1 className="mb-2 text-3xl font-bold text-white">Welcome Back!</h1>
              <p className="text-sm text-slate-300">Access your AI support workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@company.com"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-11 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-11 py-3.5 pr-12 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-200">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="h-4 w-4 accent-blue-500" />
                  Remember me
                </label>
                <a href="#" className="text-sm text-blue-300 transition-colors hover:text-blue-200">Forgot Password?</a>
              </div>

              {error && <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 py-4 text-sm font-bold text-white shadow-xl shadow-purple-950/30 transition-all hover:-translate-y-0.5 hover:shadow-purple-700/25 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>Sign In <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Shield size={14} className="text-slate-500" />
              Your session is protected with secure authentication.
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-sm text-slate-300">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-300 transition-colors hover:text-blue-200">Register</Link>
            </p>
          </div>
        </section>

        <div className="order-3 text-center text-xs text-slate-500 lg:col-span-2 lg:text-left">
          Built for AI-powered support operations
        </div>
      </main>
    </div>
  );
}

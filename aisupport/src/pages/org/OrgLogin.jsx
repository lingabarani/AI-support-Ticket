import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Eye, EyeOff, Headphones, Lock, Mail, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/premium/AuthShell';
import GlowButton from '../../components/premium/GlowButton';

export default function OrgLogin() {
  const { login, demoLogin, logout, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'Customer Portal User') logout();
  }, [logout, user?.role]);

  const submit = async (event) => {
    event?.preventDefault?.();
    setError('');

    if (loading) {
      return;
    }

    setLoading(true);
    try {
      if (user?.role === 'Customer Portal User') logout();
      if (form.email.includes('@') && form.password.length >= 4) {
        await login(form.email, form.password, 'org', remember);
      } else {
        setError('Enter a valid work email and password to continue.');
        return;
      }
      navigate('/org/role-select', { replace: true });
    } catch (authError) {
      setError(authError.message || 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const providerDemo = (roleKey = 'support_agent') => {
    if (user?.role === 'Customer Portal User') logout();
    demoLogin('org', roleKey);
    navigate('/org/role-select', { replace: true });
  };

  return (
    <AuthShell title="Organization Portal Login" subtitle="Secure role-based access for support operations, analytics, and executive intelligence.">
      <div className="mb-5 grid gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.055] p-4 text-sm text-slate-300">
        {[['Support Agent', Headphones], ['Team Manager', Users], ['Business Executive', BarChart3]].map(([label, Icon]) => (
          <div key={label} className="flex items-center gap-3"><Icon size={16} className="text-cyan-200" /><span>{label}</span></div>
        ))}
      </div>
      <button type="button" onClick={() => providerDemo('support_agent')} className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/[0.08]">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-slate-900">G</span>
        Continue as Support Agent Demo
      </button>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => providerDemo('team_manager')} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-300/35">
          Team Manager Demo
        </button>
        <button type="button" onClick={() => providerDemo('business_executive')} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-300/35">
          Executive Demo
        </button>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />or sign in<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Work Email
          <div className="relative mt-2"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" /><input className="w-full px-10 py-3.5 text-sm" placeholder="name@enterprise.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Password
          <div className="relative mt-2">
            <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" />
            <input className="w-full px-10 py-3.5 pr-12 text-sm" placeholder="Enter password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded" /> Remember me</label>
          <button type="button" className="font-semibold text-cyan-200 hover:text-white">Forgot password?</button>
        </div>
        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <GlowButton type="submit" onClick={submit} className="w-full" disabled={loading} icon={Building2}>{loading ? 'Signing in...' : 'Sign in to Organization'}</GlowButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">Need an org account? <Link className="font-bold text-cyan-200 hover:text-white" to="/org/register">Register</Link></p>
    </AuthShell>
  );
}

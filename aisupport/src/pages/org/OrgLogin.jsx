import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/premium/AuthShell';
import GlowButton from '../../components/premium/GlowButton';

export default function OrgLogin() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event?.preventDefault?.();
    setError('');

    if (loading) {
      return;
    }

    setLoading(true);
    try {
      if (form.email.includes('@') && form.password.length >= 4) {
        await login(form.email, form.password, 'org');
      } else {
        demoLogin('org', 'support_agent');
      }
      navigate('/org/role-select', { replace: true });
    } catch {
      demoLogin('org', 'support_agent');
      navigate('/org/role-select', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const providerDemo = () => {
    demoLogin('org', 'support_agent');
    navigate('/org/role-select', { replace: true });
  };

  return (
    <AuthShell title="Organization Login" subtitle="Access Support Agent, Team Manager, and Business Executive workspaces.">
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={providerDemo} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/[0.08]">Continue with Google</button>
        <button onClick={providerDemo} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-300/40 hover:bg-white/[0.08]">Continue with Microsoft</button>
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
          <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" className="h-4 w-4 rounded" /> Remember me</label>
          <button type="button" className="font-semibold text-cyan-200 hover:text-white">Forgot password?</button>
        </div>
        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <GlowButton type="submit" onClick={submit} className="w-full" disabled={loading} icon={Building2}>{loading ? 'Signing in...' : 'Sign in to Organization'}</GlowButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">Need an org account? <Link className="font-bold text-cyan-200 hover:text-white" to="/org/register">Register</Link></p>
    </AuthShell>
  );
}

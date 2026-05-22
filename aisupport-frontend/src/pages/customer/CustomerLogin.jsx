import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, PanelsTopLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/premium/AuthShell';
import GlowButton from '../../components/premium/GlowButton';

export default function CustomerLogin() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email.includes('@') || form.password.length < 4) {
      setError('Enter a valid email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password, 'customer');
      navigate('/customer/my-tickets');
    } finally {
      setLoading(false);
    }
  };

  const providerDemo = () => {
    demoLogin('customer');
    navigate('/customer/my-tickets');
  };

  return (
    <AuthShell accent="purple" title="Customer Login" subtitle="Track tickets, monitor SLA, and continue AI-assisted support conversations.">
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={providerDemo} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/[0.08]">Continue with Google</button>
        <button onClick={providerDemo} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-300/40 hover:bg-white/[0.08]">Continue with Microsoft</button>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />or sign in<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Email
          <div className="relative mt-2"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" /><input className="w-full px-10 py-3.5 text-sm" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></div>
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Password
          <div className="relative mt-2">
            <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" />
            <input className="w-full px-10 py-3.5 pr-12 text-sm" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" className="h-4 w-4 rounded" /> Remember me</label>
          <button type="button" className="font-semibold text-cyan-200 hover:text-white">Forgot password?</button>
        </div>
        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <GlowButton className="w-full" disabled={loading} icon={PanelsTopLeft}>{loading ? 'Signing in...' : 'Sign in to Customer Portal'}</GlowButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">New customer? <Link className="font-bold text-purple-200 hover:text-white" to="/customer/register">Create account</Link></p>
    </AuthShell>
  );
}

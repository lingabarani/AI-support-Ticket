import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Eye, EyeOff, History, Lock, Mail, Search, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/premium/AuthShell';
import GlowButton from '../../components/premium/GlowButton';

export default function CustomerRegister() {
  const { register, demoLogin, logout, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.includes('@') || form.password.length < 6) {
      setError('Use your full name, a valid email, and a password with at least 6 characters.');
      return;
    }
    try {
      if (user && user.role !== 'Customer Portal User') logout();
      await register(form, 'customer', remember);
      navigate('/customer');
    } catch (authError) {
      setError(authError.message || 'Unable to create customer account.');
    }
  };

  const providerDemo = () => {
    if (user && user.role !== 'Customer Portal User') logout();
    demoLogin('customer');
    navigate('/customer');
  };

  return (
    <AuthShell accent="purple" title="Create Customer Account" subtitle="Start a guided support experience with ticket tracking, history, and AI help.">
      <div className="mb-5 grid gap-3 rounded-2xl border border-purple-300/15 bg-purple-400/[0.06] p-4 text-sm text-slate-300">
        {[['Ticket tracking', Search], ['Ticket history', History], ['AI help assistant', Bot]].map(([label, Icon]) => (
          <div key={label} className="flex items-center gap-3"><Icon size={16} className="text-purple-200" /><span>{label}</span></div>
        ))}
      </div>
      <button onClick={providerDemo} className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/[0.08]">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-slate-900">G</span>
        Continue with Google
      </button>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />or register<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative"><User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" /><input className="w-full px-10 py-3.5 text-sm" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="relative"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" /><input className="w-full px-10 py-3.5 text-sm" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="relative">
          <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
          <input className="w-full px-10 py-3.5 pr-12 text-sm" placeholder="Password" type={showPassword ? 'text' : 'password'} minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded" /> Remember this session</label>
        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <GlowButton className="w-full" icon={UserPlus}>Create Customer Account</GlowButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">Already registered? <Link className="font-bold text-purple-200 hover:text-white" to="/customer/login">Login</Link></p>
    </AuthShell>
  );
}

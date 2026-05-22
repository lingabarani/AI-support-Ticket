import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/premium/AuthShell';
import GlowButton from '../../components/premium/GlowButton';

export default function CustomerRegister() {
  const { register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.includes('@') || form.password.length < 6) {
      setError('Use your full name, a valid email, and a password with at least 6 characters.');
      return;
    }
    await register(form, 'customer');
    navigate('/customer/raise-ticket');
  };

  const providerDemo = () => {
    demoLogin('customer');
    navigate('/customer/raise-ticket');
  };

  return (
    <AuthShell accent="purple" title="Create Customer Account" subtitle="Start a premium support journey with guided ticket creation and SLA visibility.">
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={providerDemo} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/[0.08]">Continue with Google</button>
        <button onClick={providerDemo} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-300/40 hover:bg-white/[0.08]">Continue with Microsoft</button>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />or register<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative"><User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" /><input className="w-full px-10 py-3.5 text-sm" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="relative"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" /><input className="w-full px-10 py-3.5 text-sm" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="relative">
          <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
          <input className="w-full px-10 py-3.5 pr-12 text-sm" placeholder="Password" type={showPassword ? 'text' : 'password'} minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <GlowButton className="w-full" icon={UserPlus}>Create Customer Account</GlowButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">Already registered? <Link className="font-bold text-purple-200 hover:text-white" to="/customer/login">Login</Link></p>
    </AuthShell>
  );
}

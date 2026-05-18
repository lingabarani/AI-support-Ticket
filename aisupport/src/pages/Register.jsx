import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/ai-support-logo.png';

const roles = ['Support Agent', 'Team Manager', 'Business Executive', 'System Admin', 'Customer Portal User'];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Customer Portal User',
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/role-select');
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0f0d1a 0%, #1a1035 50%, #0d1628 100%)' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="AI Support Intelligence" className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <div className="font-bold text-white">AI Support Intelligence</div>
            <div className="text-xs text-purple-400">Developed by Lingabarani</div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={20} className="text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
          </div>
          <p className="text-slate-400 text-sm mb-6">Create an account for the support portal.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Full Name</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg" placeholder="Enter full name" required />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg" placeholder="Enter email" required />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => update('role', e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg">
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="w-full px-4 py-3 pr-10 text-sm rounded-lg"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Register <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

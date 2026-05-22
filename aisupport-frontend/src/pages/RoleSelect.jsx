import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, Headphones, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/ai-support-logo.png';
import AnimatedBackground from '../components/premium/AnimatedBackground';
import GradientBadge from '../components/premium/GradientBadge';
import GlowButton from '../components/premium/GlowButton';

const roles = [
  {
    key: 'support_agent',
    label: 'Support Agent',
    desc: 'Resolve assigned tickets faster with AI summaries, smart replies, and knowledge assistance.',
    icon: Headphones,
    path: '/agent/dashboard',
    tone: 'from-blue-500 to-cyan-300',
    border: 'border-cyan-300/30 hover:border-cyan-200/60',
    glow: 'hover:shadow-cyan-500/25',
    features: ['Assigned Tickets', 'AI Analysis', 'Smart Replies', 'Knowledge Assistant'],
  },
  {
    key: 'team_manager',
    label: 'Team Manager',
    desc: 'Lead operations with SLA health, throughput visibility, dataset workflows, and team analytics.',
    icon: Users,
    path: '/team-manager/dashboard',
    tone: 'from-emerald-500 to-teal-300',
    border: 'border-emerald-300/30 hover:border-emerald-200/60',
    glow: 'hover:shadow-emerald-500/25',
    features: ['SLA Monitoring', 'Team Analytics', 'Dataset Management', 'Operations Dashboard'],
  },
  {
    key: 'business_executive',
    label: 'Business Executive',
    desc: 'Review executive analytics, revenue signals, churn risk, and strategic support intelligence.',
    icon: BarChart3,
    path: '/executive/dashboard',
    tone: 'from-amber-400 to-orange-300',
    border: 'border-amber-300/35 hover:border-amber-200/70',
    glow: 'hover:shadow-amber-500/25',
    features: ['Revenue Insights', 'Churn Risk', 'Executive Analytics', 'Strategic AI Reports'],
  },
];

export default function RoleSelect() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleRole = (role) => {
    selectRole(role.key);
    navigate(role.path, { replace: true });
  };

  return (
    <AnimatedBackground variant="blue">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AI Support Intelligence" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-cyan-300/25" />
            <div>
              <div className="font-black text-white">AI Support Intelligence</div>
              <div className="text-xs text-cyan-200/80">Organization Workspace</div>
            </div>
          </div>
          <GradientBadge icon={ShieldCheck} tone="emerald">All Systems Operational</GradientBadge>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto mb-10 max-w-4xl text-center">
            <GradientBadge tone="purple" className="mb-5">Role-Based Enterprise Access</GradientBadge>
            <h1 className="text-4xl font-black tracking-tight text-white lg:text-6xl">Choose your intelligence workspace</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Select your workspace to continue.</p>
          </motion.div>

          <motion.div
            className="grid gap-6 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <motion.button
                  key={role.key}
                  type="button"
                  onClick={() => handleRole(role)}
                  variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -8, scale: 1.015 }}
                  whileTap={{ scale: 0.99 }}
                  className={`group flex min-h-[440px] flex-col rounded-[1.75rem] border ${role.border} premium-glass p-7 text-left shadow-2xl ${role.glow} transition duration-300`}
                >
                  <div className={`mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${role.tone} text-white shadow-2xl`}>
                    <Icon size={38} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">{role.label}</h2>
                  <p className="mt-3 min-h-[78px] text-sm leading-6 text-slate-300">{role.desc}</p>
                  <div className="mt-6 grid gap-3">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                        <CheckCircle2 size={16} className="text-cyan-200" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <GlowButton className="mt-auto w-full" subtle>
                    Continue as {role.label}
                  </GlowButton>
                </motion.button>
              );
            })}
          </motion.div>
        </section>
      </main>
    </AnimatedBackground>
  );
}

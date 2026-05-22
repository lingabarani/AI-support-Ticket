import { motion } from 'framer-motion';
import { Bot, Cloud, Database, LineChart, ShieldCheck, Sparkles } from 'lucide-react';
import logo from '../../assets/ai-support-logo.png';
import AnimatedBackground from './AnimatedBackground';
import GradientBadge from './GradientBadge';

export default function AuthShell({ title, subtitle, accent = 'blue', children }) {
  const metrics = [
    ['AI routing', 'Amazon Bedrock'],
    ['Data layer', 'DynamoDB'],
    ['Analytics', 'QuickSight'],
  ];

  return (
    <AnimatedBackground variant={accent === 'purple' ? 'purple' : 'blue'}>
      <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden min-h-screen flex-col justify-between border-r border-white/10 p-10 lg:flex">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AI Support Intelligence" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-cyan-300/25" />
            <div>
              <div className="font-black text-white">AI Support Intelligence</div>
              <div className="text-xs text-cyan-200/80">AWS enterprise support cloud</div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <GradientBadge icon={ShieldCheck} tone="emerald">All Systems Operational</GradientBadge>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white">Secure access to your AI support intelligence workspace.</h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">Authenticate into a premium support command center powered by DynamoDB, Amazon Bedrock, QuickSight, and AWS Cloud.</p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {metrics.map(([label, value], index) => (
                <motion.div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-bold text-white">{value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/35 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="grid grid-cols-[auto_1fr] gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 text-white shadow-2xl shadow-cyan-500/20">
                <Bot size={30} />
              </div>
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <GradientBadge icon={Database} tone="blue">DynamoDB</GradientBadge>
                  <GradientBadge icon={Cloud} tone="emerald">AWS Cloud</GradientBadge>
                  <GradientBadge icon={LineChart} tone="amber">QuickSight</GradientBadge>
                </div>
                <p className="text-sm leading-6 text-slate-300">AI triage, smart summaries, SLA forecasts, and executive-grade analytics converge in one role-based interface.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="w-full max-w-md">
            <div className="mb-7 lg:hidden">
              <img src={logo} alt="AI Support Intelligence" className="mb-4 h-12 w-12 rounded-2xl object-cover" />
              <GradientBadge icon={Sparkles} tone="purple">AWS-native support intelligence</GradientBadge>
            </div>
            <div className="premium-glass rounded-[1.75rem] p-6 shadow-[0_32px_90px_rgba(2,8,23,0.55)] md:p-8">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Secure Workspace</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
              </div>
              {children}
            </div>
          </motion.div>
        </section>
      </main>
    </AnimatedBackground>
  );
}

import { motion } from 'framer-motion';
import { Activity, Bot, Cloud, Database, LineChart, ShieldCheck, Sparkles } from 'lucide-react';
import GradientBadge from './GradientBadge';
import GlowButton from './GlowButton';

export default function EnterpriseHero({ onCustomer, onOrg }) {
  const badges = [
    { label: 'DynamoDB Data Layer', icon: Database, tone: 'blue' },
    { label: 'Amazon Bedrock AI', icon: Bot, tone: 'purple' },
    { label: 'QuickSight Analytics', icon: LineChart, tone: 'amber' },
    { label: 'AWS Cloud Infrastructure', icon: Cloud, tone: 'emerald' },
  ];

  return (
    <section className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_0.85fr] lg:py-20">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <GradientBadge icon={ShieldCheck} tone="emerald">All Systems Operational</GradientBadge>
          <GradientBadge icon={Sparkles} tone="purple">AWS-Native Intelligence</GradientBadge>
        </div>
        <h1 className="max-w-5xl text-5xl font-black leading-[1.02] tracking-tight text-white lg:text-7xl">
          AI-Driven Customer Support Intelligence Platform
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 lg:text-xl">
          Enterprise-grade ticket intelligence powered by Amazon Bedrock, DynamoDB, QuickSight, and AWS Cloud.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {badges.map((badge) => <GradientBadge key={badge.label} icon={badge.icon} tone={badge.tone}>{badge.label}</GradientBadge>)}
        </div>
        <div className="mt-9 flex flex-wrap gap-4">
          <GlowButton onClick={onOrg}>Organization Sign In</GlowButton>
          <GlowButton onClick={onCustomer} subtle>Customer Portal</GlowButton>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative mx-auto w-full max-w-xl"
      >
        <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/20 blur-3xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.055] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.55)] backdrop-blur-2xl">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">AWS Cloud AI Fabric</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Live Intelligence Mesh</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30">
              <Cloud size={24} />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {['Tickets', 'SLA', 'Revenue'].map((item, index) => (
              <motion.div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="mb-5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-cyan-300" />
                <p className="text-xs text-slate-400">{item}</p>
                <p className="mt-1 text-xl font-black text-white">{['98.7%', '14m', '$4.8M'][index]}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/45 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-200"><Bot size={20} /></span>
                <div>
                  <p className="font-bold text-white">Bedrock Resolution Engine</p>
                  <p className="text-xs text-slate-400">Intent, sentiment, churn risk, smart replies</p>
                </div>
              </div>
              <Activity size={20} className="text-emerald-300" />
            </div>
            <div className="mt-5 space-y-3">
              {[78, 92, 64].map((width, index) => (
                <div key={width} className="h-2 rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-purple-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 1, delay: 0.4 + index * 0.15 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

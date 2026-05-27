import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import GlowButton from './GlowButton';

const toneMap = {
  purple: {
    border: 'border-purple-300/30',
    icon: 'from-purple-500 to-fuchsia-400',
    glow: 'shadow-purple-500/20',
    text: 'text-purple-100',
  },
  blue: {
    border: 'border-cyan-300/30',
    icon: 'from-blue-500 to-cyan-300',
    glow: 'shadow-cyan-500/20',
    text: 'text-cyan-100',
  },
  emerald: {
    border: 'border-emerald-300/30',
    icon: 'from-emerald-500 to-teal-300',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-100',
  },
  amber: {
    border: 'border-amber-300/35',
    icon: 'from-amber-400 to-orange-300',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-100',
  },
};

export default function PremiumPortalCard({
  title,
  eyebrow,
  description,
  features,
  icon: Icon,
  tone = 'blue',
  cta = 'Open Portal',
  secondaryCta,
  onClick,
  secondary,
}) {
  const style = toneMap[tone] || toneMap.blue;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.015 }}
      className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-2xl border ${style.border} premium-glass p-6 text-left shadow-2xl ${style.glow} transition duration-300`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.icon}`} />
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl transition duration-500 group-hover:bg-white/20" />
      <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${style.icon} text-white shadow-2xl ${style.glow}`}>
        <Icon size={32} />
      </div>
      {eyebrow ? <p className={`mb-3 text-xs font-black uppercase tracking-[0.2em] ${style.text}`}>{eyebrow}</p> : null}
      <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
      <p className="mt-3 min-h-[54px] text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-6 grid gap-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
            <CheckCircle2 size={16} className={style.text} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto grid gap-3 pt-7">
        <GlowButton onClick={onClick} className="w-full" icon={ArrowRight}>
          {cta}
        </GlowButton>
        {secondaryCta ? (
          <button
            type="button"
            onClick={secondary}
            className="rounded-xl border border-white/12 bg-white/[0.035] px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/35 hover:bg-white/[0.07] hover:text-white"
          >
            {secondaryCta}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

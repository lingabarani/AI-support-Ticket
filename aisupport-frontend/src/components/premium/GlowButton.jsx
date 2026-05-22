import { ArrowRight } from 'lucide-react';

export default function GlowButton({ children, icon: Icon = ArrowRight, className = '', subtle = false, ...props }) {
  return (
    <button
      className={`group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 ${
        subtle
          ? 'border border-white/12 bg-white/[0.04] text-slate-100 hover:border-cyan-300/40 hover:bg-white/[0.08]'
          : 'bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white shadow-[0_18px_48px_rgba(56,189,248,0.2)] hover:shadow-[0_22px_70px_rgba(139,92,246,0.32)]'
      } ${className}`}
      {...props}
    >
      {children}
      {Icon ? <Icon size={16} className="transition-transform duration-300 group-hover:translate-x-1" /> : null}
    </button>
  );
}

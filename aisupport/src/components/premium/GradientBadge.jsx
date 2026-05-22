export default function GradientBadge({ children, icon: Icon, tone = 'blue', className = '' }) {
  const tones = {
    purple: 'border-purple-300/25 bg-purple-400/10 text-purple-100 shadow-purple-500/10',
    blue: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100 shadow-cyan-500/10',
    emerald: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100 shadow-emerald-500/10',
    amber: 'border-amber-300/25 bg-amber-400/10 text-amber-100 shadow-amber-500/10',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-xl ${tones[tone] || tones.blue} ${className}`}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}

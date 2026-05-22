import { motion } from 'framer-motion';

export default function AnimatedBackground({ variant = 'default', children, className = '' }) {
  const tone = {
    default: 'from-[#070b1d] via-[#091327] to-[#050816]',
    purple: 'from-[#0b071c] via-[#101638] to-[#06111f]',
    blue: 'from-[#06111f] via-[#0a1735] to-[#050816]',
    emerald: 'from-[#061611] via-[#0a1a2f] to-[#070b1d]',
  }[variant] || 'from-[#070b1d] via-[#091327] to-[#050816]';

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${tone} text-white ${className}`}>
      <div className="pointer-events-none absolute inset-0 premium-grid opacity-60" />
      <motion.div
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-purple-500/25 blur-3xl"
        animate={{ x: [0, 36, 0], y: [0, -20, 0], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-8rem] top-24 h-[34rem] w-[34rem] rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ x: [0, -48, 0], y: [0, 24, 0], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-400/15 blur-3xl"
        animate={{ scale: [1, 1.13, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

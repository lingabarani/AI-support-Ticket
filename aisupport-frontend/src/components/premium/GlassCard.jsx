import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false, as = 'div', ...props }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`premium-glass rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

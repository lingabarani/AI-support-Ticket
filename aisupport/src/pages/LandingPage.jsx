import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Building2, Cloud, Headphones, LineChart, Search, ShieldCheck, Ticket, UserCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/ai-support-logo.png';
import AnimatedBackground from '../components/premium/AnimatedBackground';
import EnterpriseHero from '../components/premium/EnterpriseHero';
import PremiumPortalCard from '../components/premium/PremiumPortalCard';
import GradientBadge from '../components/premium/GradientBadge';
import GlassCard from '../components/premium/GlassCard';
import PlatformNavbar from '../components/PlatformNavbar';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const enterPortal = (portal, path) => {
    const isCustomer = user?.role === 'Customer Portal User';
    const switchingPortal = (portal === 'org' && isCustomer) || (portal === 'customer' && user && !isCustomer);
    if (switchingPortal) logout();
    navigate(path);
  };

  const portals = [
    {
      title: 'Customer Portal',
      eyebrow: 'For customers',
      description: 'Raise tickets, track status, review ticket history, and chat with the AI assistant for faster support.',
      features: ['Raise Tickets', 'Track Ticket Status', 'View Ticket History', 'Chat with AI Assistant'],
      icon: UserCircle,
      tone: 'purple',
      onClick: () => enterPortal('customer', '/customer/login'),
      secondary: () => enterPortal('customer', '/customer/register'),
      cta: 'Enter Customer Portal',
      secondaryCta: 'Create Customer Account',
    },
    {
      title: 'Organization Portal',
      eyebrow: 'For enterprise teams',
      description: 'Role-based access for support agents, team managers, and business executives in one intelligence workspace.',
      features: ['Support Agent Workspace', 'Team Manager Operations', 'Business Executive Insights', 'QuickSight Analytics'],
      icon: Building2,
      tone: 'blue',
      onClick: () => enterPortal('org', '/org/login'),
      secondary: () => enterPortal('org', '/org/register'),
      cta: 'Enter Organization Portal',
      secondaryCta: 'Register Organization User',
    },
  ];

  return (
    <AnimatedBackground>
      <PlatformNavbar title="Enterprise Platform" />
      <main className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AI Support Intelligence" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-cyan-300/25" />
            <div>
              <div className="font-black tracking-tight">AI Support Intelligence</div>
              <div className="text-xs text-cyan-200/80">Enterprise SaaS Platform</div>
            </div>
          </div>
          <GradientBadge icon={Cloud} tone="emerald" className="hidden sm:inline-flex">DynamoDB • Amazon Bedrock • QuickSight • AWS Cloud</GradientBadge>
        </header>

        <EnterpriseHero onCustomer={() => enterPortal('customer', '/customer/login')} onOrg={() => enterPortal('org', '/org/login')} />

        <section className="pb-16">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Separated Access Architecture</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">Choose the right portal to continue.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">Customers get a clean ticket experience. Organization users enter a secure role-based workspace for operations, analytics, and executive intelligence.</p>
          </div>
          <motion.div className="grid gap-6 lg:grid-cols-2" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
            {portals.map((portal) => (
              <motion.div key={portal.title} variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }}>
                <PremiumPortalCard {...portal} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="grid gap-5 pb-16 md:grid-cols-3">
          {[
            ['Customer Experience', 'Ticket creation, SLA tracking, history, and AI help are separated from internal operations.', Ticket],
            ['Organization Intelligence', 'Support Agent, Team Manager, and Business Executive roles share a secure data layer.', Users],
            ['AWS AI Fabric', 'DynamoDB, Lambda, Bedrock, and QuickSight support the enterprise analytics flow.', ShieldCheck],
          ].map(([value, label, Icon]) => (
            <GlassCard key={value} className="p-6">
              <Icon className="text-cyan-200" size={24} />
              <div className="mt-5 text-xl font-black text-white">{value}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{label}</p>
            </GlassCard>
          ))}
        </section>
      </main>
    </AnimatedBackground>
  );
}

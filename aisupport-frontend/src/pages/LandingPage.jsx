import { useNavigate } from 'react-router-dom';
import { BarChart3, Cloud, Headphones, UserCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/ai-support-logo.png';
import AnimatedBackground from '../components/premium/AnimatedBackground';
import EnterpriseHero from '../components/premium/EnterpriseHero';
import PremiumPortalCard from '../components/premium/PremiumPortalCard';
import GradientBadge from '../components/premium/GradientBadge';
import GlassCard from '../components/premium/GlassCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const portals = [
    {
      title: 'Customer Portal',
      description: 'Raise issues, track SLA, receive AI-guided updates, and stay connected to support outcomes.',
      features: ['Raise Ticket', 'Track SLA', 'AI Assistant', 'Ticket Updates'],
      icon: UserCircle,
      tone: 'purple',
      onClick: () => navigate('/customer/login'),
    },
    {
      title: 'Support Agent Portal',
      description: 'Prioritize assigned work with AI analysis, smart replies, and contextual support knowledge.',
      features: ['Assigned Tickets', 'AI Analysis', 'Smart Replies', 'Knowledge Assistant'],
      icon: Headphones,
      tone: 'blue',
      onClick: () => navigate('/org/login'),
    },
    {
      title: 'Team Manager Portal',
      description: 'Monitor SLA exposure, team throughput, operational quality, and dataset readiness.',
      features: ['SLA Monitoring', 'Team Analytics', 'Dataset Management', 'Operations Dashboard'],
      icon: Users,
      tone: 'emerald',
      onClick: () => navigate('/org/login'),
    },
    {
      title: 'Business Executive Portal',
      description: 'Turn support operations into strategic insight across revenue, churn risk, and customer health.',
      features: ['Revenue Insights', 'Churn Risk', 'Executive Analytics', 'Strategic AI Reports'],
      icon: BarChart3,
      tone: 'amber',
      onClick: () => navigate('/org/login'),
    },
  ];

  return (
    <AnimatedBackground>
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

        <EnterpriseHero onCustomer={() => navigate('/customer/login')} onOrg={() => navigate('/org/login')} />

        <section className="pb-16">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Role-Based Portals</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">One intelligence layer. Four premium workspaces.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">Built for enterprise support organizations that need operational speed, AI governance, and executive-ready analytics in one AWS-aligned experience.</p>
          </div>
          <motion.div className="grid gap-5 lg:grid-cols-4" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
            {portals.map((portal) => (
              <motion.div key={portal.title} variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }}>
                <PremiumPortalCard {...portal} cta={portal.title === 'Customer Portal' ? 'Enter Customer Portal' : 'Open Organization Portal'} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="grid gap-5 pb-16 md:grid-cols-3">
          {[
            ['2.4M+', 'Tickets processed through AI-assisted support workflows'],
            ['99.98%', 'Operational availability across AWS Cloud infrastructure'],
            ['42%', 'Average reduction in escalation review time'],
          ].map(([value, label]) => (
            <GlassCard key={value} className="p-6">
              <div className="text-4xl font-black gradient-text">{value}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{label}</p>
            </GlassCard>
          ))}
        </section>
      </main>
    </AnimatedBackground>
  );
}

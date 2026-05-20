import Layout from '../components/Layout';
import QuickSightEmbed from '../components/QuickSightEmbed';
import { AlertTriangle, BarChart3, BriefcaseBusiness, LineChart as LineIcon, Target, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tooltipStyle = { background: 'rgba(15,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' };

const executiveMetrics = [
  { label: 'Retention Opportunity', value: 'Rs 42.6 L', note: 'Recoverable revenue this quarter', icon: BriefcaseBusiness },
  { label: 'At-Risk Accounts', value: '512', note: 'Needs executive outreach', icon: AlertTriangle },
  { label: 'Sentiment Recovery', value: '+18%', note: 'Target for next 30 days', icon: TrendingUp },
  { label: 'Strategic Actions', value: '9', note: 'Ready for leadership review', icon: Target },
];

const portfolioTrend = [
  { date: 'W1', retention: 68, risk: 42, revenue: 54 },
  { date: 'W2', retention: 71, risk: 38, revenue: 58 },
  { date: 'W3', retention: 73, risk: 36, revenue: 62 },
  { date: 'W4', retention: 78, risk: 31, revenue: 69 },
  { date: 'W5', retention: 82, risk: 28, revenue: 74 },
];

const segmentRisk = [
  { segment: 'Enterprise', value: 38 },
  { segment: 'Premium', value: 28 },
  { segment: 'Growth', value: 20 },
  { segment: 'Standard', value: 14 },
];

const COLORS = ['#f87171', '#fbbf24', '#38bdf8', '#a78bfa'];

export default function ExecutiveAnalytics() {
  return (
    <Layout title="Executive Analytics">
      <div className="space-y-6 slide-in">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {executiveMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="card-glass rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
                    <p className="mt-2 text-xs text-emerald-300">{metric.note}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15">
                    <Icon size={20} className="text-blue-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="card-glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <LineIcon size={16} className="text-emerald-300" />
              <h3 className="text-sm font-semibold text-white">Portfolio Health Forecast</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={portfolioTrend}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="retention" stroke="#4ade80" fill="rgba(74,222,128,0.15)" name="Retention" />
                <Area type="monotone" dataKey="risk" stroke="#f87171" fill="rgba(248,113,113,0.12)" name="Risk" />
                <Area type="monotone" dataKey="revenue" stroke="#38bdf8" fill="rgba(56,189,248,0.14)" name="Revenue Protection" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card-glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users size={16} className="text-purple-300" />
              <h3 className="text-sm font-semibold text-white">Risk by Customer Segment</h3>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={segmentRisk} dataKey="value" nameKey="segment" innerRadius={52} outerRadius={78}>
                  {segmentRisk.map((entry, index) => <Cell key={entry.segment} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {segmentRisk.map((item, index) => (
                <div key={item.segment} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-400"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[index] }} />{item.segment}</span>
                  <span className="font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="card-glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-300" />
              <h3 className="text-sm font-semibold text-white">Executive Priority Mix</h3>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={[
                { name: 'Revenue', value: 74 },
                { name: 'Churn', value: 61 },
                { name: 'SLA', value: 48 },
                { name: 'Sentiment', value: 56 },
              ]}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-glow rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white">Leadership Actions</h3>
            <div className="mt-4 space-y-3">
              {[
                ['Retention Sprint', 'Assign customer success owners to the top 50 at-risk customers.'],
                ['Payment Recovery', 'Prioritize payment failure fixes before the next renewal cycle.'],
                ['Executive Outreach', 'Send a service recovery note to premium accounts with repeat tickets.'],
                ['Deflection Program', 'Expand self-service content for login, billing, and refund issues.'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <QuickSightEmbed role="business_executive" title="Executive Analytics QuickSight Workspace" height={520} />
      </div>
    </Layout>
  );
}

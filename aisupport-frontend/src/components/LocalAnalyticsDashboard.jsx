import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import demoAnalytics from '../data/demoAnalytics';
import { analyticsApi } from '../services/api';

const colors = ['#8b5cf6', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#e879f9', '#64748b'];
const tooltip = { background: 'rgba(10,12,28,0.96)', border: '1px solid rgba(148,163,184,0.22)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' };

const roleMap = {
  customer: 'supportAgentAnalytics',
  support_agent: 'supportAgentAnalytics',
  team_manager: 'teamManagerAnalytics',
  business_executive: 'businessExecutiveAnalytics',
  system_admin: 'supportAgentAnalytics',
};

const number = (value) => Number(value || 0).toLocaleString('en-IN');
const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const hasData = (rows) => Array.isArray(rows) && rows.length > 0 && rows.some((row) => (
  Object.entries(row).some(([key, value]) => key !== 'name' && key !== 'date' && Number(value) > 0)
));

const EmptyChart = ({ label = 'No data available' }) => (
  <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] text-sm text-slate-500">
    {label}
  </div>
);

const KpiCard = ({ label, value, detail, tone = 'purple' }) => {
  const tones = {
    purple: 'from-purple-500/20 to-fuchsia-500/5 text-purple-100 border-purple-300/20',
    blue: 'from-sky-500/20 to-blue-500/5 text-sky-100 border-sky-300/20',
    green: 'from-emerald-500/20 to-teal-500/5 text-emerald-100 border-emerald-300/20',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-100 border-amber-300/20',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-xl shadow-black/10 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
};

const ChartCard = ({ title, insight, children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {insight ? <p className="mt-1 text-xs leading-5 text-slate-400">{insight}</p> : null}
      </div>
    </div>
    {children}
  </div>
);

const DashboardHeader = ({ title, subtitle, onRefresh, loading }) => (
  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#12152e] to-[#17112b] p-6 shadow-2xl shadow-black/20">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Data synced from operational records</p>
        <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={loading} className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-60">
        {loading ? 'Refreshing...' : 'Refresh data'}
      </button>
    </div>
  </div>
);

export default function LocalAnalyticsDashboard({ role = 'support_agent' }) {
  const [serverAnalytics, setServerAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await analyticsApi.summary();
      setServerAnalytics(data);
    } catch (error) {
      setLoadError(error.timeout ? 'Analytics request timed out. Showing cached demo analytics.' : 'Analytics service is temporarily unavailable. Showing cached demo analytics.');
      setServerAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const analytics = serverAnalytics?.analytics || demoAnalytics;
  const support = analytics.supportAgentAnalytics || {};
  const manager = analytics.teamManagerAnalytics || {};
  const executive = analytics.businessExecutiveAnalytics || {};

  const priorityData = support.priorityDistribution || [];
  const trendData = support.statusTrend || [];
  const categoryData = support.categoryTrends || manager.categoryTrends || [];

  const view = roleMap[role] || 'supportAgentAnalytics';

  const title = useMemo(() => {
    if (view === 'teamManagerAnalytics') return 'Team Operations Dashboard';
    if (view === 'businessExecutiveAnalytics') return 'Executive Intelligence Dashboard';
    return 'Support Agent Intelligence Dashboard';
  }, [view]);

  const subtitle = useMemo(() => {
    if (view === 'teamManagerAnalytics') return 'Live workload, SLA breach, escalation, and agent performance metrics calculated from operational rows.';
    if (view === 'businessExecutiveAnalytics') return 'Revenue exposure, churn risk, CSAT, and regional business impact calculated from executive insight records.';
    return 'Ticket status, SLA health, priority mix, and latest customer issues calculated from support ticket records.';
  }, [view]);

  return (
    <div className="space-y-6">
      <DashboardHeader title={title} subtitle={subtitle} onRefresh={load} loading={loading} />
      {loadError ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {loadError}
        </div>
      ) : null}

      {view === 'businessExecutiveAnalytics' ? (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard label="Revenue Risk" value={money(executive.revenueRisk)} detail="Sum of actual revenue risk values." tone="amber" />
            <KpiCard label="Churn Risk" value={number(executive.churnRiskCustomers)} detail="Customers flagged by churn fields." tone="purple" />
            <KpiCard label="Average CSAT" value={Number(executive.customerSatisfaction || 0).toFixed(2)} detail="Average satisfaction score from records." tone="green" />
            <KpiCard label="Ticket Volume" value={number(executive.totalTickets)} detail="Operational volume represented in executive records." tone="blue" />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <ChartCard title="Revenue Risk by Region" insight="Ranked by summed revenue risk." className="xl:col-span-2">
              {hasData(executive.revenueRiskByRegion) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={executive.revenueRiskByRegion}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltip} formatter={(value) => money(value)} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="CSAT Trend" insight="Average CSAT by dataset month.">
              {hasData(executive.csatTrend) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={executive.csatTrend}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltip} />
                    <Line type="monotone" dataKey="csat" stroke="#22c55e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <ChartCard title="Top Business Issues" insight="Issue categories ranked from actual executive records.">
            {hasData(executive.churnByIssue) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={executive.churnByIssue}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltip} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </>
      ) : view === 'teamManagerAnalytics' ? (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard label="Open Tickets" value={number(manager.openTickets)} detail="Sum of open tickets across team records." tone="blue" />
            <KpiCard label="SLA Breaches" value={number(manager.slaBreachedTickets)} detail="Grouped from team manager breach fields." tone="amber" />
            <KpiCard label="Avg Resolution" value={`${Number(manager.averageResolutionTime || 0).toFixed(1)}h`} detail="Average resolution time from records." tone="purple" />
            <KpiCard label="Utilization" value={`${Number(manager.averageUtilization || 0).toFixed(1)}%`} detail="Average team utilization." tone="green" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="SLA Breaches by Team" insight="Teams ranked by actual breach counts.">
              {hasData(manager.teamPerformance) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={manager.teamPerformance}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltip} />
                    <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Top Agents by Resolved Tickets" insight="Agent ranking from resolved ticket counts.">
              {hasData(manager.agentWorkload) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={manager.agentWorkload}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltip} />
                    <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <ChartCard title="Escalation Trend" insight="Escalation queue summed by dataset month.">
            {hasData(manager.escalationTrend) ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={manager.escalationTrend}>
                  <defs>
                    <linearGradient id="escalationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltip} />
                  <Area type="monotone" dataKey="escalations" stroke="#f59e0b" fill="url(#escalationGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard label="Open Tickets" value={number(support.openTickets)} detail="Count where status is Open." tone="blue" />
            <KpiCard label="In Progress" value={number(support.inProgressTickets)} detail="Count where status is In Progress." tone="purple" />
            <KpiCard label="Resolved Latest Date" value={number(support.resolvedToday)} detail={`Resolved on ${support.latestDate || 'latest dataset date'}.`} tone="green" />
            <KpiCard label="SLA Compliance" value={`${Number(support.slaCompliance || 0).toFixed(1)}%`} detail="Percentage of rows without SLA breach." tone="amber" />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <ChartCard title="Ticket Status Trend" insight="Grouped by ticket date and status." className="xl:col-span-2">
              {hasData(trendData) ? (
                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="open" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="closed" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Priority Mix" insight="Distribution from actual priority labels.">
              {hasData(priorityData) ? (
                <ResponsiveContainer width="100%" height={270}>
                  <PieChart>
                    <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                      {priorityData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltip} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <ChartCard title="Top Issue Categories" insight="Ranked by actual issue category counts.">
              {hasData(categoryData) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltip} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Recent Tickets" insight="Latest tickets sorted by update date.">
              <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
                {(support.recentTickets || []).length ? support.recentTickets.slice(0, 6).map((ticket) => (
                  <div key={ticket.ticket_id || ticket._id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-xs font-bold text-cyan-200">{ticket.ticket_id || ticket.ticketId}</p>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">{ticket.priority}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{ticket.issue_category || ticket.subject}</p>
                    <p className="mt-1 text-xs text-slate-400">{ticket.customer_name || ticket.customer_email || 'Customer'} • {ticket.status}</p>
                  </div>
                )) : <EmptyChart label="No recent tickets available" />}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

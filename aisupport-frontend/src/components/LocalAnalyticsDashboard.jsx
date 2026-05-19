import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import demoAnalytics from '../data/demoAnalytics';

const colors = ['#8b5cf6', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
const tooltip = { background: 'rgba(15,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' };

const roleMap = {
  customer: 'supportAgentAnalytics',
  support_agent: 'supportAgentAnalytics',
  team_manager: 'teamManagerAnalytics',
  business_executive: 'businessExecutiveAnalytics',
  system_admin: 'systemAdminAnalytics',
};

export default function LocalAnalyticsDashboard({ role = 'support_agent' }) {
  const key = roleMap[role] || 'supportAgentAnalytics';
  const support = demoAnalytics.supportAgentAnalytics;
  const manager = demoAnalytics.teamManagerAnalytics;
  const executive = demoAnalytics.businessExecutiveAnalytics;
  const admin = demoAnalytics.systemAdminAnalytics;
  const priorityData = support.priorityDistribution || [];
  const categoryData = manager.categoryTrends || [];
  const trendData = support.statusTrend || executive.sentimentTrend || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-100">Support intelligence ready</p>
        <p className="text-xs text-emerald-200/80">{key.replace('Analytics', '').replace(/([A-Z])/g, ' $1').trim()}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Tickets', support.openTickets + support.inProgressTickets],
          ['SLA', `${support.slaCompliance}%`],
          ['Revenue Risk', `Rs ${Number(executive.revenueRisk).toLocaleString('en-IN')}`],
          ['Active Users', admin.activeUsers],
        ].map(([label, value]) => (
          <div key={label} className="card-glass rounded-xl p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-glass rounded-xl p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-white">Ticket Status Trend</h3>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltip} />
              <Line type="monotone" dataKey="open" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass rounded-xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Priority Mix</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" innerRadius={48} outerRadius={78}>
                {priorityData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Top Categories</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltip} />
            <Bar dataKey="value" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

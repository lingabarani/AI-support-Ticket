import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import { Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, Bot } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { tickets, ticketTrendData, priorityData } from '../data/dummyData';

const COLORS = ['#f87171', '#fbbf24', '#4ade80'];

const customTooltipStyle = {
  background: 'rgba(15,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)',
  borderRadius: '8px', color: '#e2e8f0', fontSize: '12px',
};

export default function AgentDashboard() {
  return (
    <Layout title="Agent Dashboard">
      <div className="space-y-6 slide-in">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Open Tickets" value="128" change="▲ 12.5%" changeType="negative" icon={Ticket} color="purple" />
          <KpiCard title="In Progress" value="64" change="▲ 8.4%" changeType="positive" icon={Clock} color="amber" />
          <KpiCard title="Resolved Today" value="72" change="▲ 15.7%" changeType="positive" icon={CheckCircle} color="green" />
          <KpiCard title="SLA Compliance" value="91%" change="▲ 4.6%" changeType="positive" icon={AlertTriangle} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets Trend */}
          <div className="lg:col-span-2 card-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Tickets by Status (Daily)</h3>
              <TrendingUp size={15} className="text-purple-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ticketTrendData}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="open" stroke="#a78bfa" strokeWidth={2} dot={false} name="Open" />
                <Line type="monotone" dataKey="resolved" stroke="#4ade80" strokeWidth={2} dot={false} name="Resolved" />
                <Line type="monotone" dataKey="inProgress" stroke="#fbbf24" strokeWidth={2} dot={false} name="In Progress" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Pie */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Tickets by Priority</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {priorityData.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {priorityData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-slate-400">{p.name}</span>
                  </div>
                  <span className="text-white font-medium">{p.value} ({Math.round(p.value/128*100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tickets Table */}
        <div className="card-glass rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-purple-900/20">
            <h3 className="font-semibold text-white text-sm">Recent Tickets</h3>
            <a href="/agent/tickets" className="text-xs text-purple-400 hover:text-purple-300">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th><th>Subject</th><th>Customer</th>
                  <th>Priority</th><th>Status</th><th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 7).map(t => (
                  <tr key={t.id}>
                    <td className="text-purple-400 font-mono text-xs">{t.id}</td>
                    <td className="text-slate-300">{t.subject}</td>
                    <td className="text-slate-400">{t.customer}</td>
                    <td><span className={`badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`badge-${t.status === 'In Progress' ? 'progress' : t.status === 'Pending Customer' ? 'pending' : t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td className="text-slate-500 text-xs">{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Response Time', value: '18.6 hrs', change: '▼ 4%', good: true },
            { label: 'First Response Time', value: '2.4 hrs', change: '▼ 6%', good: true },
            { label: 'Resolution Time', value: '24.2 hrs', change: '▼ 9%', good: true },
            { label: 'Customer Satisfaction', value: '4.2/5', change: '▲ 5%', good: true },
          ].map(m => (
            <div key={m.label} className="card-glass rounded-xl p-4">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="text-xl font-bold text-white mt-1">{m.value}</p>
              <p className={`text-xs mt-1 ${m.good ? 'text-green-400' : 'text-red-400'}`}>{m.change} vs yesterday</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

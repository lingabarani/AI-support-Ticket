import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import {
  Activity,
  Bell,
  Database,
  FileText,
  KeyRound,
  Mail,
  PlusCircle,
  Search,
  Settings,
  Shield,
  Ticket,
  UserCheck,
  Users,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ticketTrendData } from '../data/dummyData';

const tooltipStyle = { background: 'rgba(15,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' };

const quickActions = [
  { label: 'Add User', desc: 'Create new user', icon: PlusCircle },
  { label: 'Manage Roles', desc: 'View and edit roles', icon: UserCheck },
  { label: 'View Logs', desc: 'Access system logs', icon: FileText },
  { label: 'System Settings', desc: 'Configure platform', icon: Settings },
];

const userOverview = [
  { label: 'Active Users', value: '268', icon: Users },
  { label: 'New Users Today', value: '12', icon: PlusCircle },
  { label: 'Pending Invitations', value: '7', icon: Mail },
  { label: 'Admin Users', value: '8', icon: Shield },
];

const activities = [
  { text: 'New user registered', time: '2 min ago', color: 'purple' },
  { text: 'Role updated for support agent', time: '15 min ago', color: 'blue' },
  { text: 'Ticket priority changed', time: '1 hour ago', color: 'amber' },
  { text: 'System health check completed', time: '2 hours ago', color: 'green' },
];

const securityItems = [
  ['MFA Status', 'Enabled'],
  ['Role Policy', 'Active'],
  ['Suspicious Login', 'None'],
  ['Last Audit', 'Today'],
];

const health = [
  { service: 'API Gateway', status: 'Operational', score: '99.9%', icon: Activity },
  { service: 'DynamoDB Data Layer', status: 'Operational', score: '99.8%', icon: Database },
  { service: 'AI Engine Bedrock', status: 'Operational', score: '99.7%', icon: Activity },
  { service: 'QuickSight Embed', status: 'Pending', score: 'Setup', icon: FileText },
  { service: 'Email Service', status: 'Degraded', score: '97.2%', icon: Mail },
];

const statusStyle = {
  Operational: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20',
  Degraded: 'text-amber-300 bg-amber-500/10 border-amber-400/20',
  Pending: 'text-blue-300 bg-blue-500/10 border-blue-400/20',
};

export default function AdminDashboard() {
  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6 slide-in">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Monitor users, tickets, security, and platform health.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input placeholder="Search users, tickets, logs..." className="w-72 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-400/50" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 px-3 py-2 text-xs text-slate-300" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              System Online
            </div>
            <button className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
            </button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard title="Total Users" value="284" change="Up 8.3%" icon={Users} color="purple" />
          <KpiCard title="Active Tickets" value="1,254" change="Up 11.2%" icon={Ticket} color="blue" />
          <KpiCard title="Security Alerts" value="3" change="Down 2" changeType="positive" icon={Shield} color="red" />
          <KpiCard title="System Health" value="99.8%" change="Stable" icon={Activity} color="green" />
        </div>

        <section className="card-glass rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-300">Admin Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} className="group rounded-xl border border-white/10 p-4 text-left transition-all hover:-translate-y-1 hover:border-purple-400/40" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15">
                      <Icon size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{action.label}</div>
                      <div className="text-xs text-slate-400">{action.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="card-glass rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Platform Activity</h3>
              <span className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400">Last 30 Days</span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-b border-white/10 pb-4 md:grid-cols-4">
              {userOverview.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Icon size={17} className="mb-2 text-purple-300" />
                    <div className="text-xl font-bold text-white">{item.value}</div>
                    <div className="text-xs text-slate-400">{item.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketTrendData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="open" stroke="#a78bfa" strokeWidth={2} dot={false} name="Open Tickets" />
                  <Line type="monotone" dataKey="resolved" stroke="#38bdf8" strokeWidth={2} dot={false} name="Resolved Tickets" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <div className="mt-4 space-y-3">
              {activities.map((activity) => (
                <div key={activity.text} className="flex items-center justify-between rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${activity.color === 'green' ? 'bg-emerald-400' : activity.color === 'blue' ? 'bg-blue-400' : activity.color === 'amber' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                    <span className="text-sm text-slate-300">{activity.text}</span>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="card-glass rounded-2xl p-5">
            <h3 className="font-semibold text-white">Security & Access</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {securityItems.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <KeyRound size={19} className="mx-auto mb-2 text-blue-300" />
                  <div className="text-lg font-bold text-white">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <h3 className="font-semibold text-white">System Health</h3>
            <div className="mt-4 space-y-3">
              {health.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.service} className="flex items-center justify-between rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <Icon size={17} className="text-purple-300" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{item.service}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2 py-1 text-xs ${statusStyle[item.status]}`}>{item.status}</span>
                      <span className="text-xs text-slate-500">{item.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

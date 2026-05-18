import Layout from '../components/Layout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ticketTrendData, agents } from '../data/dummyData';

const tooltipStyle = {
  background: 'rgba(15,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)',
  borderRadius: '8px', color: '#e2e8f0', fontSize: '12px',
};

export default function AgentPerformance() {
  const metricsData = ticketTrendData.map(d => ({ ...d, resolved: d.resolved, target: 60 }));

  return (
    <Layout title="Performance Metrics">
      <div className="space-y-6 slide-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Resolved', value: '312', sub: 'This month', color: 'text-green-400' },
            { label: 'Avg Handle Time', value: '18.6 hrs', sub: '↓ 12% vs last month', color: 'text-blue-400' },
            { label: 'CSAT Score', value: '4.2/5', sub: '↑ 0.3 vs last month', color: 'text-purple-400' },
            { label: 'SLA Met', value: '92%', sub: '↑ 3% vs last month', color: 'text-amber-400' },
          ].map(m => (
            <div key={m.label} className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Daily Resolution vs Target</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metricsData}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="resolved" fill="#a78bfa" radius={[4,4,0,0]} name="Resolved" />
                <Line type="monotone" dataKey="target" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Team Leaderboard</h3>
            <div className="space-y-3">
              {agents.map((a, i) => (
                <div key={a.name} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: i === 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)' }}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-slate-400'}`}>#{i+1}</div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs text-white">{a.name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.tickets} tickets · {a.sla}% SLA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{a.resolved}</p>
                    <p className="text-xs text-slate-500">resolved</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

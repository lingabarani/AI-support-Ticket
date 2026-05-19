import Layout from '../components/Layout';
import QuickSightEmbed from '../components/QuickSightEmbed';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { categoryData } from '../data/dummyData';
import { Download } from 'lucide-react';

const tooltipStyle = { background: 'rgba(15,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' };

export default function ManagerReports() {
  return (
    <Layout title="Resolution Reports">
      <div className="space-y-6 slide-in">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            {['Overview','Tickets','Performance','Satisfaction','Custom'].map(t => (
              <button key={t} className={`px-3 py-1.5 rounded-lg ${t === 'Overview' ? 'btn-primary' : 'card-glass text-slate-400'}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">25 May 2024 - 31 May 2024</span>
            <button className="flex items-center gap-2 btn-primary px-4 py-2 rounded-lg text-xs font-semibold">
              <Download size={13} /> Export Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', value: '25,842', change: 'Up 12.9%' },
            { label: 'Open Tickets', value: '2,154', change: 'Down 8.7%' },
            { label: 'Resolved Tickets', value: '23,688', change: 'Up 14.3%' },
            { label: 'Resolution Rate', value: '91.6%', change: 'Up 2.1%' },
          ].map(m => (
            <div key={m.label} className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
              <p className="text-xs text-green-400 mt-1">{m.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Tickets by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#7c3aed" radius={[0,4,4,0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Tickets by Channel</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                {channel:'Web',value:8250},{channel:'Chat',value:6100},{channel:'Phone',value:4300},{channel:'Email',value:5200},{channel:'App',value:1992}
              ]}>
                <XAxis dataKey="channel" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4,4,0,0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <QuickSightEmbed role="team_manager" title="Team Manager QuickSight Reports" height={440} />
      </div>
    </Layout>
  );
}

import Layout from '../components/Layout';
import { agents } from '../data/dummyData';

export default function ManagerTeam() {
  return (
    <Layout title="My Team">
      <div className="slide-in">
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="p-5 border-b border-purple-900/20"><h3 className="font-semibold text-white text-sm">Team Members</h3></div>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Tickets</th><th>Resolved</th><th>SLA %</th><th>Status</th></tr></thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.name}>
                  <td><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs text-white">{a.name[0]}</div><span className="text-slate-300 text-sm">{a.name}</span></div></td>
                  <td className="text-slate-400 text-sm">{a.email}</td>
                  <td className="text-white font-medium">{a.tickets}</td>
                  <td className="text-green-400 font-medium">{a.resolved}</td>
                  <td><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-purple-400" style={{ width: `${a.sla}%` }} /></div><span className="text-xs text-slate-400">{a.sla}%</span></div></td>
                  <td><span className={`badge-${a.status === 'Active' ? 'resolved' : 'medium'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

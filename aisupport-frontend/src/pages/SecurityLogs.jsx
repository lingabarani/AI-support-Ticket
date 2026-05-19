import Layout from '../components/Layout';
import { Shield, AlertTriangle } from 'lucide-react';

const logs = [
  { id:1, event:'Failed login attempt', user:'unknown@gmail.com', ip:'103.45.67.89', time:'31 May 2024, 14:23', severity:'High' },
  { id:2, event:'User role changed', user:'priya@example.com', ip:'192.168.1.10', time:'31 May 2024, 13:10', severity:'Medium' },
  { id:3, event:'API key accessed', user:'lingabarani@example.com', ip:'10.0.0.5', time:'31 May 2024, 12:55', severity:'Low' },
  { id:4, event:'Mass ticket export', user:'rohan@example.com', ip:'10.0.0.8', time:'31 May 2024, 11:30', severity:'Medium' },
  { id:5, event:'Failed login attempt', user:'hacker@bad.com', ip:'45.12.34.56', time:'31 May 2024, 10:45', severity:'High' },
  { id:6, event:'Password reset', user:'anita@example.com', ip:'192.168.1.22', time:'31 May 2024, 09:15', severity:'Low' },
];

export default function SecurityLogs() {
  return (
    <Layout title="Security Logs">
      <div className="space-y-5 slide-in">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Security Alerts', value: '3', color: 'text-red-400', icon: AlertTriangle },
            { label: 'Failed Logins (24h)', value: '14', color: 'text-amber-400', icon: Shield },
            { label: 'Suspicious IPs', value: '2', color: 'text-red-400', icon: AlertTriangle },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="card-glass rounded-xl p-5 flex items-center gap-4">
                <Icon size={20} className={m.color} />
                <div>
                  <p className="text-xs text-slate-400">{m.label}</p>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card-glass rounded-xl overflow-hidden">
          <div className="p-5 border-b border-purple-900/20">
            <h3 className="font-semibold text-white text-sm">Audit Log</h3>
          </div>
          <table>
            <thead>
              <tr><th>Event</th><th>User</th><th>IP Address</th><th>Time</th><th>Severity</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="text-slate-300">{l.event}</td>
                  <td className="text-slate-400 text-sm">{l.user}</td>
                  <td className="text-slate-500 font-mono text-xs">{l.ip}</td>
                  <td className="text-slate-500 text-xs">{l.time}</td>
                  <td><span className={`badge-${l.severity.toLowerCase()}`}>{l.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

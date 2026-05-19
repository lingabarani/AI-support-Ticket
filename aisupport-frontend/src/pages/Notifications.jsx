import Layout from '../components/Layout';
import { Bell, Ticket, AlertTriangle, Bot, Settings } from 'lucide-react';
import { notifications } from '../data/dummyData';

const iconMap = { ticket: Ticket, sla: AlertTriangle, ai: Bot, system: Settings };
const colorMap = { ticket: 'text-purple-400', sla: 'text-red-400', ai: 'text-blue-400', system: 'text-slate-400' };

export default function Notifications() {
  return (
    <Layout title="Notifications">
      <div className="slide-in space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400">{notifications.filter(n => !n.read).length} unread notifications</h2>
          <button className="text-xs text-purple-400 hover:text-purple-300">Mark all as read</button>
        </div>

        <div className="card-glass rounded-xl overflow-hidden">
          {notifications.map((n, i) => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div key={n.id} className={`flex items-start gap-4 p-5 ${i < notifications.length - 1 ? 'border-b border-purple-900/10' : ''} ${!n.read ? 'bg-purple-900/10' : ''}`}>
                <div className={`w-9 h-9 rounded-xl card-glass flex items-center justify-center flex-shrink-0 ${colorMap[n.type]}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-purple-400 mt-1 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

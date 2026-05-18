import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { tickets } from '../data/dummyData';
import ChatbotWidget from '../components/ChatbotWidget';

export default function CustomerTickets() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/customer')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={15} /> Back to Home
        </button>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">My Tickets</h1>
            <p className="text-sm text-slate-400">Track your ticket status and responses.</p>
          </div>
          <button onClick={() => navigate('/customer/raise-ticket')} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">+ New Ticket</button>
        </div>

        <div className="card-glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Ticket ID</th><th>Subject</th><th>Status</th><th>Priority</th><th>Last Updated</th></tr>
              </thead>
              <tbody>
                {tickets.slice(0, 7).map(t => (
                  <tr key={t.id} className="cursor-pointer" onClick={() => navigate('/customer/raise-ticket')}>
                    <td className="text-purple-400 font-mono text-xs">{t.id}</td>
                    <td className="text-slate-300 font-medium">{t.subject}</td>
                    <td><span className={`badge-${t.status === 'In Progress' ? 'progress' : t.status === 'On Hold' ? 'medium' : t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td><span className={`badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td className="text-slate-500 text-xs">{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 card-glow rounded-xl p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Need help with a ticket?</h3>
            <p className="text-xs text-slate-400 mt-1">Submit a detailed ticket for the support team.</p>
          </div>
          <button onClick={() => navigate('/customer/raise-ticket')} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
            Raise Ticket
          </button>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowLeft, Bot, AlertTriangle, MessageSquare, Clock, CheckCircle, Zap, ChevronDown } from 'lucide-react';
import { tickets } from '../data/dummyData';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ai');
  const [note, setNote] = useState('');

  const ticket = tickets.find(t => t.id === id) || tickets[0];

  return (
    <Layout title="Ticket Details">
      <div className="slide-in space-y-5">
        {/* Back + Header */}
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4">
            <ArrowLeft size={15} /> Back to My Tickets
          </button>
          <div className="card-glass rounded-xl p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-400 font-mono text-sm font-semibold">{ticket.id}</span>
                  <span className="badge-open">Open</span>
                  <span className={`badge-${ticket.priority.toLowerCase()}`}>{ticket.priority} Priority</span>
                </div>
                <h2 className="text-xl font-bold text-white">{ticket.subject}</h2>
                <p className="text-sm text-slate-400 mt-1">Created At: 31 May 2024, 10:30 AM · Customer: {ticket.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <select className="px-3 py-2 text-sm rounded-lg text-slate-300">
                  <option>Update Status</option><option>Resolve</option><option>Escalate</option><option>On Hold</option>
                </select>
                <button className="px-4 py-2 rounded-lg text-xs font-semibold btn-primary">Resolve Ticket</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-5 border-b border-purple-900/20 pb-0">
              {['ai', 'communication', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  {tab === 'ai' ? 'AI Analysis' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Summary + RCA */}
            <div className="lg:col-span-2 space-y-4">
              {/* AI Summary */}
              <div className="card-glow rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={16} className="text-purple-400" />
                  <h3 className="font-semibold text-white text-sm">AI Summary</h3>
                  <span className="ml-auto text-xs text-purple-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)' }}>Powered by Bedrock</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Customer is unable to login even after resetting the password multiple times. Issue started after recent system update.
                </p>
              </div>

              {/* Root Cause */}
              <div className="card-glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-amber-400" />
                  <h3 className="font-semibold text-white text-sm">Root Cause (AI)</h3>
                </div>
                <p className="text-sm text-slate-400">
                  The recent authentication service update may be causing session expiration.
                </p>
              </div>

              {/* Internal Note */}
              <div className="card-glass rounded-xl p-5">
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <MessageSquare size={15} className="text-blue-400" /> Add Internal Note
                </h3>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add note for team members..."
                  className="w-full text-sm p-3 rounded-lg resize-none"
                />
                <button className="mt-2 btn-primary px-4 py-2 rounded-lg text-xs font-semibold">Save Note</button>
              </div>
            </div>

            {/* Right: Sentiment + AI Response */}
            <div className="space-y-4">
              {/* Sentiment */}
              <div className="card-glass rounded-xl p-5">
                <h3 className="font-semibold text-white text-sm mb-4">Sentiment</h3>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400 mb-1">Negative</div>
                  <div className="text-xs text-slate-400">Confidence: 92%</div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-red-400" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              {/* Priority Prediction */}
              <div className="card-glass rounded-xl p-5">
                <h3 className="font-semibold text-white text-sm mb-3">Priority Prediction</h3>
                <div className="space-y-2">
                  {[{label:'High',pct:78,color:'#f87171'},{label:'Medium',pct:15,color:'#fbbf24'},{label:'Low',pct:7,color:'#4ade80'}].map(p => (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{p.label}</span><span>{p.pct}%</span></div>
                      <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggested Response */}
              <div className="card-glow rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-yellow-400" />
                  <h3 className="font-semibold text-white text-sm">AI Suggested Response</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Hi Ankit, We sincerely apologize for the inconvenience. Our team is already looking into this issue. Please try clearing your cache and resetting your password. Let us know if the issue persists.
                </p>
                <button className="btn-primary w-full py-2 rounded-lg text-xs font-semibold">Use Response</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Communication History</h3>
            <div className="space-y-4">
              {[
                { from: ticket.customer, msg: 'I cannot login to my account since yesterday. I have tried resetting my password multiple times but it still does not work.', time: '31 May, 10:30 AM', isCustomer: true },
                { from: 'Anita Verma (Agent)', msg: 'Hi, Thank you for reaching out. We are looking into this issue. Could you please clear your browser cache and try again?', time: '31 May, 11:00 AM', isCustomer: false },
                { from: ticket.customer, msg: 'I tried clearing the cache but still same issue.', time: '31 May, 11:30 AM', isCustomer: true },
              ].map((m, i) => (
                <div key={i} className={`flex gap-3 ${!m.isCustomer ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs text-white flex-shrink-0">{m.from[0]}</div>
                  <div className={`max-w-md p-3 rounded-xl text-sm ${m.isCustomer ? 'card-glass' : 'card-glow'}`}>
                    <div className="text-xs text-slate-500 mb-1">{m.from} · {m.time}</div>
                    <p className="text-slate-300">{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Ticket History</h3>
            <div className="space-y-3">
              {[
                { action: 'Ticket created', by: ticket.customer, time: '31 May 2024, 10:30 AM' },
                { action: 'Assigned to Anita Verma', by: 'System', time: '31 May 2024, 10:31 AM' },
                { action: 'Status changed to In Progress', by: 'Anita Verma', time: '31 May 2024, 11:00 AM' },
                { action: 'Internal note added', by: 'Anita Verma', time: '31 May 2024, 11:15 AM' },
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">{h.action}</p>
                    <p className="text-xs text-slate-500">{h.by} · {h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

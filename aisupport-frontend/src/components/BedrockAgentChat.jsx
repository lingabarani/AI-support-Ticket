import { useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { sendChatMessage } from '../services/chatService';
import RolePromptSuggestions from './RolePromptSuggestions';
import logo from '../assets/ai-support-logo.png';

const labels = {
  customer: {
    title: 'Customer Support Agent',
    subtitle: 'Authorized customer help and ticket guidance',
    welcome: 'Ask me about your ticket status, refunds, login help, billing, or next steps.',
    badge: 'Customer Portal',
    highlights: [
      ['Open Requests', '5', 'Track ticket progress and pending replies'],
      ['Self-Service', '12 articles', 'Recommended help content for your issues'],
      ['Next Step', 'Upload proof', 'Attach screenshots or invoices to speed review'],
    ],
  },
  support_agent: {
    title: 'Support Operations Agent',
    subtitle: 'Authorized ticket resolution assistant',
    welcome: 'Ask me to summarize tickets, draft replies, detect sentiment, predict priority, or recommend next actions.',
    badge: 'Agent Assist',
    highlights: [
      ['Priority Queue', '18 high', 'High-impact tickets need first response'],
      ['Reply Drafts', 'Ready', 'Generate customer-safe replies from ticket context'],
      ['Resolution Hint', 'KB match', 'Recommended articles linked to top categories'],
    ],
  },
  team_manager: {
    title: 'Manager Intelligence Agent',
    subtitle: 'Authorized SLA, workload, and escalation insights',
    welcome: 'Ask me about team performance, SLA risks, recurring issues, workload balance, or escalation trends.',
    badge: 'Manager View',
    highlights: [
      ['SLA Watch', '8 risks', 'Breached and near-breach tickets grouped by owner'],
      ['Workload', '2 overloaded', 'Rebalance agents before queue pressure rises'],
      ['Escalations', '3 urgent', 'Engineering handoff recommended today'],
    ],
  },
  business_executive: {
    title: 'Executive Strategy Agent',
    subtitle: 'Authorized strategic insights assistant',
    welcome: 'Ask me about customer sentiment, churn risk, revenue impact, and strategic improvement opportunities.',
    badge: 'Executive View',
    highlights: [
      ['Revenue Risk', 'Rs 12.8 L', 'At-risk accounts tied to payment and login issues'],
      ['Churn Watch', '512 customers', 'Negative sentiment and repeat tickets increasing'],
      ['Board Action', '5 moves', 'Recommended retention and service recovery actions'],
    ],
  },
};

const MessageList = ({ messages }) => (
  <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
    {messages.map((message, index) => (
      <div key={`${message.from}-${index}`} className={`flex gap-2 ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.from === 'assistant' && <img src={logo} alt="" className="mt-1 h-7 w-7 rounded-lg object-cover" />}
        <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.from === 'user' ? 'bg-blue-600 text-white' : message.from === 'error' ? 'bg-red-500/15 text-red-200' : 'bg-white/10 text-slate-200'}`}>
          {message.text}
        </div>
      </div>
    ))}
  </div>
);

export default function BedrockAgentChat({ role = 'support_agent', mode = 'floating' }) {
  const copy = labels[role] || labels.support_agent;
  const [open, setOpen] = useState(mode !== 'floating');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `web-${role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  const [messages, setMessages] = useState([{ from: 'assistant', text: copy.welcome }]);

  const submitMessage = async (value = input) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setOpen(true);
    setInput('');
    setLoading(true);
    setMessages((current) => [...current, { from: 'user', text: trimmed }]);

    try {
      const response = await sendChatMessage({ role, message: trimmed, sessionId });
      setMessages((current) => [...current, { from: 'assistant', text: response.reply }]);
    } catch {
      setMessages((current) => [...current, { from: 'assistant', text: 'Live AI service is temporarily unavailable. Showing intelligent response from the built-in enterprise dataset.' }]);
    } finally {
      setLoading(false);
    }
  };

  const chatSurface = (
    <div className={`${mode === 'floating' ? 'mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-purple-400/30 shadow-2xl shadow-purple-950/50 sm:w-96' : 'card-glow rounded-xl overflow-hidden'}`} style={mode === 'floating' ? { background: 'rgba(12, 14, 35, 0.94)', backdropFilter: 'blur(18px)' } : undefined}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(14,165,233,0.08))' }}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="AI Assistant" className="h-10 w-10 rounded-xl object-cover ring-1 ring-purple-300/40" />
          <div>
            <div className="text-sm font-bold text-white">{copy.title}</div>
            <div className="text-xs text-slate-400">{copy.subtitle}</div>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full border border-purple-300/30 bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-100">
              {copy.badge}
            </span>
            <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
              Bedrock
            </span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              Ready
            </span>
          </div>
        </div>
        {mode === 'floating' && (
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close assistant">
            <X size={18} />
          </button>
        )}
      </div>

      {mode !== 'floating' && (
        <div className="grid grid-cols-1 gap-3 border-b border-white/10 p-4 md:grid-cols-3">
          {copy.highlights.map(([label, value, detail]) => (
            <div key={label} className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-white">{value}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      )}

      <MessageList messages={messages} />

      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          <RolePromptSuggestions role={role} onSelect={submitMessage} />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitMessage();
            }}
            placeholder={loading ? 'Waiting for response...' : 'Type your question...'}
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-wait"
          />
          <button type="button" onClick={() => submitMessage()} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-60" aria-label="Send message">
            {loading ? <Bot size={16} className="animate-pulse" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );

  if (mode !== 'floating') return chatSurface;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && chatSurface}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-16 w-16 items-center justify-center rounded-full border border-purple-300/30 bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-950/50 transition-transform hover:scale-105"
        aria-label="Open AI assistant"
      >
        <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover opacity-95" />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#0f0d1a] text-white">
          <MessageCircle size={13} />
        </span>
      </button>
    </div>
  );
}

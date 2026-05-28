import { useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import logo from '../assets/ai-support-logo.png';
import { chatApi } from '../services/api';

export default function BedrockAgentChat({ role = 'support_agent', mode = 'floating', placement = 'bottom-right' }) {
  const [open, setOpen] = useState(mode !== 'floating');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeoutState, setTimeoutState] = useState(false);
  const [sessionId] = useState(() => `web-${role}-${Date.now().toString(36)}`);
  const [messages, setMessages] = useState([
    { from: 'assistant', text: 'Ask about tickets, SLA risk, recommendations, next actions, or escalation status.' },
  ]);

  const sendMessage = async (value = input) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setOpen(true);
    setInput('');
    setLoading(true);
    setTimeoutState(false);
    setMessages((current) => [...current, { from: 'user', text: trimmed }]);
    try {
      const response = await chatApi.send({ role, message: trimmed, sessionId });
      setTimeoutState(Boolean(response.timeout));
      setMessages((current) => [...current, {
        from: 'assistant',
        text: response.reply || 'AI analysis is temporarily unavailable. Using rule-based support intelligence.',
      }]);
    } catch (error) {
      setTimeoutState(Boolean(error.timeout || /timed out/i.test(error.message || '')));
      setMessages((current) => [...current, {
        from: 'assistant',
        text: error.timeout || /timed out/i.test(error.message || '')
          ? 'The request timed out. You can retry, or ask a narrower ticket or analytics question.'
          : 'AI analysis is temporarily unavailable. Using rule-based support intelligence.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const surface = (
    <div className={`${mode === 'floating' ? 'mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-purple-400/30 shadow-2xl shadow-purple-950/50 sm:w-96' : 'card-glow overflow-hidden rounded-xl'}`} style={mode === 'floating' ? { background: 'rgba(12, 14, 35, 0.94)', backdropFilter: 'blur(18px)' } : undefined}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AI Assistant" className="h-10 w-10 rounded-xl object-cover ring-1 ring-purple-300/40" />
          <div>
            <div className="text-sm font-bold text-white">Bedrock Agent Chat</div>
            <div className="text-xs text-slate-400">Claude 3 Haiku support intelligence</div>
          </div>
        </div>
        {mode === 'floating' && (
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close assistant">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div key={`${message.from}-${index}`} className={`flex gap-2 ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.from === 'assistant' && <img src={logo} alt="" className="mt-1 h-7 w-7 rounded-lg object-cover" />}
            <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.from === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        {timeoutState && (
          <div className="mb-3 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Request timed out. Please retry or narrow the question.
          </div>
        )}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }}
            placeholder={loading ? 'Waiting for Bedrock...' : timeoutState ? 'Retry or ask a narrower question...' : 'Type your question...'}
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button type="button" onClick={() => sendMessage()} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white disabled:opacity-60" aria-label="Send message">
            {loading ? <Bot size={16} className="animate-pulse" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );

  if (mode !== 'floating') return surface;
  const position = placement === 'bottom-left' ? 'bottom-5 left-5' : 'bottom-5 right-5';
  return (
    <div className={`fixed ${position} z-50`}>
      {open && surface}
      <button type="button" onClick={() => setOpen((current) => !current)} className="group flex h-16 w-16 items-center justify-center rounded-full border border-purple-300/30 bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-950/50" aria-label="Open AI assistant">
        <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover opacity-95" />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#0f0d1a] text-white">
          <MessageCircle size={13} />
        </span>
      </button>
    </div>
  );
}

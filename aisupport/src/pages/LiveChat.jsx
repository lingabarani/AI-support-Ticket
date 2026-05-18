import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot } from 'lucide-react';

const initialMessages = [
  { id:1, from:'bot', text:'Hello! Welcome to AI Support. How can I help you today?', time:'10:00 AM' },
  { id:2, from:'user', text:'I am having trouble logging into my account.', time:'10:01 AM' },
  { id:3, from:'bot', text:'I understand that\'s frustrating. Let me help you with that. Could you please tell me when you last successfully logged in?', time:'10:01 AM' },
];

export default function LiveChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: input, time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    const botMsg = { id: Date.now()+1, from: 'bot', text: 'Thank you for your message. An agent will assist you shortly. For immediate help, please try clearing your browser cache and cookies.', time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    setMessages(m => [...m, userMsg, botMsg]);
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      {/* Header */}
      <div className="topbar px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/customer')} className="text-slate-400 hover:text-white"><ArrowLeft size={16} /></button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI Support Agent</div>
            <div className="flex items-center gap-1 text-xs text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />Online</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 ${m.from === 'bot' ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
              {m.from === 'bot' ? <Bot size={12} /> : 'U'}
            </div>
            <div className={`max-w-md px-4 py-3 rounded-2xl text-sm ${m.from === 'user' ? 'card-glow text-slate-200' : 'card-glass text-slate-300'}`}>
              <p>{m.text}</p>
              <p className="text-xs text-slate-500 mt-1">{m.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 max-w-3xl mx-auto w-full">
        <div className="flex gap-3 items-end card-glass rounded-2xl p-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type your message..."
            className="flex-1 border-0 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
            style={{ background: 'transparent !important', border: 'none !important' }}
          />
          <button onClick={send} className="btn-primary w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

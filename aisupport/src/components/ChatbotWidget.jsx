import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import logo from '../assets/ai-support-logo.png';

const welcomeMessage = {
  from: 'assistant',
  text: "Hi, I'm your AI Support Assistant. I can help you understand tickets, role dashboards, reports, and support workflows.",
};

const quickQuestions = [
  'How do I raise a ticket?',
  'How do I check ticket status?',
  'What does priority mean?',
  'How do I view reports?',
];

const getAssistantResponse = (question) => {
  const text = question.toLowerCase();

  if (text.includes('status')) {
    return 'Ticket status helps you understand whether a request is open, in progress, resolved, or closed.';
  }
  if (text.includes('priority')) {
    return 'Priority shows how urgent a ticket is. High-priority tickets should be handled first.';
  }
  if (text.includes('report') || text.includes('analytics')) {
    return 'Reports show ticket trends, sentiment, priority, and team performance.';
  }
  if (text.includes('role') || text.includes('dashboard')) {
    return 'Your role controls which dashboard, menus, and actions are available.';
  }
  if (text.includes('ai') || text.includes('assistant')) {
    return 'The AI assistant can help explain ticket insights, support workflows, and dashboard features.';
  }
  if (text.includes('ticket')) {
    return 'You can raise and track tickets from the ticket dashboard.';
  }

  return 'I can help with tickets, dashboards, reports, roles, and support workflow guidance.';
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([welcomeMessage]);

  const sendMessage = (value = input) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { from: 'user', text: trimmed },
      { from: 'assistant', text: getAssistantResponse(trimmed) },
    ]);
    setInput('');
    setOpen(true);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-purple-400/30 shadow-2xl shadow-purple-950/50 sm:w-96" style={{ background: 'rgba(12, 14, 35, 0.94)', backdropFilter: 'blur(18px)' }}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(14,165,233,0.08))' }}>
            <div className="flex items-center gap-3">
              <img src={logo} alt="AI Support Intelligence" className="h-10 w-10 rounded-xl object-cover ring-1 ring-purple-300/40" />
              <div>
                <div className="text-sm font-bold text-white">AI Support Assistant</div>
                <div className="text-xs text-slate-400">AI Support Intelligence</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close assistant">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`flex gap-2 ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.from === 'assistant' && <img src={logo} alt="" className="mt-1 h-7 w-7 rounded-lg object-cover" />}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.from === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200'}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  className="rounded-full border border-purple-400/30 px-3 py-1 text-xs text-purple-200 transition-colors hover:border-purple-300 hover:bg-purple-500/15"
                >
                  {question}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder="Type your question..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button type="button" onClick={() => sendMessage()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white transition-transform hover:scale-105" aria-label="Send message">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-16 w-16 items-center justify-center rounded-full border border-purple-300/30 bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-950/50 transition-transform hover:scale-105"
        aria-label="Open AI Support Assistant"
      >
        <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover opacity-95" />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#0f0d1a] text-white">
          <MessageCircle size={13} />
        </span>
      </button>
    </div>
  );
}

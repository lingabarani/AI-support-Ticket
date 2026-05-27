import { useMemo, useState } from 'react';
import { BarChart3, Bot, MessageSquareText, Send, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '../components/Layout';
import { enterpriseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const questions = [
  'Show SLA risk by category',
  'Which ticket category is driving volume?',
  'Summarize customer sentiment',
  'Where should managers focus today?',
];

const roleMap = {
  'Support Agent': 'support_agent',
  'Team Manager': 'team_manager',
  'Business Executive': 'business_executive',
  'System Admin': 'system_admin',
};

const normalizeChart = (records = []) => records
  .map((row, index) => ({
    name: row.name || row.ticketId || row.ticket_id || row.team || row.product || row.region || `Row ${index + 1}`,
    value: Number(row.value ?? row.openTickets ?? row.revenue ?? row.escalations ?? row.remainingHours ?? 0),
    compliance: Number(row.compliance || 0),
  }))
  .filter((row) => Number.isFinite(row.value) || Number.isFinite(row.compliance));

export default function ConversationalBI() {
  const { user } = useAuth();
  const [input, setInput] = useState(questions[0]);
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(false);
  const chartData = useMemo(() => normalizeChart(latest?.records), [latest]);

  const submit = (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setHistory((items) => [...items, { role: 'user', reply: question }]);
    setLoading(true);
    enterpriseApi.conversationalBI({ role: roleMap[user?.role] || 'team_manager', message: question })
      .then((payload) => {
        const answer = payload.answer || {};
        setLatest(answer);
        setHistory((items) => [...items, {
          role: 'assistant',
          title: answer.intent || 'BI Answer',
          reply: answer.reply || 'No answer was generated from the available analytics data.',
        }]);
      })
      .catch(() => {
        setHistory((items) => [...items, {
          role: 'assistant',
          title: 'BI unavailable',
          reply: 'Conversational BI data is unavailable right now. Upload datasets or connect MongoDB, then try again.',
        }]);
      })
      .finally(() => setLoading(false));
    setInput('');
  };

  return (
    <Layout title="Conversational BI">
      <div className="grid grid-cols-1 gap-5 slide-in xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText size={18} className="text-cyan-300" />
            <h1 className="text-lg font-black text-white">Conversational BI</h1>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {questions.map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-slate-300 hover:border-cyan-300/40"
              >
                {question}
              </button>
            ))}
          </div>

          <div className="h-[440px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
            {!history.length && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="text-slate-600" size={30} />
                <p className="mt-3 text-sm font-semibold text-white">Ask a BI question</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">Answers are generated from uploaded analytics data, QuickSight-ready datasets, or live ticket records.</p>
              </div>
            )}
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[84%] rounded-xl px-3 py-2 ${item.role === 'user' ? 'bg-cyan-500/20 text-cyan-50' : 'bg-white/[0.06] text-slate-300'}`}>
                  {item.role === 'assistant' && (
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-cyan-200">
                      <Bot size={13} /> {item.title}
                    </div>
                  )}
                  <p className="text-sm leading-6">{item.reply}</p>
                </div>
              </div>
            ))}
            {loading && <p className="text-sm text-cyan-300">Analyzing available data...</p>}
          </div>

          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
              placeholder="Ask about ticket volume, SLA risk, sentiment, or categories"
            />
            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-white hover:bg-cyan-400" aria-label="Send question">
              <Send size={18} />
            </button>
          </form>
        </section>

        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <p className="text-xs uppercase tracking-wider text-cyan-200">Current Answer</p>
              <p className="mt-2 text-3xl font-black text-white">{latest?.matchedRows ?? latest?.metrics?.rows ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">Supporting rows</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Rows Analyzed</p>
              <p className="mt-2 text-3xl font-black text-white">{latest?.source || 'None'}</p>
              <p className="mt-1 text-xs text-slate-400">Active data source</p>
            </div>
            <div className="rounded-xl border border-green-400/20 bg-green-400/10 p-4">
              <p className="text-xs uppercase tracking-wider text-green-200">BI Mode</p>
              <p className="mt-2 text-3xl font-black text-white">{latest ? 'Ready' : 'Idle'}</p>
              <p className="mt-1 text-xs text-slate-400">Athena/QuickSight-ready logic</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-cyan-300" />
                <h2 className="text-sm font-semibold text-white">Answer Breakdown</h2>
              </div>
              <TrendingUp size={17} className="text-green-300" />
            </div>
            <div className="h-[360px]">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="compliance" fill="#4ade80" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/15 text-sm text-slate-500">
                  Ask a question to populate supporting metrics.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

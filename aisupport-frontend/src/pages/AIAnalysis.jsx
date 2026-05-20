import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Bot, Zap, TrendingUp, AlertTriangle, Brain, Target } from 'lucide-react';
import { tickets } from '../data/dummyData';
import { pipelineApi } from '../services/api';

const AICard = ({ icon: Icon, title, badge, children, color = 'purple' }) => (
  <div className="card-glow rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className={color === 'yellow' ? 'text-yellow-400' : color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : 'text-purple-400'} />
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      {badge && <span className="text-xs px-2 py-0.5 rounded-full text-purple-300" style={{ background: 'rgba(139,92,246,0.2)' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const confidenceForTicket = (ticketId) => {
  const seed = String(ticketId).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 85 + (seed % 12);
};

export default function AIAnalysis() {
  const [pipeline, setPipeline] = useState({ status: 'Checking', config: null, records: [] });

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      pipelineApi.config(),
      pipelineApi.health(),
      pipelineApi.recentAnalytics(6),
    ]).then(([configResult, healthResult, analyticsResult]) => {
      if (!mounted) return;
      const health = healthResult.status === 'fulfilled' ? healthResult.value : null;
      setPipeline({
        status: health?.status === 'connected' ? 'Connected' : health?.status === 'degraded' ? 'Degraded' : 'Offline',
        config: configResult.status === 'fulfilled' ? configResult.value.config : null,
        records: analyticsResult.status === 'fulfilled' ? analyticsResult.value.records : [],
      });
    });
    return () => { mounted = false; };
  }, []);

  const liveTickets = pipeline.records.length ? pipeline.records : tickets.slice(0, 3);

  return (
    <Layout title="AI Ticket Analysis">
      <div className="space-y-6 slide-in">
        {/* Header Banner */}
        <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.3), rgba(14,165,233,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center">
              <Bot size={20} className="text-purple-300" />
            </div>
            <div>
              <h2 className="font-bold text-white">AI Insights Center</h2>
              <p className="text-xs text-slate-400">Real-time analysis connected to the AWS pipeline</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${pipeline.status === 'Connected' ? 'bg-green-400' : pipeline.status === 'Offline' ? 'bg-red-400' : 'bg-yellow-400'} pulse-slow`} />
              <span className={`text-xs ${pipeline.status === 'Connected' ? 'text-green-400' : pipeline.status === 'Offline' ? 'text-red-400' : 'text-yellow-400'}`}>AWS Pipeline: {pipeline.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AICard icon={Bot} title="Ticket Summarization" badge="Bedrock">
            <div className="space-y-3">
              {liveTickets.slice(0, 3).map(t => (
                <div key={t.ticket_id || t.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-400 font-mono">{t.ticket_id || t.id}</span>
                    <span className={`badge-${(t.priority || 'Medium').toLowerCase()}`}>{t.priority || 'Medium'}</span>
                  </div>
                  <p className="text-sm text-slate-300">{t.category || t.subject}</p>
                  <p className="text-xs text-slate-500 mt-1">AI: {t.ai_analysis_summary || t.ai_root_cause || `Customer reports persistent ${(t.subject || 'support').toLowerCase()} issue affecting service access.`}</p>
                </div>
              ))}
            </div>
          </AICard>

          <AICard icon={Brain} title="Sentiment Analysis" badge="NLP Engine" color="blue">
            <div className="space-y-3">
              {[
                { label: 'Negative', pct: 45, color: '#f87171' },
                { label: 'Neutral', pct: 32, color: '#94a3b8' },
                { label: 'Positive', pct: 23, color: '#4ade80' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-medium" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
              <div className="mt-3 p-3 rounded-lg text-xs text-slate-400" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                Alert: Negative sentiment increased by 18% due to login & payment issues
              </div>
            </div>
          </AICard>

          <AICard icon={Target} title="Priority Prediction" badge="ML Model" color="yellow">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Ticket</th><th>Subject</th><th>Predicted</th><th>Confidence</th></tr>
                </thead>
                <tbody>
                  {tickets.slice(0, 4).map(t => (
                    <tr key={t.id}>
                      <td className="text-purple-400 font-mono text-xs">{t.id}</td>
                      <td className="text-slate-400 text-xs">{t.subject}</td>
                      <td><span className={`badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td className="text-green-400 text-xs">{confidenceForTicket(t.id)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AICard>

          <AICard icon={AlertTriangle} title="Churn Prediction" badge="Risk Engine" color="green">
            <div className="space-y-3">
              {[
                { customer: 'Ankit Sharma', risk: 'High', pct: 78, reason: 'Login failures x 5' },
                { customer: 'Priya Singh', risk: 'Medium', pct: 52, reason: 'Payment issue pending' },
                { customer: 'Rahul Verma', risk: 'High', pct: 84, reason: 'Refund delayed 10 days' },
                { customer: 'Kavya Nair', risk: 'Low', pct: 18, reason: 'Positive sentiment' },
              ].map(c => (
                <div key={c.customer} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs text-white">{c.customer[0]}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-300">{c.customer}</span>
                      <span className={`badge-${c.risk.toLowerCase()}`}>{c.risk}</span>
                    </div>
                    <div className="text-xs text-slate-500">{c.reason}</div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: c.risk === 'High' ? '#f87171' : c.risk === 'Medium' ? '#fbbf24' : '#4ade80' }}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </AICard>

          <AICard icon={Zap} title="AI Recommendations" badge="Insights">
            <div className="space-y-3">
              {[
                'Resolve login issues immediately - 78 customers at high churn risk',
                'Escalate payment failures to engineering team for root cause',
                '512 customers are at high risk of churn - proactive outreach recommended',
                'Recommend improving login success rate and payment flow',
                'Timely resolution can prevent an estimated Rs 12.8 L revenue loss',
              ].map((rec, i) => (
                <div key={i} className="flex gap-2 p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)' }}>
                  <span className="text-purple-400 text-xs font-bold mt-0.5">{i + 1}.</span>
                  <span className="text-sm text-slate-300">{rec}</span>
                </div>
              ))}
            </div>
          </AICard>

          <AICard icon={TrendingUp} title="Root Cause Analysis" badge="Bedrock" color="blue">
            <div className="space-y-4">
              {[
                { issue: 'Login Failures', root: 'Auth service session timeout after v2.3.1 deploy', impact: 'High' },
                { issue: 'Payment Failures', root: 'Payment gateway timeout due to load spike', impact: 'High' },
                { issue: 'App Crashes', root: 'Memory leak in iOS v4.2 release', impact: 'Medium' },
              ].map(r => (
                <div key={r.issue} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white">{r.issue}</span>
                    <span className={`badge-${r.impact.toLowerCase()}`}>{r.impact}</span>
                  </div>
                  <p className="text-xs text-slate-400">{r.root}</p>
                </div>
              ))}
            </div>
          </AICard>
        </div>

        {/* Bedrock API Placeholder */}
        <div className="card-glass rounded-xl p-5">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <Bot size={15} className="text-purple-400" /> Amazon Bedrock Integration
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { endpoint: '/api/pipeline/health', status: pipeline.status },
              { endpoint: '/api/pipeline/tickets', status: 'Ready' },
              { endpoint: '/api/pipeline/analytics/recent', status: 'Ready' },
              { endpoint: pipeline.config?.bedrockModelId || 'Claude 3 Haiku', status: 'Model' },
            ].map(api => (
              <div key={api.endpoint} className="p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-green-400">{api.status}</span>
                </div>
                <p className="text-xs text-purple-300 font-mono">{api.endpoint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

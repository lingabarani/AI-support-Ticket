import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle2, Gauge, RadioTower, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import AIDecisionCard from '../components/AIDecisionCard';
import AgentWorkflowTimeline from '../components/AgentWorkflowTimeline';
import { enterpriseApi } from '../services/api';

const toCardDecision = (item) => ({
  title: item.title,
  ticketId: item.ticketId,
  decision: item.decision?.autoResolved ? 'auto_resolve' : item.decision?.escalationRequired ? 'escalate' : 'agent_review',
  riskScore: item.riskScore || 0,
  owner: item.owner || item.decision?.assignedTeam || 'Support Agent',
  slaStatus: item.sla?.status || 'on_track',
  reasons: [item.decision?.reason].filter(Boolean),
  actions: item.nextActions || [item.decision?.action].filter(Boolean),
});

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
    <Bot className="mx-auto text-slate-500" size={28} />
    <h2 className="mt-3 text-sm font-semibold text-white">No live command data</h2>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
  </div>
);

export default function AICommandCenter() {
  const [command, setCommand] = useState({ metrics: {}, decisions: [], slaSummary: {}, empty: true, source: 'loading' });
  const [status, setStatus] = useState('Loading');

  useEffect(() => {
    let mounted = true;
    enterpriseApi.commandCenter()
      .then((payload) => {
        if (!mounted) return;
        setCommand(payload);
        setStatus(payload.empty ? 'Empty' : 'Live');
      })
      .catch(() => {
        if (mounted) setStatus('Local');
      });
    return () => { mounted = false; };
  }, []);

  const decisions = command.decisions || [];
  const metrics = command.metrics || {};
  const averageRisk = Math.round(decisions.reduce((sum, item) => sum + Number(item.riskScore || 0), 0) / Math.max(decisions.length, 1));

  return (
    <Layout title="AI Command Center">
      <div className="space-y-6 slide-in">
        <section className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                <RadioTower size={14} /> Agentic operations
              </div>
              <h1 className="mt-2 text-2xl font-black text-white">AI Command Center</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">Live decisions across intake, categorization, resolution, automation, and governance.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
              <span className={`h-2 w-2 rounded-full ${status === 'Live' ? 'bg-green-400' : 'bg-amber-400'}`} />
              {status} data
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Tickets Scanned" value={metrics.totalTickets || 0} icon={Bot} color="blue" subtitle="Current decision queue" />
          <KpiCard title="Escalations" value={metrics.escalated || 0} icon={AlertTriangle} color="red" subtitle="Manager ownership" />
          <KpiCard title="Automation Rate" value={`${metrics.automationRate || 0}%`} icon={CheckCircle2} color="green" subtitle="Approved low-risk actions" />
          <KpiCard title="Average Risk" value={`${averageRisk}/100`} icon={Gauge} color="amber" subtitle="Decision engine score" />
        </div>

        <AgentWorkflowTimeline />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Decision Queue</h2>
              <Sparkles size={17} className="text-cyan-300" />
            </div>
            {decisions.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {decisions.slice(0, 6).map((decision) => (
                  <AIDecisionCard key={decision.ticketId} {...toCardDecision(decision)} />
                ))}
              </div>
            ) : (
              <EmptyState message="Connect MongoDB or create tickets to populate AI decisions." />
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={17} className="text-green-300" />
              <h2 className="text-sm font-semibold text-white">Supervisor Summary</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Highest risk ticket', value: decisions[0]?.ticketId || 'None' },
                { label: 'Primary owner', value: metrics.escalated ? 'Team Manager' : 'Support Agent' },
                { label: 'Supervisor queue', value: metrics.supervisorQueue || 0 },
                { label: 'Governance state', value: 'Policy checks active' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-3">
                  <span className="text-xs text-slate-400">{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <Activity size={15} /> Next action
              </div>
              <p className="text-sm leading-6 text-slate-300">{decisions[0]?.nextActions?.join(', ') || 'No active queue item.'}</p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

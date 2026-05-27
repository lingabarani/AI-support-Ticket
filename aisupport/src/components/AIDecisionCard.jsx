import { AlertTriangle, Bot, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

const toneMap = {
  auto_resolve: {
    icon: CheckCircle2,
    label: 'Auto Resolve',
    color: 'text-green-300',
    border: 'border-green-400/20',
    bg: 'bg-green-400/10',
  },
  escalate: {
    icon: AlertTriangle,
    label: 'Escalate',
    color: 'text-red-300',
    border: 'border-red-400/20',
    bg: 'bg-red-400/10',
  },
  agent_review: {
    icon: Clock,
    label: 'Agent Review',
    color: 'text-amber-300',
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/10',
  },
  monitor: {
    icon: ShieldCheck,
    label: 'Monitor',
    color: 'text-cyan-300',
    border: 'border-cyan-400/20',
    bg: 'bg-cyan-400/10',
  },
};

export default function AIDecisionCard({
  title,
  ticketId,
  decision = 'agent_review',
  riskScore = 0,
  owner = 'support_agent',
  slaStatus = 'on_track',
  reasons = [],
  actions = [],
}) {
  const tone = toneMap[decision] || toneMap.agent_review;
  const Icon = tone.icon || Bot;

  return (
    <article className={`rounded-xl border ${tone.border} bg-white/[0.035] p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-mono text-slate-500">{ticketId}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.color}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-black/20 p-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Decision</p>
          <p className={`mt-1 text-xs font-semibold ${tone.color}`}>{tone.label}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Risk</p>
          <p className="mt-1 text-xs font-semibold text-white">{riskScore}/100</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">SLA</p>
          <p className="mt-1 text-xs font-semibold text-cyan-200">{slaStatus.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs text-slate-400">Owner: <span className="font-medium text-slate-200">{owner.replace('_', ' ')}</span></p>
        {reasons.slice(0, 2).map((reason) => (
          <p key={reason} className="text-xs leading-5 text-slate-400">{reason}</p>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.slice(0, 3).map((action) => (
            <span key={action} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300">
              {action}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

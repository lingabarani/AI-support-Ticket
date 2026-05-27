import { Bot, CheckCircle2, GitBranch, RadioTower, Search, ShieldCheck, Wand2 } from 'lucide-react';

const defaultSteps = [
  { id: 'intake', label: 'Intake', status: 'complete', detail: 'Ticket normalized', icon: RadioTower },
  { id: 'categorize', label: 'Categorize', status: 'complete', detail: 'Priority and sentiment scored', icon: GitBranch },
  { id: 'root-cause', label: 'Root Cause', status: 'active', detail: 'Evidence matched', icon: Search },
  { id: 'decision', label: 'Decision', status: 'active', detail: 'Risk and SLA evaluated', icon: Bot },
  { id: 'automation', label: 'Automation', status: 'pending', detail: 'Plan awaiting approval', icon: Wand2 },
  { id: 'audit', label: 'Audit', status: 'pending', detail: 'Governance trail ready', icon: ShieldCheck },
];

const statusClass = {
  complete: 'border-green-400/40 bg-green-400/10 text-green-300',
  active: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  pending: 'border-white/10 bg-white/[0.035] text-slate-400',
  blocked: 'border-red-400/40 bg-red-400/10 text-red-300',
};

export default function AgentWorkflowTimeline({ steps = defaultSteps }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => {
          const Icon = step.icon || CheckCircle2;
          return (
            <div key={step.id || step.label} className="relative">
              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute left-[calc(50%+1.5rem)] top-5 hidden h-px w-[calc(100%-3rem)] bg-white/10 xl:block" />
              )}
              <div className={`relative rounded-xl border p-3 ${statusClass[step.status] || statusClass.pending}`}>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{step.label}</p>
                    <p className="truncate text-[11px]">{step.status}</p>
                  </div>
                </div>
                <p className="mt-3 min-h-8 text-xs leading-4 text-slate-400">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

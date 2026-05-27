import { useEffect, useState } from 'react';
import { ClipboardCheck, FileCheck2, LockKeyhole, ScrollText, ShieldAlert, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import AgentWorkflowTimeline from '../components/AgentWorkflowTimeline';
import { enterpriseApi } from '../services/api';

const policyChecks = [
  { name: 'Human approval for high-risk tickets', status: 'Active', owner: 'Team Manager', coverage: 94 },
  { name: 'Audit trail for automated actions', status: 'Active', owner: 'System', coverage: 100 },
  { name: 'PII redaction in audit metadata', status: 'Active', owner: 'Security', coverage: 98 },
  { name: 'SLA breach escalation', status: 'Review', owner: 'Operations', coverage: 87 },
];

export default function GovernanceCenter() {
  const [summary, setSummary] = useState({ metrics: {}, events: [], reviews: [], decisions: [] });
  const [status, setStatus] = useState('Loading');

  useEffect(() => {
    let mounted = true;
    enterpriseApi.governanceSummary()
      .then((payload) => {
        if (!mounted) return;
        setSummary(payload);
        setStatus('Live');
      })
      .catch(() => {
        if (mounted) setStatus('Unavailable');
      });
    return () => { mounted = false; };
  }, []);

  const metrics = {
    ...summary.metrics,
    coverage: Math.round(policyChecks.reduce((sum, item) => sum + item.coverage, 0) / policyChecks.length),
  };
  const auditRows = summary.events || [];

  const steps = [
    { id: 'policy', label: 'Policy', status: 'complete', detail: 'Rules loaded', icon: ShieldCheck },
    { id: 'decision', label: 'Decision', status: 'complete', detail: 'Risk scored', icon: ClipboardCheck },
    { id: 'approval', label: 'Approval', status: metrics.pendingReviews ? 'active' : 'complete', detail: `${metrics.pendingReviews || 0} items need review`, icon: ShieldAlert },
    { id: 'audit', label: 'Audit', status: 'complete', detail: 'Events retained', icon: ScrollText },
    { id: 'access', label: 'Access', status: 'complete', detail: 'Role scoped', icon: LockKeyhole },
    { id: 'evidence', label: 'Evidence', status: 'active', detail: 'Dataset linked', icon: FileCheck2 },
  ];

  return (
    <Layout title="Governance Center">
      <div className="space-y-6 slide-in">
        <section className="rounded-xl border border-green-400/20 bg-green-400/10 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-200">
                <ShieldCheck size={14} /> AI governance
              </div>
              <h1 className="mt-2 text-2xl font-black text-white">Governance Center</h1>
              <p className="mt-1 text-sm text-slate-400">Policy controls, approval gates, and audit evidence for agentic support actions.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-green-200">
              {status}: {metrics.coverage}% policy coverage
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Policy Checks" value={policyChecks.length} icon={ShieldCheck} color="green" subtitle="Active controls" />
          <KpiCard title="Audit Events" value={metrics.auditEvents || 0} icon={ScrollText} color="blue" subtitle="Recent decisions" />
          <KpiCard title="Needs Review" value={metrics.pendingReviews || 0} icon={ShieldAlert} color="amber" subtitle="Approval queue" />
          <KpiCard title="Rejected Automations" value={metrics.rejectedAutomations || 0} icon={LockKeyhole} color="red" subtitle="Restricted automation" />
        </div>

        <AgentWorkflowTimeline steps={steps} />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Policy Controls</h2>
            <div className="space-y-3">
              {policyChecks.map((policy) => (
                <div key={policy.name} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">Owner: {policy.owner}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] ${policy.status === 'Active' ? 'bg-green-400/10 text-green-300' : 'bg-amber-400/10 text-amber-300'}`}>
                      {policy.status}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${policy.coverage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Audit Trail</h2>
            {auditRows.length ? (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Outcome</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => (
                      <tr key={`${row.entityId}-${row.action}-${row.timestamp || row.createdAt}`}>
                        <td className="font-mono text-xs text-cyan-300">{row.entityId || '-'}</td>
                        <td className="text-xs text-slate-300">{row.action}</td>
                        <td className="text-xs text-slate-400">{row.actor}</td>
                        <td>
                          <span className={`rounded-full px-2 py-1 text-[11px] ${row.outcome === 'success' || row.outcome === 'ready' ? 'bg-green-400/10 text-green-300' : 'bg-amber-400/10 text-amber-300'}`}>
                            {String(row.outcome || 'logged').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{row.timestamp ? new Date(row.timestamp).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-8 text-center text-sm text-slate-500">
                No audit events have been recorded yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

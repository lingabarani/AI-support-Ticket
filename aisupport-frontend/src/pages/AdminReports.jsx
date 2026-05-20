import Layout from '../components/Layout';
import QuickSightEmbed from '../components/QuickSightEmbed';
import { Activity, AlertTriangle, Database, Download, FileText, ShieldCheck, Users } from 'lucide-react';

const reportStats = [
  { label: 'Audit Events', value: '18,420', note: 'Last 30 days', icon: Activity },
  { label: 'Active Users', value: '284', note: 'Across all roles', icon: Users },
  { label: 'Dataset Uploads', value: '37', note: 'Validated records', icon: Database },
  { label: 'Security Alerts', value: '3', note: 'Needs review', icon: AlertTriangle },
];

const reportSections = [
  'User access and role changes',
  'Dataset ingestion status',
  'Ticket lifecycle audit',
  'Security and compliance events',
  'System health and API usage',
];

export default function AdminReports() {
  return (
    <Layout title="Admin Reports">
      <div className="space-y-6 slide-in">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Admin Reports</h1>
            <p className="mt-1 text-sm text-slate-400">Operational reporting for access control, datasets, tickets, security, and platform health.</p>
          </div>
          <button className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <Download size={16} /> Export Summary
          </button>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportStats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="card-glass rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                    <p className="mt-2 text-xs text-emerald-300">{item.note}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15">
                    <Icon size={20} className="text-purple-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <QuickSightEmbed role="system_admin_reports" title="System Admin Reports Dashboard" height={520}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck size={16} className="text-emerald-300" /> Compliance Snapshot
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                This report view is focused on administrator decisions, user governance, dataset quality, and platform-level controls.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <FileText size={16} className="text-blue-300" /> Included Report Areas
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {reportSections.map((section) => (
                  <div key={section} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">
                    {section}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </QuickSightEmbed>
      </div>
    </Layout>
  );
}

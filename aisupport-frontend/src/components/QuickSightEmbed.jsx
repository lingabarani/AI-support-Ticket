import { useEffect, useState } from 'react';
import { BarChart3, Maximize2, RefreshCw } from 'lucide-react';
import { getQuickSightEmbedUrl } from '../services/quicksightService';
import LocalAnalyticsDashboard from './LocalAnalyticsDashboard';

export default function QuickSightEmbed({ role, title = 'Amazon QuickSight Analytics Dashboard', height = 420, children }) {
  const [state, setState] = useState({ embedUrl: '', loading: true, error: '' });

  useEffect(() => {
    let mounted = true;

    Promise.resolve()
      .then(() => {
        if (mounted) setState({ embedUrl: '', loading: true, error: '' });
        return getQuickSightEmbedUrl(role);
      })
      .then((url) => {
        if (!mounted) return;
        setState({ embedUrl: url, loading: false, error: '' });
      })
      .catch((err) => {
        if (!mounted) return;
        setState({ embedUrl: '', loading: false, error: err.message || 'Unable to load QuickSight dashboard.' });
      });

    return () => {
      mounted = false;
    };
  }, [role]);

  return (
    <div className="card-glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <BarChart3 size={15} className="text-blue-400" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex">
            <Maximize2 size={12} /> Resizable
          </span>
          <span className="text-xs text-blue-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}>QuickSight Embed</span>
        </div>
      </div>

      {children && <div className="mb-4">{children}</div>}

      {state.loading && (
        <div className="rounded-xl flex flex-col items-center justify-center gap-3" style={{ minHeight: 320, height, resize: 'both', overflow: 'auto', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.18)' }}>
          <RefreshCw size={24} className="text-blue-400 animate-spin" />
          <p className="text-sm text-slate-300">Loading secure QuickSight dashboard...</p>
        </div>
      )}

      {!state.loading && state.error && (
        <div className="space-y-4">
          <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-sm font-semibold text-emerald-100">QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.</p>
            <p className="mt-1 text-xs text-emerald-100/70">{state.error}</p>
          </div>
          <LocalAnalyticsDashboard role={role} />
        </div>
      )}

      {!state.loading && !state.error && state.embedUrl && (
        <div
          className="rounded-xl border border-blue-400/20 bg-[#0f0d1a]"
          style={{ minHeight: 360, height, resize: 'both', overflow: 'auto' }}
        >
          <iframe
            title={title}
            src={state.embedUrl}
            className="h-full w-full rounded-xl"
            style={{ minHeight: 360 }}
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

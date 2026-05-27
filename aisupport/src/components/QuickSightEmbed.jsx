import { useEffect, useState } from 'react';
import { BarChart3, Maximize2, RefreshCw } from 'lucide-react';
import { getQuickSightDashboard } from '../services/quicksightService';
import LocalAnalyticsDashboard from './LocalAnalyticsDashboard';

const EMBED_REFRESH_INTERVAL_MS = 55 * 60 * 1000;

const isNonEmbeddableQuickSightUrl = (url) => {
  const text = String(url || '');
  if (!text.includes('quicksight.aws.amazon.com')) return false;
  if (text.includes('/embed/share/')) return false;
  return text.includes('/sn/account/') && text.includes('/dashboards/');
};

export default function QuickSightEmbed({ role, title = 'Amazon QuickSight Analytics Dashboard', height = 420, children }) {
  const [state, setState] = useState({ embedUrl: '', loading: true, error: '', message: '', reason: '', canEmbed: false });

  useEffect(() => {
    let mounted = true;
    let refreshTimer;
    const currentUrl = new URL(window.location.href);

    if (currentUrl.hostname === '127.0.0.1') {
      currentUrl.hostname = 'localhost';
      window.location.replace(currentUrl.toString());
      return () => {
        mounted = false;
      };
    }

    const loadDashboard = ({ silent = false } = {}) => {
      if (!silent && mounted) {
        setState({ embedUrl: '', loading: true, error: '', message: '', reason: '', canEmbed: false });
      }

      return getQuickSightDashboard(role)
        .then((dashboard) => {
        if (!mounted) return;
        if (!dashboard.canEmbed || isNonEmbeddableQuickSightUrl(dashboard.embedUrl)) {
          setState({
            embedUrl: dashboard.embedUrl,
            loading: false,
            error: 'This QuickSight URL is a console dashboard link, not a browser iframe embed URL.',
            message: dashboard.message,
            reason: dashboard.reason,
            canEmbed: false,
          });
          return;
        }
        setState({ embedUrl: dashboard.embedUrl, loading: false, error: '', message: dashboard.message, reason: '', canEmbed: true });
      })
      .catch((err) => {
        if (!mounted) return;
        setState({ embedUrl: '', loading: false, error: err.message || 'Unable to load QuickSight dashboard.', message: '', reason: '', canEmbed: false });
      });
    };

    loadDashboard();
    refreshTimer = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, EMBED_REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [role]);

  return (
    <div className="card-glass rounded-xl p-5 pb-8">
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
            <p className="text-sm font-semibold text-emerald-100">QuickSight embedded dashboard is temporarily unavailable. Showing built-in analytics dashboard below.</p>
            <p className="mt-1 text-xs text-emerald-100/70">{state.message || state.error}</p>
            {state.reason && <p className="mt-1 text-xs text-amber-100/80">Backend embed reason: {state.reason}</p>}
            <p className="mt-2 text-[11px] text-slate-400">The in-page iframe requires a valid registered-user QuickSight embed URL from the backend.</p>
          </div>
          <LocalAnalyticsDashboard role={role} />
        </div>
      )}

      {!state.loading && !state.error && state.embedUrl && (
        <div
          className="rounded-xl border border-blue-400/20 bg-[#0f0d1a]"
          style={{ minHeight: 360, height, resize: 'both', overflow: 'auto', marginBottom: 16 }}
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

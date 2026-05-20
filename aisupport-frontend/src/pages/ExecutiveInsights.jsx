import Layout from '../components/Layout';
import QuickSightEmbed from '../components/QuickSightEmbed';
import { Lightbulb, TrendingUp, AlertTriangle, Star } from 'lucide-react';

export default function ExecutiveInsights() {
  return (
    <Layout title="Business Insights & AI Recommendations">
      <div className="space-y-6 slide-in">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: AlertTriangle, title: 'High Priority Alerts', items: ['Login service degradation impacting 5,200 users','Payment gateway latency spike – 380% above normal','3 enterprise customers at critical churn risk'], color: 'red' },
            { icon: TrendingUp, title: 'Growth Indicators', items: ['Customer acquisition up 22% MoM','Support volume increasing – may need capacity scaling','Self-service resolution rate at 34% – target 50%'], color: 'blue' },
            { icon: Star, title: 'Customer Experience', items: ['CSAT improved from 3.9 to 4.2 in 30 days','NPS score: 42 (up from 38 last quarter)','First contact resolution at 68% – improving'], color: 'amber' },
          ].map(s => {
            const Icon = s.icon;
            const borderColor = s.color === 'red' ? 'rgba(239,68,68,0.2)' : s.color === 'blue' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)';
            const iconColor = s.color === 'red' ? 'text-red-400' : s.color === 'blue' ? 'text-blue-400' : 'text-amber-400';
            return (
              <div key={s.title} className="card-glass rounded-xl p-5" style={{ border: `1px solid ${borderColor}` }}>
                <div className={`flex items-center gap-2 mb-4 ${iconColor}`}>
                  <Icon size={16} />
                  <h3 className="font-semibold text-white text-sm">{s.title}</h3>
                </div>
                <div className="space-y-2">
                  {s.items.map((item, i) => (
                    <div key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className={`mt-1 flex-shrink-0 ${iconColor}`}>•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed AI Recommendations */}
        <div className="card-glow rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb size={16} className="text-yellow-400" />
            <h3 className="font-semibold text-white">AI Strategic Recommendations</h3>
            <span className="ml-auto text-xs text-purple-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)' }}>Developed by Lingabarani</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { priority: 'Critical', title: 'Fix Authentication Service', detail: 'Deploy hot-patch for auth session timeout bug introduced in v2.3.1. ETA: 4 hours. Impact: Resolves 45% of current open tickets.', impact: '₹ 4.2 L saved' },
              { priority: 'High', title: 'Payment Gateway Optimization', detail: 'Scale payment gateway instances by 3x to handle peak load. Implement retry logic for failed transactions. Impact: 380 customers affected.', impact: '₹ 3.1 L saved' },
              { priority: 'High', title: 'Proactive Churn Outreach', detail: '512 customers identified as high churn risk. Recommend personalized outreach campaign with discount offer to top 100 accounts.', impact: '512 customers retained' },
              { priority: 'Medium', title: 'Self-Service Expansion', detail: 'Add 15 new KB articles covering top issue categories and guide users toward the ticket intake flow.', impact: '30% ticket reduction' },
            ].map(r => (
              <div key={r.title} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge-${r.priority === 'Critical' ? 'high' : r.priority === 'High' ? 'medium' : 'low'}`}>{r.priority}</span>
                  <span className="text-xs font-bold text-green-400">{r.impact}</span>
                </div>
                <h4 className="font-semibold text-white text-sm mb-1">{r.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <QuickSightEmbed role="business_executive" title="Revenue Analytics (QuickSight)" height={420}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ['Revenue at Risk', '₹ 12.8 L', 'Driven by login, payment, and delivery issues'],
              ['Critical Accounts', '43', 'Enterprise customers requiring proactive outreach'],
              ['Recovery Actions', '18', 'Recommendations ready for operations teams'],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </QuickSightEmbed>
      </div>
    </Layout>
  );
}

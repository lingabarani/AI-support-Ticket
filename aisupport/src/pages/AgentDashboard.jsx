import Layout from '../components/Layout';
import LocalAnalyticsDashboard from '../components/LocalAnalyticsDashboard';
import QuickSightEmbed from '../components/QuickSightEmbed';

export default function AgentDashboard() {
  return (
    <Layout title="Agent Dashboard">
      <div className="slide-in space-y-6">
        <LocalAnalyticsDashboard role="support_agent" />
        <QuickSightEmbed role="support_agent" title="Support Operations Intelligence Dashboard" height={440} />
      </div>
    </Layout>
  );
}

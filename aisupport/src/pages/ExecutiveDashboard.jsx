import Layout from '../components/Layout';
import LocalAnalyticsDashboard from '../components/LocalAnalyticsDashboard';
import QuickSightEmbed from '../components/QuickSightEmbed';

export default function ExecutiveDashboard() {
  return (
    <Layout title="Executive Dashboard">
      <div className="slide-in space-y-6">
        <LocalAnalyticsDashboard role="business_executive" />
        <QuickSightEmbed role="business_executive" title="Executive QuickSight Analytics Dashboard" height={460} />
      </div>
    </Layout>
  );
}

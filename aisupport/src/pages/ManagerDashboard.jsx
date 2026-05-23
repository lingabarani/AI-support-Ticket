import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LocalAnalyticsDashboard from '../components/LocalAnalyticsDashboard';

export default function ManagerDashboard() {
  return (
    <Layout title="Team Manager Dashboard">
      <div className="slide-in space-y-6">
        <div className="flex justify-end">
          <Link to="/team-manager/datasets" className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/20">
            Dataset Management
          </Link>
        </div>
        <LocalAnalyticsDashboard role="team_manager" />
      </div>
    </Layout>
  );
}

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import RoleSelect from './pages/RoleSelect';
import AgentDashboard from './pages/AgentDashboard';
import MyTickets from './pages/MyTickets';
import TicketDetail from './pages/TicketDetail';
import AIAnalysis from './pages/AIAnalysis';
import AICommandCenter from './pages/AICommandCenter';
import ConversationalBI from './pages/ConversationalBI';
import GovernanceCenter from './pages/GovernanceCenter';
import KnowledgeBase from './pages/KnowledgeBase';
import Notifications from './pages/Notifications';
import AgentPerformance from './pages/AgentPerformance';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerReports from './pages/ManagerReports';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ExecutiveInsights from './pages/ExecutiveInsights';
import CustomerHome from './pages/CustomerHome';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import CustomerMyTickets from './pages/customer/MyTickets';
import CustomerRaiseTicket from './pages/customer/RaiseTicket';
import CustomerTicketDetails from './pages/customer/TicketDetails';
import CustomerTrackTicket from './pages/customer/TrackTicket';
import OrgLogin from './pages/org/OrgLogin';
import OrgRegister from './pages/org/OrgRegister';
import TeamManagerDashboard from './pages/teamManager/TeamManagerDashboard';
import TeamManagerDataset from './pages/teamManager/DatasetManagement';
import Layout from './components/Layout';
import { agents } from './data/dummyData';

function GenericSettings({ title }) {
  return (
    <Layout title={title || 'Settings'}>
      <div className="slide-in max-w-2xl space-y-5">
        {['General', 'Notifications', 'Security', 'Appearance'].map(section => (
          <div key={section} className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">{section}</h3>
            <div className="space-y-3">
              {section === 'General' && (<>
                <div><label className="text-xs text-slate-400 block mb-1">Display Name</label><input className="w-full px-3 py-2.5 text-sm rounded-lg" defaultValue="Rohan Mehta" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Email</label><input className="w-full px-3 py-2.5 text-sm rounded-lg" defaultValue="rohan@example.com" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Timezone</label><select className="w-full px-3 py-2.5 text-sm rounded-lg"><option>Asia/Kolkata (IST)</option><option>UTC</option></select></div>
              </>)}
              {section === 'Notifications' && ['Email notifications','SLA breach alerts','New ticket alerts','Weekly reports'].map(opt => (
                <div key={opt} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{opt}</span>
                  <div className="w-10 h-5 rounded-full bg-purple-600 cursor-pointer" />
                </div>
              ))}
              {section === 'Security' && (<>
                <div><label className="text-xs text-slate-400 block mb-1">Current Password</label><input type="password" className="w-full px-3 py-2.5 text-sm rounded-lg" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">New Password</label><input type="password" className="w-full px-3 py-2.5 text-sm rounded-lg" /></div>
              </>)}
              {section === 'Appearance' && (
                <div className="flex items-center gap-3">
                  {['Dark','Light','System'].map(theme => (
                    <button key={theme} className={`px-4 py-2 rounded-lg text-sm ${theme==='Dark' ? 'btn-primary' : 'card-glass text-slate-400'}`}>{theme}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <button className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">Save Changes</button>
      </div>
    </Layout>
  );
}

function ManagerTeam() {
  return (
    <Layout title="My Team">
      <div className="slide-in">
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="p-5 border-b border-purple-900/20"><h3 className="font-semibold text-white text-sm">Team Members</h3></div>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Tickets</th><th>Resolved</th><th>SLA %</th><th>Status</th></tr></thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.name}>
                  <td><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs text-white">{a.name[0]}</div><span className="text-slate-300 text-sm">{a.name}</span></div></td>
                  <td className="text-slate-400 text-sm">{a.email}</td>
                  <td className="text-white font-medium">{a.tickets}</td>
                  <td className="text-green-400 font-medium">{a.resolved}</td>
                  <td><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-purple-400" style={{width:`${a.sla}%`}} /></div><span className="text-xs text-slate-400">{a.sla}%</span></div></td>
                  <td><span className={`badge-${a.status==='Active'?'resolved':'medium'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function ExecutiveReports() {
  return (
    <Layout title="Executive Reports">
      <div className="slide-in space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Q1 2024 Report','Q2 2024 Report','Monthly Summary May'].map(r => (
            <div key={r} className="card-glass rounded-xl p-5 hover:border-purple-500/30 transition-all cursor-pointer">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="font-semibold text-white text-sm">{r}</h3>
              <p className="text-xs text-slate-400 mt-1">PDF Report</p>
              <button className="mt-3 text-xs text-purple-400 hover:text-purple-300">Download →</button>
            </div>
          ))}
        </div>
        <div className="card-glass rounded-xl p-5">
          <h3 className="font-semibold text-white text-sm mb-3">QuickSight Dashboard Embed</h3>
          <div className="rounded-xl flex flex-col items-center justify-center" style={{height:280,background:'rgba(14,165,233,0.05)',border:'2px dashed rgba(14,165,233,0.2)'}}>
            <p className="text-sm font-semibold text-white">Amazon QuickSight</p>
            <p className="text-xs text-slate-400 mt-1">Executive analytics will be embedded here</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function AdminRoles() {
  return (
    <Layout title="Role Management">
      <div className="slide-in space-y-4">
        {['Support Agent','Team Manager','Business Executive','System Admin','Customer Portal User'].map((role, i) => (
          <div key={role} className="card-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">{role}</h3>
              <button className="text-xs text-purple-400 hover:text-purple-300">Edit Permissions</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['view_tickets','manage_tickets','view_analytics','manage_users','ai_access','export_reports'].slice(0, 2 + i % 4 + 1).map(perm => (
                <span key={perm} className="text-xs px-2 py-0.5 rounded" style={{background:'rgba(139,92,246,0.15)',color:'#a78bfa'}}>{perm}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

function AdminSystem() {
  return (
    <Layout title="System Analytics">
      <div className="slide-in space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{l:'CPU Usage',v:'34%'},{l:'Memory',v:'2.1 GB'},{l:'API Calls/hr',v:'1,240'},{l:'DB Connections',v:'18/50'}].map(m => (
            <div key={m.l} className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-400">{m.l}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.v}</p>
            </div>
          ))}
        </div>
        <div className="card-glass rounded-xl p-5">
          <h3 className="font-semibold text-white text-sm mb-3">Infrastructure (Terraform Ready)</h3>
          <div className="space-y-2">
            {['ECS Cluster: aisupport-cluster (running)','MongoDB Atlas: db.t3.medium (connected)','ALB: aisupport-alb (healthy)','Lambda: ai-processor (active)','S3: aisupport-uploads (enabled)','CloudFront: CDN (active)'].map(r => (
              <div key={r} className="flex items-center gap-2 text-sm text-slate-400 p-2 rounded" style={{background:'rgba(255,255,255,0.02)'}}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />{r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function RoleProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();
  const isCustomerArea = location.pathname.startsWith('/customer');
  const isOrgOnlyArea = !allowedRoles.includes('Customer Portal User');

  if (!user) return <Navigate to={isCustomerArea ? '/customer/login' : '/org/login'} replace />;
  if (!allowedRoles.includes(user.role)) {
    if (isOrgOnlyArea) return <Navigate to="/org/login" replace />;
    return <Navigate to={user.role === 'Customer Portal User' ? '/customer' : '/org/role-select'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="min-h-screen"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
    <Routes location={location}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/org/login" replace />} />
      <Route path="/register" element={<Navigate to="/org/register" replace />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route path="/org" element={<Navigate to="/org/login" replace />} />
      <Route path="/org/login" element={<OrgLogin />} />
      <Route path="/org/register" element={<OrgRegister />} />
      <Route path="/org/role-select" element={<RoleProtectedRoute allowedRoles={['Support Agent', 'Team Manager', 'Business Executive']}><RoleSelect /></RoleProtectedRoute>} />
      <Route path="/role-select" element={<Navigate to="/org/role-select" replace />} />
      <Route path="/ai-command-center" element={<Navigate to="/team-manager/ai-command-center" replace />} />
      <Route path="/conversational-bi" element={<Navigate to="/executive/conversational-bi" replace />} />
      <Route path="/root-cause-analyzer" element={<Navigate to="/executive/root-cause" replace />} />
      <Route path="/governance-center" element={<Navigate to="/team-manager/governance" replace />} />
      {/* Agent */}
      <Route path="/agent/dashboard" element={<RoleProtectedRoute allowedRoles={['Support Agent']}><AgentDashboard /></RoleProtectedRoute>} />
      <Route path="/agent" element={<RoleProtectedRoute allowedRoles={['Support Agent']}><AgentDashboard /></RoleProtectedRoute>} />
      <Route path="/agent/tickets" element={<RoleProtectedRoute allowedRoles={['Support Agent', 'Team Manager']}><MyTickets /></RoleProtectedRoute>} />
      <Route path="/agent/tickets/:id" element={<RoleProtectedRoute allowedRoles={['Support Agent', 'Team Manager']}><TicketDetail /></RoleProtectedRoute>} />
      <Route path="/agent/ai-analysis" element={<RoleProtectedRoute allowedRoles={['Support Agent']}><AIAnalysis /></RoleProtectedRoute>} />
      <Route path="/agent/knowledge" element={<RoleProtectedRoute allowedRoles={['Support Agent']}><KnowledgeBase /></RoleProtectedRoute>} />
      <Route path="/agent/notifications" element={<RoleProtectedRoute allowedRoles={['Support Agent']}><Notifications /></RoleProtectedRoute>} />
      <Route path="/agent/performance" element={<RoleProtectedRoute allowedRoles={['Support Agent', 'Team Manager']}><AgentPerformance /></RoleProtectedRoute>} />
      {/* Manager */}
      <Route path="/team-manager" element={<Navigate to="/team-manager/dashboard" replace />} />
      <Route path="/team-manager/dashboard" element={<RoleProtectedRoute allowedRoles={['Team Manager']}><TeamManagerDashboard /></RoleProtectedRoute>} />
      <Route path="/team-manager/sla" element={<RoleProtectedRoute allowedRoles={['Team Manager']}><AICommandCenter /></RoleProtectedRoute>} />
      <Route path="/team-manager/analytics" element={<RoleProtectedRoute allowedRoles={['Team Manager']}><AgentPerformance /></RoleProtectedRoute>} />
      <Route path="/team-manager/dataset-management" element={<RoleProtectedRoute allowedRoles={['Team Manager']}><TeamManagerDataset /></RoleProtectedRoute>} />
      <Route path="/team-manager/ai-command-center" element={<RoleProtectedRoute allowedRoles={['Team Manager']}><AICommandCenter /></RoleProtectedRoute>} />
      <Route path="/team-manager/governance" element={<RoleProtectedRoute allowedRoles={['Team Manager']}><GovernanceCenter /></RoleProtectedRoute>} />
      <Route path="/team-manager/sla-monitoring" element={<Navigate to="/team-manager/sla" replace />} />
      <Route path="/team-manager/all-tickets" element={<Navigate to="/agent/tickets" replace />} />
      <Route path="/team-manager/performance" element={<Navigate to="/team-manager/analytics" replace />} />
      <Route path="/team-manager/quicksight" element={<Navigate to="/team-manager/analytics" replace />} />
      <Route path="/manager/*" element={<Navigate to="/team-manager/dashboard" replace />} />
      {/* Executive */}
      <Route path="/executive" element={<RoleProtectedRoute allowedRoles={['Business Executive']}><ExecutiveDashboard /></RoleProtectedRoute>} />
      <Route path="/executive/dashboard" element={<RoleProtectedRoute allowedRoles={['Business Executive']}><ExecutiveDashboard /></RoleProtectedRoute>} />
      <Route path="/executive/conversational-bi" element={<RoleProtectedRoute allowedRoles={['Business Executive']}><ConversationalBI /></RoleProtectedRoute>} />
      <Route path="/executive/root-cause" element={<RoleProtectedRoute allowedRoles={['Business Executive']}><ConversationalBI /></RoleProtectedRoute>} />
      <Route path="/executive/insights" element={<RoleProtectedRoute allowedRoles={['Business Executive']}><ExecutiveInsights /></RoleProtectedRoute>} />
      <Route path="/executive/analytics" element={<Navigate to="/executive/conversational-bi" replace />} />
      <Route path="/executive/quicksight" element={<Navigate to="/executive/insights" replace />} />
      <Route path="/executive/reports" element={<Navigate to="/executive/insights" replace />} />
      <Route path="/executive/settings" element={<Navigate to="/executive/dashboard" replace />} />
      {/* Customer */}
      <Route path="/customer" element={<RoleProtectedRoute allowedRoles={['Customer Portal User']}><CustomerHome /></RoleProtectedRoute>} />
      <Route path="/customer/my-tickets" element={<RoleProtectedRoute allowedRoles={['Customer Portal User']}><CustomerMyTickets /></RoleProtectedRoute>} />
      <Route path="/customer/raise-ticket" element={<RoleProtectedRoute allowedRoles={['Customer Portal User']}><CustomerRaiseTicket /></RoleProtectedRoute>} />
      <Route path="/customer/track-ticket" element={<RoleProtectedRoute allowedRoles={['Customer Portal User']}><CustomerTrackTicket /></RoleProtectedRoute>} />
      <Route path="/customer/tickets/:id" element={<RoleProtectedRoute allowedRoles={['Customer Portal User']}><CustomerTicketDetails /></RoleProtectedRoute>} />
      <Route path="/customer/tickets" element={<Navigate to="/customer/my-tickets" replace />} />
      <Route path="/customer/faq" element={<Navigate to="/customer/track-ticket" replace />} />
      <Route path="/customer/feedback" element={<Navigate to="/customer" replace />} />
      {/* Admin */}
      <Route path="/admin/*" element={<Navigate to="/org/role-select" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

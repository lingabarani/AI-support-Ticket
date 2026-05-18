import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelect from './pages/RoleSelect';
import AgentDashboard from './pages/AgentDashboard';
import MyTickets from './pages/MyTickets';
import TicketDetail from './pages/TicketDetail';
import AIAnalysis from './pages/AIAnalysis';
import KnowledgeBase from './pages/KnowledgeBase';
import Notifications from './pages/Notifications';
import AgentPerformance from './pages/AgentPerformance';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerReports from './pages/ManagerReports';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ExecutiveInsights from './pages/ExecutiveInsights';
import CustomerHome from './pages/CustomerHome';
import RaiseTicket from './pages/RaiseTicket';
import CustomerTickets from './pages/CustomerTickets';
import FAQ from './pages/FAQ';
import Feedback from './pages/Feedback';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import SecurityLogs from './pages/SecurityLogs';
import AdminSettings from './pages/AdminSettings';
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
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/role-select' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/role-select" element={<ProtectedRoute><RoleSelect /></ProtectedRoute>} />
      {/* Agent */}
      <Route path="/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
      <Route path="/agent/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
      <Route path="/agent/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
      <Route path="/agent/ai-analysis" element={<ProtectedRoute><AIAnalysis /></ProtectedRoute>} />
      <Route path="/agent/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
      <Route path="/agent/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/agent/performance" element={<ProtectedRoute><AgentPerformance /></ProtectedRoute>} />
      {/* Manager */}
      <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/team" element={<ProtectedRoute><ManagerTeam /></ProtectedRoute>} />
      <Route path="/manager/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
      <Route path="/manager/performance" element={<ProtectedRoute><AgentPerformance /></ProtectedRoute>} />
      <Route path="/manager/reports" element={<ProtectedRoute><ManagerReports /></ProtectedRoute>} />
      <Route path="/manager/settings" element={<ProtectedRoute><GenericSettings title="Settings" /></ProtectedRoute>} />
      {/* Executive */}
      <Route path="/executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/executive/analytics" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/executive/reports" element={<ProtectedRoute><ExecutiveReports /></ProtectedRoute>} />
      <Route path="/executive/insights" element={<ProtectedRoute><ExecutiveInsights /></ProtectedRoute>} />
      <Route path="/executive/settings" element={<ProtectedRoute><GenericSettings title="Settings" /></ProtectedRoute>} />
      {/* Customer */}
      <Route path="/customer" element={<ProtectedRoute><CustomerHome /></ProtectedRoute>} />
      <Route path="/customer/raise-ticket" element={<ProtectedRoute><RaiseTicket /></ProtectedRoute>} />
      <Route path="/customer/tickets" element={<ProtectedRoute><CustomerTickets /></ProtectedRoute>} />
      <Route path="/customer/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
      <Route path="/customer/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute><AdminRoles /></ProtectedRoute>} />
      <Route path="/admin/security" element={<ProtectedRoute><SecurityLogs /></ProtectedRoute>} />
      <Route path="/admin/system" element={<ProtectedRoute><AdminSystem /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

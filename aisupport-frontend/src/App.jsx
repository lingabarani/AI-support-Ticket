import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const CustomerLogin = lazy(() => import('./pages/customer/CustomerLogin'));
const CustomerRegister = lazy(() => import('./pages/customer/CustomerRegister'));
const RaiseTicket = lazy(() => import('./pages/customer/RaiseTicket'));
const TrackTicket = lazy(() => import('./pages/customer/TrackTicket'));
const CustomerMyTickets = lazy(() => import('./pages/customer/MyTickets'));
const CustomerTicketDetails = lazy(() => import('./pages/customer/TicketDetails'));
const OrgLogin = lazy(() => import('./pages/org/OrgLogin'));
const OrgRegister = lazy(() => import('./pages/org/OrgRegister'));
const RoleSelect = lazy(() => import('./pages/org/RoleSelect'));
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));
const AgentTickets = lazy(() => import('./pages/agent/AgentTickets'));
const AgentTicketDetails = lazy(() => import('./pages/agent/TicketDetails'));
const AIAnalysis = lazy(() => import('./pages/AIAnalysis'));
const TeamManagerDashboard = lazy(() => import('./pages/teamManager/TeamManagerDashboard'));
const TeamManagerDataset = lazy(() => import('./pages/teamManager/DatasetManagement'));
const TeamManagerQuickSight = lazy(() => import('./pages/teamManager/TeamManagerQuickSight'));
const AgentPerformance = lazy(() => import('./pages/AgentPerformance'));
const ExecutiveDashboard = lazy(() => import('./pages/executive/ExecutiveDashboard'));
const ExecutiveAnalytics = lazy(() => import('./pages/ExecutiveAnalytics'));
const ExecutiveQuickSight = lazy(() => import('./pages/executive/ExecutiveQuickSight'));

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center bg-[#0f0d1a] text-sm text-slate-400">Loading...</div>;
}

function ProtectedRoute({ children, portal = 'org' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={portal === 'customer' ? '/customer/login' : '/org/login'} replace />;
  if (portal === 'customer' && user.role !== 'Customer Portal User') return <Navigate to="/customer/login" replace />;
  if (portal === 'org' && user.role === 'Customer Portal User') return <Navigate to="/org/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/raise-ticket" element={<ProtectedRoute portal="customer"><RaiseTicket /></ProtectedRoute>} />
        <Route path="/customer/track-ticket" element={<ProtectedRoute portal="customer"><TrackTicket /></ProtectedRoute>} />
        <Route path="/customer/my-tickets" element={<ProtectedRoute portal="customer"><CustomerMyTickets /></ProtectedRoute>} />
        <Route path="/customer/tickets/:ticketId" element={<ProtectedRoute portal="customer"><CustomerTicketDetails /></ProtectedRoute>} />

        <Route path="/org/login" element={<OrgLogin />} />
        <Route path="/org/register" element={<OrgRegister />} />
        <Route path="/org/role-select" element={<ProtectedRoute><RoleSelect /></ProtectedRoute>} />

        <Route path="/agent/dashboard" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
        <Route path="/agent/tickets" element={<ProtectedRoute><AgentTickets /></ProtectedRoute>} />
        <Route path="/agent/tickets/:id" element={<ProtectedRoute><AgentTicketDetails /></ProtectedRoute>} />
        <Route path="/agent/ai-analysis" element={<ProtectedRoute><AIAnalysis /></ProtectedRoute>} />

        <Route path="/team-manager/dashboard" element={<ProtectedRoute><TeamManagerDashboard /></ProtectedRoute>} />
        <Route path="/team-manager/all-tickets" element={<ProtectedRoute><AgentTickets /></ProtectedRoute>} />
        <Route path="/team-manager/performance" element={<ProtectedRoute><AgentPerformance /></ProtectedRoute>} />
        <Route path="/team-manager/dataset-management" element={<ProtectedRoute><TeamManagerDataset /></ProtectedRoute>} />
        <Route path="/team-manager/quicksight" element={<ProtectedRoute><TeamManagerQuickSight /></ProtectedRoute>} />

        <Route path="/executive/dashboard" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
        <Route path="/executive/analytics" element={<ProtectedRoute><ExecutiveAnalytics /></ProtectedRoute>} />
        <Route path="/executive/quicksight" element={<ProtectedRoute><ExecutiveQuickSight /></ProtectedRoute>} />

        <Route path="/login" element={<Navigate to="/org/login" replace />} />
        <Route path="/register" element={<Navigate to="/org/register" replace />} />
        <Route path="/role-select" element={<Navigate to="/org/role-select" replace />} />
        <Route path="/agent" element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="/manager" element={<Navigate to="/team-manager/dashboard" replace />} />
        <Route path="/executive" element={<Navigate to="/executive/dashboard" replace />} />
        <Route path="/customer" element={<Navigate to="/customer/my-tickets" replace />} />
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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

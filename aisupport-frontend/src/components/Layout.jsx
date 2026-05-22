import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatbotWidget from './ChatbotWidget';
import BedrockAgentChat from './BedrockAgentChat';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, title }) {
  const { user } = useAuth();
  const assistantRole = {
    'Support Agent': 'support_agent',
    'Team Manager': 'team_manager',
    'Business Executive': 'business_executive',
    'Customer Portal User': 'customer',
  }[user?.role] || 'support_agent';

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#050816]">
      <div className="pointer-events-none absolute inset-0 premium-grid opacity-30" />
      <div className="pointer-events-none absolute left-1/4 top-[-12rem] h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <BedrockAgentChat role={assistantRole} mode="card" />
          </div>
          {children}
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}

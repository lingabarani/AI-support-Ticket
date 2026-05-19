import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatbotWidget from './ChatbotWidget';

export default function Layout({ children, title }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0d1a]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}

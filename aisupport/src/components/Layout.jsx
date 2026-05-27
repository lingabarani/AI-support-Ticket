import Sidebar from './Sidebar';
import PlatformNavbar from './PlatformNavbar';
import ChatbotWidget from './ChatbotWidget';

export default function Layout({ children, title }) {
  return (
    <div className="flex h-screen max-w-full overflow-hidden bg-[#0f0d1a]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PlatformNavbar title={title} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}

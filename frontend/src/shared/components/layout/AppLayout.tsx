import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/app.store';

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#EEF2F7' }}>
      <Sidebar />
      <div className={`flex flex-1 min-w-0 flex-col transition-all ${sidebarOpen ? 'ml-[216px]' : 'ml-0'}`}>
        <Header />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

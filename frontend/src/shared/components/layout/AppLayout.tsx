import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/app.store';

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className={`flex flex-1 flex-col transition-all ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

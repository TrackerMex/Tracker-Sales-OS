import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Dashboard</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 09-dashboard</p>
    </div>
  );
}

export const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

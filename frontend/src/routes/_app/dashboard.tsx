import { createRoute, redirect } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { DashboardPage } from '@/modules/dashboard/presentation/pages/DashboardPage';

export const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  beforeLoad: () => {
    const stored = sessionStorage.getItem('tracker-sales-app');
    if (!stored) return;
    let role: string | undefined;
    try {
      role = JSON.parse(stored)?.state?.currentUser?.role;
    } catch {
      return;
    }
    if (role === 'Seller') throw redirect({ to: '/mi-dia' });
  },
  component: DashboardPage,
});

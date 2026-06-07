import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { DashboardPage } from '@/modules/dashboard/presentation/pages/DashboardPage';

export const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

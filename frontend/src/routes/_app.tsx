import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { AppLayout } from '../shared/components/layout/AppLayout';

export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  beforeLoad: () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) throw redirect({ to: '/login' });
  },
  component: AppLayout,
});

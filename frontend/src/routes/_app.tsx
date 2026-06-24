import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { AppLayout } from '../shared/components/layout/AppLayout';

export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      const redirectTo = location.pathname + location.search;
      throw redirect({
        to: '/login',
        search: redirectTo !== '/login' ? { redirect: redirectTo } : {},
      });
    }
  },
  component: AppLayout,
});
